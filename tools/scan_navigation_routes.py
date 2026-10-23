#!/usr/bin/env python3
"""
tools/scan_navigation_routes.py
Comprehensive Route & Navigation Integrity Scanner for Mapletyne CPO Platform.

Audits mapletyne-admin and mapletyne-chargeapp for:
1. Missing `/app/` prefix routing defects in Driver ChargeApp (ejecting users to operator admin or 404).
2. Dead anchor links (`href="#"`, `href=""`).
3. Orphaned routes and endpoints (specifically `/privacy` with zero inbound links).
4. Platform route registry inventory and reverse-proxy route compatibility.
"""

import os
import sys
import re
import json
import argparse
from typing import List, Dict, Any, Set
from collections import defaultdict


HREF_RE = re.compile(r'\bhref=[\'"]([^\'"]*)[\'"]', re.IGNORECASE)
FETCH_RE = re.compile(r'\bfetch\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', re.IGNORECASE)
WINDOW_LOC_RE = re.compile(r'\bwindow\.location(?:\.href)?\s*=\s*[\'"`]([^\'"`]+)[\'"`]', re.IGNORECASE)
REDIRECT_RE = re.compile(r'RedirectResponse\s*\(\s*(?:url\s*=\s*)?f?[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
REDIRECT_VAR_RE = re.compile(r'\b(?:redirect_url|target_url|dest_url)\s*=\s*f?[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
FASTAPI_ROUTE_RE = re.compile(r'@(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
REACT_ROUTE_RE = re.compile(r'<Route\s+[^>]*?path=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
ROUTER_LINK_RE = re.compile(r'<(?:Link|NavLink)\s+[^>]*?to=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)


def get_scope(file_path: str) -> str:
    norm = file_path.replace('\\', '/')
    if 'mapletyne-admin/src' in norm:
        return 'Admin Production (src/)'
    elif 'mapletyne-admin/stitch_opencpo_management_dashboard' in norm:
        return 'Admin Prototype (stitch/)'
    elif 'mapletyne-admin' in norm:
        return 'Admin App'
    elif 'mapletyne-chargeapp' in norm:
        return 'Driver ChargeApp (PWA)'
    return 'Other'


def extract_snippet(line: str, start: int, end: int, window: int = 40) -> str:
    s = max(0, start - window)
    e = min(len(line), end + window)
    prefix = "..." if s > 0 else ""
    suffix = "..." if e < len(line) else ""
    return prefix + line[s:e].strip() + suffix


def scan_chargeapp_routes(repo_root: str) -> List[Dict[str, Any]]:
    routes = []
    chargeapp_dir = os.path.join(repo_root, "mapletyne-chargeapp")

    for root, dirs, files in os.walk(chargeapp_dir):
        if "__pycache__" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith(".py"):
                p = os.path.join(root, file)
                rel_p = os.path.relpath(p, repo_root)
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    for idx, line in enumerate(f, 1):
                        m = FASTAPI_ROUTE_RE.search(line)
                        if m:
                            routes.append({
                                "file": rel_p,
                                "line": idx,
                                "method": m.group(1).upper(),
                                "path": m.group(2),
                                "expected_external_path": f"/app{m.group(2)}" if not m.group(2).startswith("/app") else m.group(2)
                            })
    return routes


def scan_admin_routes(repo_root: str) -> List[Dict[str, Any]]:
    routes = []
    app_tsx = os.path.join(repo_root, "mapletyne-admin", "src", "App.tsx")
    if not os.path.exists(app_tsx):
        return routes

    rel_p = os.path.relpath(app_tsx, repo_root)
    with open(app_tsx, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            for m in REACT_ROUTE_RE.finditer(line):
                routes.append({
                    "file": rel_p,
                    "line": idx,
                    "path": m.group(1),
                    "full_path": m.group(1) if m.group(1).startswith("/") else f"/{m.group(1)}"
                })
    return routes


def scan_navigation_defects(repo_root: str) -> Dict[str, Any]:
    chargeapp_routes = scan_chargeapp_routes(repo_root)
    admin_routes = scan_admin_routes(repo_root)

    missing_app_prefix_violations = []
    dead_anchors = []
    inbound_links_to_paths = defaultdict(list)

    targets = [
        os.path.join(repo_root, "mapletyne-chargeapp"),
        os.path.join(repo_root, "mapletyne-admin"),
    ]

    scanned_files_count = 0
    scanned_exts = ('.html', '.js', '.jsx', '.ts', '.tsx', '.py', '.css')

    for target in targets:
        for root, dirs, files in os.walk(target):
            dirs[:] = [
                d for d in dirs
                if d not in ('node_modules', 'dist', '.git', '__pycache__', '.vite-temp', 'stitch_opencpo_management_dashboard')
            ]
            for file in files:
                if file == 'leaflet.js':
                    continue
                if file.endswith(scanned_exts):
                    scanned_files_count += 1
                    fp = os.path.join(root, file)
                    rel_p = os.path.relpath(fp, repo_root)
                    scope = get_scope(rel_p)

                    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                        for idx, line in enumerate(f, 1):
                            # In ChargeApp: Check for missing /app prefix in links
                            if 'mapletyne-chargeapp' in rel_p:
                                # 1. Href checks
                                for m in HREF_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url.startswith('/') and not url.startswith(('/app', '/static')):
                                        # Root / or internal route missing /app/
                                        missing_app_prefix_violations.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Missing /app Prefix in Href",
                                            "url": url,
                                            "recommended_url": f"/app{url}" if url != "/" else "/app/",
                                            "severity": "CRITICAL" if url == "/" else "HIGH",
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "impact": "Ejects driver to Operator Admin SPA" if url == "/" else "Bypasses ChargeApp ingress, routes to Core or 404",
                                            "scope": scope
                                        })
                                    elif url == '#' or url == '':
                                        dead_anchors.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Dead Anchor (#)",
                                            "url": url,
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "remediation": "Provide valid route href or replace <a> with accessible <button>",
                                            "scope": scope
                                        })
                                    else:
                                        inbound_links_to_paths[url].append(f"{rel_p}:{idx}")

                                # 2. Fetch checks
                                for m in FETCH_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url.startswith('/') and not url.startswith(('/app', '/static')):
                                        missing_app_prefix_violations.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Missing /app Prefix in Client Fetch",
                                            "url": url,
                                            "recommended_url": f"/app{url}",
                                            "severity": "HIGH",
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "impact": "Client fetch bypasses /app ingress, returns 404 from Nginx/Core",
                                            "scope": scope
                                        })

                                # 3. Window location assignments
                                for m in WINDOW_LOC_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url.startswith('/') and not url.startswith(('/app', '/static')):
                                        missing_app_prefix_violations.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Missing /app Prefix in JS Navigation",
                                            "url": url,
                                            "recommended_url": f"/app{url}",
                                            "severity": "CRITICAL" if url == "/" else "HIGH",
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "impact": "JS navigation sends browser to non-existent root path or operator SPA",
                                            "scope": scope
                                        })

                                # 4. Python RedirectResponse & redirect_url assignments
                                for m in REDIRECT_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url.startswith('/') and not url.startswith(('/app', '/static')):
                                        missing_app_prefix_violations.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Missing /app Prefix in Python RedirectResponse",
                                            "url": url,
                                            "recommended_url": f"/app{url}",
                                            "severity": "HIGH",
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "impact": "HTTP 302 redirect sends driver's browser to operator SPA 404",
                                            "scope": scope
                                        })
                                for m in REDIRECT_VAR_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url.startswith('/') and not url.startswith(('/app', '/static')):
                                        missing_app_prefix_violations.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Missing /app Prefix in Redirect Variable",
                                            "url": url,
                                            "recommended_url": f"/app{url}",
                                            "severity": "HIGH",
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "impact": "Redirect variable passed to RedirectResponse sends browser to operator SPA 404",
                                            "scope": scope
                                        })

                            # In Admin: Check for dead anchors and record router links
                            elif 'mapletyne-admin' in rel_p:
                                for m in HREF_RE.finditer(line):
                                    url = m.group(1).strip()
                                    if url == '#' or url == '':
                                        dead_anchors.append({
                                            "file": rel_p,
                                            "line": idx,
                                            "type": "Dead Anchor (#)",
                                            "url": url,
                                            "snippet": extract_snippet(line, m.start(), m.end()),
                                            "remediation": "Replace dead anchor with semantic action button or valid route",
                                            "scope": scope
                                        })
                                    else:
                                        inbound_links_to_paths[url].append(f"{rel_p}:{idx}")

                                for m in ROUTER_LINK_RE.finditer(line):
                                    url = m.group(1).strip()
                                    inbound_links_to_paths[url].append(f"{rel_p}:{idx}")

    # Check for Orphaned Routes in ChargeApp
    orphaned_routes = []
    for r in chargeapp_routes:
        path = r["path"]
        # Skip API endpoints and internal technical routes
        if path.startswith("/api") or path in ("/health", "/manifest.json", "/sw.js", "/sitemap.xml", "/refresh", "/skin/{filename:path}"):
            continue
        # Check inbound links to path, path without leading slash, or /app + path
        variations = [path, f"/app{path}", path.lstrip("/")]
        has_inbound = any(v in inbound_links_to_paths for v in variations)
        if not has_inbound and not any(p in path for p in ("{", ":")):
            orphaned_routes.append({
                "path": path,
                "file": r["file"],
                "line": r["line"],
                "inbound_count": 0,
                "severity": "MEDIUM",
                "notes": f"Route '{path}' has zero static inbound links across templates."
            })

    return {
        "scanned_files_count": scanned_files_count,
        "chargeapp_routes_count": len(chargeapp_routes),
        "admin_routes_count": len(admin_routes),
        "missing_app_prefix_violations": missing_app_prefix_violations,
        "dead_anchors": dead_anchors,
        "orphaned_routes": orphaned_routes,
        "chargeapp_routes": chargeapp_routes,
        "admin_routes": admin_routes
    }


def format_markdown_report(data: Dict[str, Any]) -> str:
    lines = [
        "# Programmatic Navigation & Route Integrity Audit Report",
        "",
        "- **Architecture**: Multi-Service Ingress Routing via Nginx (`/app/` -> ChargeApp, `/` -> Admin, `/api/` -> Core)",
        "- **Total Files Scanned**: " + str(data["scanned_files_count"]),
        "- **Total ChargeApp Registered Endpoints**: " + str(data["chargeapp_routes_count"]),
        "- **Total Admin Registered Routes**: " + str(data["admin_routes_count"]),
        "- **Missing `/app/` Prefix Violations**: " + str(len(data["missing_app_prefix_violations"])),
        "- **Dead Anchors (`href=\"#\"`)**: " + str(len(data["dead_anchors"])),
        "- **Orphaned Routes**: " + str(len(data["orphaned_routes"])),
        "",
        "## 1. Missing `/app/` Prefix Violations (ChargeApp Ingress Integrity)",
        "",
        "Under Nginx edge routing, any route in `mapletyne-chargeapp` that is not prefixed with `/app/` escapes the container boundary and is routed to `mapletyne-admin` (dumping drivers into the operator login screen) or to `mapletyne-core` (resulting in HTTP 404 Not Found).",
        "",
        "| # | Severity | File Path | Line | Violation Type | Broken Target URL | Recommended URL | Impact | Code Snippet |",
        "|---|---|---|---:|---|---|---|---|---|"
    ]

    for idx, v in enumerate(data["missing_app_prefix_violations"], start=1):
        sev_badge = f"**{v['severity']}**" if v['severity'] == 'CRITICAL' else v['severity']
        snippet_esc = v['snippet'].replace('|', '\\|')
        if len(snippet_esc) > 65:
            snippet_esc = snippet_esc[:62] + "..."
        lines.append(
            f"| {idx} | {sev_badge} | `{v['file']}` | {v['line']} | {v['type']} | `{v['url']}` | `{v['recommended_url']}` | {v['impact']} | `{snippet_esc}` |"
        )

    lines.append("")
    lines.append("## 2. Dead Anchors Inventory (`href=\"#\"`)")
    lines.append("")
    lines.append("| # | Scope | File Path | Line | Token | Remediation | Code Snippet |")
    lines.append("|---|---|---|---:|---|---|---|")

    for idx, a in enumerate(data["dead_anchors"], start=1):
        snippet_esc = a['snippet'].replace('|', '\\|')
        if len(snippet_esc) > 75:
            snippet_esc = snippet_esc[:72] + "..."
        lines.append(
            f"| {idx} | {a['scope']} | `{a['file']}` | {a['line']} | `href=\"{a['url']}\"` | {a['remediation']} | `{snippet_esc}` |"
        )

    lines.append("")
    lines.append("## 3. Orphaned Routes Analysis")
    lines.append("")
    lines.append("| Route Path | Method | Source File | Line | Inbound Links | Severity | Diagnostic Assessment & Remediation |")
    lines.append("|---|---|---|---:|---:|---|---|")

    for o in data["orphaned_routes"]:
        lines.append(
            f"| `{o['path']}` | GET | `{o['file']}` | {o['line']} | {o['inbound_count']} | **{o['severity']}** | {o['notes']} |"
        )

    lines.append("")
    lines.append("## 4. Platform Route Registry Coverage")
    lines.append("")
    lines.append("### A. `mapletyne-admin` App.tsx Routes")
    lines.append("")
    lines.append("| # | Route Path | Defined in File | Line |")
    lines.append("|---|---|---|---:|")
    for idx, r in enumerate(data["admin_routes"], start=1):
        lines.append(f"| {idx} | `{r['path']}` | `{r['file']}` | {r['line']} |")

    lines.append("")
    lines.append("### B. `mapletyne-chargeapp` FastAPI Routes")
    lines.append("")
    lines.append("| # | Method | Path | Expected Reverse Proxy Ingress URL | Handler Location |")
    lines.append("|---|---|---|---|---|")
    for idx, r in enumerate(data["chargeapp_routes"], start=1):
        lines.append(f"| {idx} | `{r['method']}` | `{r['path']}` | `{r['expected_external_path']}` | `{r['file']}:{r['line']}` |")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Scan frontends for routing, missing /app prefix, and dead anchors.")
    parser.add_argument("--root", default="/home/danielaroko/applications/mapletynecpo", help="Repository root path")
    parser.add_argument("--json-output", help="Path to write JSON summary")
    parser.add_argument("--markdown-output", help="Path to write Markdown summary")
    args = parser.parse_args()

    results = scan_navigation_defects(args.root)

    if args.json_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_output)), exist_ok=True)
        with open(args.json_output, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"JSON results written to {args.json_output}")

    md_report = format_markdown_report(results)
    if args.markdown_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.markdown_output)), exist_ok=True)
        with open(args.markdown_output, 'w', encoding='utf-8') as f:
            f.write(md_report)
        print(f"Markdown report written to {args.markdown_output}")

    if not args.json_output and not args.markdown_output:
        print(md_report)

    print(
        f"\nRoute scan complete: {len(results['missing_app_prefix_violations'])} missing /app/ prefix violations, "
        f"{len(results['dead_anchors'])} dead anchors, {len(results['orphaned_routes'])} orphaned routes."
    )


if __name__ == "__main__":
    main()
