#!/usr/bin/env python3
"""
tools/scan_icon_inventory.py
Comprehensive Icon Inventory & Compliance Scanner for Mapletyne CPO Platform.

Audits mapletyne-admin and mapletyne-chargeapp for:
1. Compliant Google Material Symbols (material-symbols-outlined)
2. Raw inline SVGs (Feather/custom icon remnants)
3. Foreign icon library remnants (Lucide, Feather, Heroicons, FontAwesome)
4. Raw emojis in user interface components and templates
"""

import os
import sys
import re
import json
import argparse
from typing import List, Dict, Any, Tuple
from collections import Counter


# Regex patterns
MATERIAL_SYMBOL_RE = re.compile(
    r'<span\s+[^>]*?class(?:Name)?=[\'"][^\'"]*?\bmaterial-symbols-outlined\b[^\'"]*?[\'"][^>]*?>\s*([a-z0-9_]+)\s*</span>',
    re.IGNORECASE
)

# Also match when material-symbols-outlined is used without immediate closing tag on same line
MATERIAL_SYMBOL_OPEN_RE = re.compile(
    r'<span\s+[^>]*?class(?:Name)?=[\'"][^\'"]*?\bmaterial-symbols-outlined\b[^\'"]*?[\'"][^>]*?>',
    re.IGNORECASE
)

# Inline SVGs
SVG_TAG_RE = re.compile(r'<svg\b([^>]*)>', re.IGNORECASE)
SVG_ATTR_WIDTH_RE = re.compile(r'width=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
SVG_ATTR_HEIGHT_RE = re.compile(r'height=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)
SVG_ATTR_VIEWBOX_RE = re.compile(r'viewBox=[\'"]([^\'"]+)[\'"]', re.IGNORECASE)

# Foreign icon libraries
FOREIGN_LIBS_RE = re.compile(
    r'(?:from\s+[\'"](?:lucide-react|react-feather|@heroicons|@fortawesome)[^\'"]*[\'"]|class(?:Name)?=[\'"][^\'"]*\b(?:feather|lucide|fa|fa-solid|fa-regular)\b[^\'"]*[\'"])',
    re.IGNORECASE
)

# Unicode emojis (excluding basic symbols like standard copyright or bullet if unintended)
EMOJI_RE = re.compile(
    r'[\U0001F1E6-\U0001F1FF]{2}|'  # Regional flag pairs
    r'[\U0001F300-\U0001FAFF]|'      # Miscellaneous symbols and pictographs, transport, supplemental
    r'[\u2600-\u27BF]|'              # Miscellaneous symbols, Dingbats (⚡, ⚠️, ✉, ✂, ✈, etc.)
    r'[\u2300-\u23FF]|'              # Miscellaneous technical (⏱, ⌛, ⏰, ⌨, ⌘, etc.)
    r'[✓✗♥♡]'                        # Common symbol glyphs used as icons
)

EMOJI_REPLACEMENTS = {
    '⚡': 'bolt',
    '⚠️': 'warning',
    '⚠': 'warning',
    '✅': 'check_circle',
    '❌': 'cancel',
    '🔌': 'power',
    '💳': 'credit_card',
    '📍': 'location_on',
    '⚙': 'settings',
    '⚙️': 'settings',
    '🌱': 'eco',
    '🔑': 'key',
    '👤': 'person',
    '📲': 'install_mobile',
    '✨': 'auto_awesome',
    '🔐': 'lock',
    '🛡': 'shield',
    '🛡️': 'shield',
    '⬇️': 'download',
    '⏰': 'schedule',
    '⏱': 'timer',
    '💰': 'payments',
    '📊': 'monitoring',
    '⏳': 'hourglass_empty',
    '🔍': 'search',
    '🔗': 'link',
    '✓': 'check',
    '✗': 'close',
    '♥': 'favorite',
    '♡': 'favorite_border',
    '🔵': 'circle',
    '🏢': 'domain',
    '📱': 'smartphone',
    '🔢': 'pin',
}


def is_regional_flag(s: str) -> bool:
    if len(s) == 2 and all(0x1F1E6 <= ord(c) <= 0x1F1FF for c in s):
        return True
    return False


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


def scan_file(file_path: str, repo_root: str) -> Dict[str, Any]:
    rel_path = os.path.relpath(file_path, repo_root)
    scope = get_scope(rel_path)

    compliant_symbols = []
    violations = []

    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception:
        return {"file": rel_path, "compliant": [], "violations": []}

    for line_idx, line in enumerate(lines, start=1):
        # 1. Compliant Material Symbols
        for m in MATERIAL_SYMBOL_RE.finditer(line):
            icon_name = m.group(1).strip()
            compliant_symbols.append({
                "file": rel_path,
                "line": line_idx,
                "icon": icon_name,
                "scope": scope
            })

        # 2. Raw Inline SVGs
        for m in SVG_TAG_RE.finditer(line):
            attrs = m.group(1)
            # Check if this SVG is an activity ring or full graphic chart vs icon
            is_chart = 'activity-ring' in attrs.lower() or 'chart' in attrs.lower()
            if is_chart:
                continue
            w_match = SVG_ATTR_WIDTH_RE.search(attrs)
            h_match = SVG_ATTR_HEIGHT_RE.search(attrs)
            vb_match = SVG_ATTR_VIEWBOX_RE.search(attrs)
            w = w_match.group(1) if w_match else "?"
            h = h_match.group(1) if h_match else "?"
            vb = vb_match.group(1) if vb_match else "?"

            violations.append({
                "file": rel_path,
                "line": line_idx,
                "type": "Raw Inline SVG",
                "is_chart_graphic": is_chart,
                "dimensions": f"{w}x{h}",
                "viewBox": vb,
                "snippet": extract_snippet(line, m.start(), m.end()),
                "remediation": "Replace inline SVG with <span class=\"material-symbols-outlined\">icon_name</span>",
                "scope": scope
            })

        # 3. Foreign Icon Library Imports or classes
        for m in FOREIGN_LIBS_RE.finditer(line):
            violations.append({
                "file": rel_path,
                "line": line_idx,
                "type": "Foreign Icon Library",
                "token": m.group(0),
                "snippet": extract_snippet(line, m.start(), m.end()),
                "remediation": "Remove foreign icon import/class and replace with Google Material Symbols",
                "scope": scope
            })

        # 4. Unicode Emojis
        # Skip font declaration lines or comments that merely list symbols
        if 'Material+Symbols+Outlined' in line:
            continue

        for m in EMOJI_RE.finditer(line):
            em = m.group(0)
            if em == '⌘':  # Cmd symbol in hotkey documentation
                continue
            is_flag = is_regional_flag(em)
            replacement = EMOJI_REPLACEMENTS.get(em, 'help_outline')
            violations.append({
                "file": rel_path,
                "line": line_idx,
                "type": "Country Flag Emoji" if is_flag else "Raw UI Emoji",
                "emoji": em,
                "recommended_material_symbol": replacement if not is_flag else "flag",
                "snippet": extract_snippet(line, m.start(), m.end()),
                "remediation": f"Replace '{em}' with <span class=\"material-symbols-outlined\">{replacement}</span>",
                "scope": scope
            })

    return {
        "file": rel_path,
        "compliant": compliant_symbols,
        "violations": violations
    }


def scan_directories(repo_root: str) -> Dict[str, Any]:
    targets = [
        os.path.join(repo_root, "mapletyne-admin"),
        os.path.join(repo_root, "mapletyne-chargeapp"),
    ]

    all_compliant: List[Dict[str, Any]] = []
    all_violations: List[Dict[str, Any]] = []
    scanned_files_count = 0
    scanned_extensions = ('.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.vue', '.py')

    for target in targets:
        for root, dirs, files in os.walk(target):
            dirs[:] = [
                d for d in dirs
                if d not in ('node_modules', 'dist', '.git', '__pycache__', '.vite-temp', '.turbo', 'stitch_opencpo_management_dashboard')
            ]
            for file in files:
                if file == 'leaflet.js':
                    continue
                if file.endswith(scanned_extensions):
                    scanned_files_count += 1
                    fp = os.path.join(root, file)
                    res = scan_file(fp, repo_root)
                    all_compliant.extend(res['compliant'])
                    all_violations.extend(res['violations'])

    # Aggregate compliant symbols
    symbol_counter = Counter([item['icon'] for item in all_compliant])
    unique_symbols_count = len(symbol_counter)

    # Breakdown violations
    violation_categories = Counter([v['type'] for v in all_violations])
    violation_scopes = Counter([v['scope'] for v in all_violations])

    # Sort violations
    all_violations.sort(key=lambda x: (x['scope'], x['file'], x['line']))

    return {
        "scanned_files_count": scanned_files_count,
        "total_compliant_material_symbols": len(all_compliant),
        "unique_material_symbols_count": unique_symbols_count,
        "top_material_symbols": symbol_counter.most_common(20),
        "total_violations": len(all_violations),
        "violation_categories": dict(violation_categories),
        "violation_scopes": dict(violation_scopes),
        "compliant_sample": all_compliant[:25],
        "violations": all_violations
    }


def format_markdown_table(results: Dict[str, Any]) -> str:
    lines = [
        "# Programmatic Icon Inventory & Compliance Audit Report",
        "",
        f"- **Standard**: Strictly Google Material Symbols (`material-symbols-outlined`) (AGENTS.md / ADR-004)",
        f"- **Total Files Scanned**: {results['scanned_files_count']}",
        f"- **Total Compliant Material Symbols Instances**: {results['total_compliant_material_symbols']}",
        f"- **Unique Material Symbol Glyphs Used**: {results['unique_material_symbols_count']}",
        f"- **Total Non-Compliant Icon Violations**: {results['total_violations']}",
        "",
        "## Non-Compliant Icon Breakdown by Category",
        "",
        "| Category | Violations Count | Description |",
        "|---|---:|---|"
    ]

    for cat, count in sorted(results['violation_categories'].items(), key=lambda x: -x[1]):
        desc = ""
        if "Inline SVG" in cat:
            desc = "Raw inline <svg> elements (Feather/custom) requiring Material Symbols conversion"
        elif "Country Flag" in cat:
            desc = "Regional indicator flag emojis in phone prefix and language selector dropdowns"
        elif "Emoji" in cat:
            desc = "Unicode action/status emojis (⚡, ⚠️, ✅, 💳, 📍, etc.) embedded in UI buttons/cards"
        elif "Foreign" in cat:
            desc = "External icon library packages or classes (Lucide, Feather, FontAwesome)"
        else:
            desc = "Other iconography violation"
        lines.append(f"| **{cat}** | {count} | {desc} |")

    lines.append("")
    lines.append("## Non-Compliant Icon Breakdown by Scope")
    lines.append("")
    lines.append("| Scope | Violations Count |",)
    lines.append("|---|---:|")
    for sc, count in sorted(results['violation_scopes'].items(), key=lambda x: -x[1]):
        lines.append(f"| **{sc}** | {count} |")

    lines.append("")
    lines.append("## Top 20 Most Frequent Google Material Symbols")
    lines.append("")
    lines.append("| # | Material Symbol Glyph | Usage Count | Typical Semantic Role |")
    lines.append("|---|---|---:|---|")
    for idx, (sym, cnt) in enumerate(results['top_material_symbols'], start=1):
        lines.append(f"| {idx} | `{sym}` | {cnt} | Platform UI / Navigation |")

    lines.append("")
    lines.append("## Complete Non-Compliant Icon Violations Table")
    lines.append("")
    lines.append("| # | Scope | File Path | Line | Violation Type | Token / Details | Recommended Material Symbol / Action | Code Snippet |")
    lines.append("|---|---|---|---:|---|---|---|---|")

    for idx, v in enumerate(results['violations'], start=1):
        details = ""
        action = v.get('remediation', '')
        if v['type'] == 'Raw Inline SVG' or v['type'] == 'Inline SVG Graphic/Ring':
            details = f"SVG {v.get('dimensions', '')} vb: {v.get('viewBox', '')}"
        elif 'Emoji' in v['type']:
            em = v.get('emoji', '')
            details = f"Emoji '{em}'"
            rec = v.get('recommended_material_symbol', '')
            action = f"Use `{rec}` (`<span class=\"material-symbols-outlined\">{rec}</span>`)"
        elif v['type'] == 'Foreign Icon Library':
            details = f"`{v.get('token', '')}`"

        snippet_esc = v['snippet'].replace('|', '\\|')
        if len(snippet_esc) > 75:
            snippet_esc = snippet_esc[:72] + "..."

        lines.append(
            f"| {idx} | {v['scope']} | `{v['file']}` | {v['line']} | **{v['type']}** | {details} | {action} | `{snippet_esc}` |"
        )

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Scan frontends for Google Material Symbols compliance.")
    parser.add_argument("--root", default="/home/danielaroko/applications/mapletynecpo", help="Repository root path")
    parser.add_argument("--json-output", help="Path to write JSON summary")
    parser.add_argument("--markdown-output", help="Path to write Markdown summary")
    args = parser.parse_args()

    results = scan_directories(args.root)

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

    print(
        f"\nScan complete: {results['total_compliant_material_symbols']} compliant symbols ({results['unique_material_symbols_count']} unique), "
        f"{results['total_violations']} violations across {results['scanned_files_count']} files."
    )


if __name__ == "__main__":
    main()
