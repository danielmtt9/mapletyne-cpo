#!/usr/bin/env python3
"""
tools/scan_font_floor.py
Programmatic Font Floor Scanner for Mapletyne CPO Platform.

Audits mapletyne-admin and mapletyne-chargeapp for any typography size below
the mandated 12px enterprise floor (ADR-003 / AGENTS.md).
"""

import os
import sys
import re
import json
import argparse
from typing import List, Dict, Any, Tuple


TAILWIND_ARBITRARY_RE = re.compile(
    r'\btext-\[(\d+(?:\.\d+)?)(px|rem|em|pt|%)?\]',
    re.IGNORECASE
)

REACT_FONT_SIZE_STR_RE = re.compile(
    r'\bfontSize:\s*[\'"](\d+(?:\.\d+)?)(px|rem|em|pt|%)?[\'"]',
    re.IGNORECASE
)

REACT_FONT_SIZE_NUM_RE = re.compile(
    r'\bfontSize:\s*(\d+(?:\.\d+)?)\b',
    re.IGNORECASE
)

CSS_FONT_SIZE_RE = re.compile(
    r'\bfont-size:\s*(\d+(?:\.\d+)?)(px|rem|em|pt|%)?',
    re.IGNORECASE
)

BASE_FONT_PX = 16.0


def calculate_px(val_str: str, unit_str: str) -> float:
    val = float(val_str)
    unit = (unit_str or 'px').lower()
    if unit == 'px':
        return val
    elif unit in ('rem', 'em'):
        return val * BASE_FONT_PX
    elif unit == 'pt':
        return val * (96.0 / 72.0)
    elif unit == '%':
        return (val / 100.0) * BASE_FONT_PX
    return val


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


def scan_file(file_path: str, repo_root: str, floor_px: float = 12.0) -> List[Dict[str, Any]]:
    violations = []
    rel_path = os.path.relpath(file_path, repo_root)

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        return violations

    for line_idx, line in enumerate(lines, start=1):
        # 1. Tailwind text-[...]
        for m in TAILWIND_ARBITRARY_RE.finditer(line):
            val_str, unit_str = m.group(1), m.group(2) or 'px'
            px = calculate_px(val_str, unit_str)
            if px < (floor_px - 0.001):
                violations.append({
                    "file": rel_path,
                    "line": line_idx,
                    "type": "Tailwind Arbitrary",
                    "raw_token": m.group(0),
                    "value": float(val_str),
                    "unit": unit_str,
                    "calculated_px": round(px, 2),
                    "snippet": extract_snippet(line, m.start(), m.end()),
                    "scope": get_scope(rel_path)
                })

        # 2. React inline style string: fontSize: '...'
        for m in REACT_FONT_SIZE_STR_RE.finditer(line):
            val_str, unit_str = m.group(1), m.group(2) or 'px'
            px = calculate_px(val_str, unit_str)
            if px < (floor_px - 0.001):
                violations.append({
                    "file": rel_path,
                    "line": line_idx,
                    "type": "React Inline Style",
                    "raw_token": m.group(0),
                    "value": float(val_str),
                    "unit": unit_str,
                    "calculated_px": round(px, 2),
                    "snippet": extract_snippet(line, m.start(), m.end()),
                    "scope": get_scope(rel_path)
                })

        # 3. React inline style numeric: fontSize: 11
        for m in REACT_FONT_SIZE_NUM_RE.finditer(line):
            start = m.start()
            prefix = line[max(0, start-1):start]
            if prefix in ("'", '"'):
                continue
            val_str = m.group(1)
            px = float(val_str)
            if px < (floor_px - 0.001):
                token_str = m.group(0)
                if not any(v["line"] == line_idx and v["raw_token"] == token_str for v in violations):
                    violations.append({
                        "file": rel_path,
                        "line": line_idx,
                        "type": "React Inline Number",
                        "raw_token": token_str,
                        "value": float(val_str),
                        "unit": "px",
                        "calculated_px": round(px, 2),
                        "snippet": extract_snippet(line, m.start(), m.end()),
                        "scope": get_scope(rel_path)
                    })

        # 4. CSS font-size: ...
        for m in CSS_FONT_SIZE_RE.finditer(line):
            val_str, unit_str = m.group(1), m.group(2) or 'px'
            px = calculate_px(val_str, unit_str)
            if px < (floor_px - 0.001):
                token_str = m.group(0)
                if not any(v["line"] == line_idx and v["raw_token"] == token_str for v in violations):
                    violations.append({
                        "file": rel_path,
                        "line": line_idx,
                        "type": "CSS Rule",
                        "raw_token": token_str,
                        "value": float(val_str),
                        "unit": unit_str,
                        "calculated_px": round(px, 2),
                        "snippet": extract_snippet(line, m.start(), m.end()),
                        "scope": get_scope(rel_path)
                    })

    return violations


def scan_directories(repo_root: str, floor_px: float = 12.0) -> Dict[str, Any]:
    targets = [
        os.path.join(repo_root, "mapletyne-admin"),
        os.path.join(repo_root, "mapletyne-chargeapp"),
    ]

    all_violations: List[Dict[str, Any]] = []
    scanned_files_count = 0
    scanned_extensions = ('.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.vue', '.py')

    for target in targets:
        for root, dirs, files in os.walk(target):
            # Skip build and external directories
            dirs[:] = [
                d for d in dirs
                if d not in ('node_modules', 'dist', '.git', '__pycache__', '.vite-temp', '.turbo')
            ]
            for file in files:
                if file.endswith(scanned_extensions):
                    scanned_files_count += 1
                    fp = os.path.join(root, file)
                    file_violations = scan_file(fp, repo_root, floor_px)
                    all_violations.extend(file_violations)

    # Sort violations by file path and line number
    all_violations.sort(key=lambda x: (x['file'], x['line']))

    # Group by scope
    scope_counts: Dict[str, int] = {}
    for v in all_violations:
        scope = v['scope']
        scope_counts[scope] = scope_counts.get(scope, 0) + 1

    return {
        "floor_px": floor_px,
        "scanned_files_count": scanned_files_count,
        "total_violations": len(all_violations),
        "scope_summary": scope_counts,
        "violations": all_violations
    }


def format_markdown_table(results: Dict[str, Any]) -> str:
    lines = [
        "# Programmatic Font Floor Scanner Audit Report",
        "",
        f"- **Mandated Floor**: >= {results['floor_px']}px",
        f"- **Total Files Scanned**: {results['scanned_files_count']}",
        f"- **Total Violations Detected**: {results['total_violations']}",
        "",
        "## Scope Summary",
        "",
        "| Scope | Violation Count |",
        "|---|---:|"
    ]
    for scope, count in sorted(results['scope_summary'].items(), key=lambda x: -x[1]):
        lines.append(f"| **{scope}** | {count} |")

    lines.append("")
    lines.append("## Machine-Verified Inventory Table")
    lines.append("")
    lines.append("| # | Scope | File Path | Line | Raw Token | Computed Size | Code Snippet |")
    lines.append("|---|---|---|---:|---|---:|---|")

    for idx, v in enumerate(results['violations'], start=1):
        snippet_esc = v['snippet'].replace('|', '\\|')
        if len(snippet_esc) > 85:
            snippet_esc = snippet_esc[:82] + "..."
        lines.append(
            f"| {idx} | {v['scope']} | `{v['file']}` | {v['line']} | `{v['raw_token']}` | **{v['calculated_px']:.2f}px** | `{snippet_esc}` |"
        )

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Scan frontends for sub-12px font sizes.")
    parser.add_argument("--root", default="/home/danielaroko/applications/mapletynecpo", help="Repository root path")
    parser.add_argument("--floor", type=float, default=12.0, help="Minimum allowed font size in pixels (default: 12.0)")
    parser.add_argument("--json-output", help="Path to write JSON summary")
    parser.add_argument("--markdown-output", help="Path to write Markdown summary")
    args = parser.parse_args()

    results = scan_directories(args.root, args.floor)

    if args.json_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_output)), exist_ok=True)
        with open(args.json_output, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"JSON results written to {args.json_output}")

    md_report = format_markdown_table(results)
    if args.markdown_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.markdown_output)), exist_ok=True)
        with open(args.markdown_output, 'w', encoding='utf-8') as f:
            f.write(md_report)
        print(f"Markdown report written to {args.markdown_output}")

    if not args.json_output and not args.markdown_output:
        print(md_report)

    print(f"\nScan complete: {results['total_violations']} violations found across {results['scanned_files_count']} files.")


if __name__ == "__main__":
    main()
