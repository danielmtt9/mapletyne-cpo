#!/usr/bin/env python3
"""
tools/calculate_contrast.py
Automated Accessibility Contrast Calculator for Mapletyne CPO Platform.

Implements ITU-R BT.709 relative luminance formulas to compute exact contrast ratios
for all primary brand tokens, surface canvases, and specific UI pairings across
mapletyne-admin and mapletyne-chargeapp, evaluating against WCAG 2.1 AA and AAA standards.
"""

import os
import sys
import json
import argparse
from typing import Dict, List, Any, Tuple


def hex_to_rgb(hex_code: str) -> Tuple[int, int, int]:
    clean_hex = hex_code.lstrip('#')
    if len(clean_hex) == 3:
        clean_hex = "".join([c * 2 for c in clean_hex])
    return (
        int(clean_hex[0:2], 16),
        int(clean_hex[2:4], 16),
        int(clean_hex[4:6], 16)
    )


def srgb_channel_to_linear(c_8bit: int) -> float:
    """Converts 8-bit sRGB channel to linear light value per IEC 61966-2-1 / WCAG 2.1."""
    c_norm = c_8bit / 255.0
    if c_norm <= 0.04045:
        return c_norm / 12.92
    return ((c_norm + 0.055) / 1.055) ** 2.4


def relative_luminance(hex_code: str) -> float:
    """
    Computes ITU-R BT.709 relative luminance:
    L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin
    """
    r, g, b = hex_to_rgb(hex_code)
    r_lin = srgb_channel_to_linear(r)
    g_lin = srgb_channel_to_linear(g)
    b_lin = srgb_channel_to_linear(b)
    return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin


def calculate_contrast_ratio(fg_hex: str, bg_hex: str) -> float:
    """
    Computes WCAG 2.1 contrast ratio:
    (L1 + 0.05) / (L2 + 0.05) where L1 >= L2
    """
    l_fg = relative_luminance(fg_hex)
    l_bg = relative_luminance(bg_hex)
    l1 = max(l_fg, l_bg)
    l2 = min(l_fg, l_bg)
    return (l1 + 0.05) / (l2 + 0.05)


def evaluate_wcag(ratio: float) -> Dict[str, Any]:
    return {
        "ratio": round(ratio, 2),
        "formatted_ratio": f"{ratio:.2f}:1",
        "wcag_aa_normal": ratio >= 4.5,       # Normal text (< 18pt / 24px)
        "wcag_aa_large": ratio >= 3.0,        # Large text (>= 18pt / 24px or >= 14pt bold) / UI graphics
        "wcag_aaa_normal": ratio >= 7.0,      # Enhanced contrast normal text
        "wcag_aaa_large": ratio >= 4.5,       # Enhanced contrast large text
    }


# Primary Platform Tokens (Seed & Semantic)
PRIMARY_TOKENS = {
    "#006948": {"name": "Forest Emerald (M3 Seed)", "category": "Brand Primary", "role": "Operator light-mode accent / brand identity"},
    "#10B981": {"name": "Semantic Emerald (Emerald-500)", "category": "Semantic State", "role": "Online status / Dark mode primary accent"},
    "#0B0F19": {"name": "Dark Canvas (PWA/Dark)", "category": "Surface Canvas", "role": "Driver Mobile PWA background canvas"},
    "#F8FAFC": {"name": "Light Canvas (Slate-50)", "category": "Surface Canvas", "role": "Operator Mission Control default canvas"},
    "#48E260": {"name": "Driver Accent (Electric Green)", "category": "Driver Semantic", "role": "Driver active charging highlight / live kW"},
    "#94A3B8": {"name": "Slate-400 (Muted Secondary)", "category": "Neutral Variant", "role": "Table column headers, metadata subtext"},
    "#64748B": {"name": "Slate-500 (Medium Slate)", "category": "Neutral Variant", "role": "Secondary description text"},
    "#475569": {"name": "Slate-600 (Dark Slate)", "category": "Neutral Variant", "role": "High-contrast secondary text"},
    "#1E293B": {"name": "Slate-800 (Dark Slate)", "category": "Neutral Dark", "role": "High-contrast light-mode body text"},
    "#0F172A": {"name": "Slate-900 (Deep Slate)", "category": "Neutral Dark", "role": "Primary headings in light mode"},
    "#FBBF24": {"name": "Amber-400 (Warning)", "category": "Status Semantic", "role": "Preparing / Throttled / Warning badges"},
    "#B45309": {"name": "Amber-700 (High-Contrast Warning)", "category": "Status Semantic", "role": "Accessible warning badge text"},
    "#EF4444": {"name": "Red-500 (Fault / Error)", "category": "Status Semantic", "role": "Faulted charger, emergency stop, error alerts"},
    "#FFFFFF": {"name": "Pure White", "category": "Surface / Text", "role": "Card container surface / dark text"},
    "#171F33": {"name": "Surface Container Dark", "category": "Surface Container", "role": "Card container in dark mode"},
    "#005439": {"name": "Dark Forest Emerald", "category": "Brand Primary", "role": "Hover / pressed state for primary CTA"},
    "#0284C7": {"name": "Sky-600 (Informational)", "category": "Semantic State", "role": "PayloadCMS / Puck info badges"},
}

CANVASES = {
    "#F8FAFC": "Light Canvas (Operator Admin default)",
    "#0B0F19": "Dark Canvas (Driver PWA default)",
    "#FFFFFF": "Pure White Card Surface (Light Mode)",
    "#171F33": "Surface Container Dark (Dark Mode)"
}

# Critical In-Code Real-World Pairings Identified in Codebase
IN_CODE_PAIRINGS = [
    {
        "id": "PAIR-01",
        "fg": "#006948",
        "bg": "#F8FAFC",
        "usage": "Brand Primary Buttons / Active Nav on Light Canvas",
        "location": "mapletyne-admin Header, Sidebar, Login, Metric cards",
        "severity": "PASS",
        "notes": "Passes WCAG 2.1 AA (6.45:1). Legible brand standard."
    },
    {
        "id": "PAIR-02",
        "fg": "#006948",
        "bg": "#0B0F19",
        "usage": "Brand Emerald text on Dark Canvas",
        "location": "Puck Editor preview, custom skins on dark backgrounds",
        "severity": "HIGH",
        "notes": "2.84:1 FAIL. Dark green on dark canvas lacks luminance separation."
    },
    {
        "id": "PAIR-03",
        "fg": "#10B981",
        "bg": "#0B0F19",
        "usage": "Semantic Emerald accent on Dark Canvas",
        "location": "Driver PWA active states, dark mode online status badges",
        "severity": "PASS",
        "notes": "7.55:1 PASS AA & AAA. Compliant primary dark-mode accent."
    },
    {
        "id": "PAIR-04",
        "fg": "#10B981",
        "bg": "#F8FAFC",
        "usage": "Semantic Emerald text/badges on Light Canvas",
        "location": "mapletyne-admin Status badges, active session counts",
        "severity": "HIGH",
        "notes": "2.42:1 FAIL AA & AAA. Insufficient contrast for light mode text."
    },
    {
        "id": "PAIR-05",
        "fg": "#10B981",
        "bg": "#FFFFFF",
        "usage": "Semantic Emerald text in White Container Cards",
        "location": "mapletyne-admin KPI card trend labels (+14.2%)",
        "severity": "HIGH",
        "notes": "2.54:1 FAIL AA & AAA. Light green on white card surface."
    },
    {
        "id": "PAIR-06",
        "fg": "#48E260",
        "bg": "#0B0F19",
        "usage": "Driver Accent (Electric Green) on Dark Canvas",
        "location": "mapletyne-chargeapp session telemetry, live kW badge",
        "severity": "PASS",
        "notes": "11.24:1 PASS AA & AAA. Outstanding dark mode legibility."
    },
    {
        "id": "PAIR-07",
        "fg": "#48E260",
        "bg": "#F8FAFC",
        "usage": "Driver Accent on Light Mode Canvas",
        "location": "Otaski / OpenCPO light theme skin variants",
        "severity": "CRITICAL",
        "notes": "1.63:1 CRITICAL FAIL. Virtually unreadable light green on slate-50."
    },
    {
        "id": "PAIR-08",
        "fg": "#94A3B8",
        "bg": "#F8FAFC",
        "usage": "Slate-400 secondary metadata on Light Canvas",
        "location": "mapletyne-admin table headers, subtitle labels, chargeapp privacy.html",
        "severity": "HIGH",
        "notes": "2.45:1 FAIL AA (requires 4.5:1). Pervasive illegibility of secondary text."
    },
    {
        "id": "PAIR-09",
        "fg": "#FBBF24",
        "bg": "#F8FAFC",
        "usage": "Amber-400 warning text on Light Canvas",
        "location": "mapletyne-admin ChargersPage, SessionsPage warning badges",
        "severity": "CRITICAL",
        "notes": "1.60:1 CRITICAL FAIL. Amber-400 is illegible on light backgrounds."
    },
    {
        "id": "PAIR-10",
        "fg": "#B45309",
        "bg": "#F8FAFC",
        "usage": "Amber-700 remediation candidate on Light Canvas",
        "location": "Proposed fix for warning text in light tables",
        "severity": "PASS",
        "notes": "4.80:1 PASS AA. Compliant replacement for warning text."
    },
    {
        "id": "PAIR-11",
        "fg": "#FFFFFF",
        "bg": "#FFFFFF",
        "usage": "text-white on bg-surface-container in Light Mode",
        "location": "RoamingPage.tsx:155, VehiclesPage.tsx:403, DepotBayGrid.tsx:40",
        "severity": "CRITICAL",
        "notes": "1.00:1 ZERO CONTRAST. Text is 100% invisible to users."
    },
    {
        "id": "PAIR-12",
        "fg": "#FFFFFF",
        "bg": "#006948",
        "usage": "White text on Forest Emerald Primary Button",
        "location": "Primary CTA buttons, operator navbar header",
        "severity": "PASS",
        "notes": "6.74:1 PASS AA (fails AAA 7:1 by 0.26). Highly readable standard button."
    },
    {
        "id": "PAIR-13",
        "fg": "#475569",
        "bg": "#F8FAFC",
        "usage": "Slate-600 metadata candidate on Light Canvas",
        "location": "Proposed fix for secondary text replacing Slate-400",
        "severity": "PASS",
        "notes": "7.24:1 PASS AA & AAA. Fully compliant secondary text token."
    },
]


def run_contrast_audit() -> Dict[str, Any]:
    # 1. Token Luminance Table
    luminance_table = []
    for hex_code, meta in PRIMARY_TOKENS.items():
        lum = relative_luminance(hex_code)
        luminance_table.append({
            "hex": hex_code,
            "name": meta["name"],
            "category": meta["category"],
            "role": meta["role"],
            "luminance": round(lum, 5)
        })
    luminance_table.sort(key=lambda x: x["luminance"], reverse=True)

    # 2. Comprehensive Matrix (All Tokens vs All Canvases)
    matrix_results = []
    for bg_hex, bg_name in CANVASES.items():
        bg_lum = relative_luminance(bg_hex)
        for fg_hex, fg_meta in PRIMARY_TOKENS.items():
            if fg_hex.upper() == bg_hex.upper():
                continue
            ratio = calculate_contrast_ratio(fg_hex, bg_hex)
            eval_res = evaluate_wcag(ratio)
            matrix_results.append({
                "foreground_hex": fg_hex,
                "foreground_name": fg_meta["name"],
                "background_hex": bg_hex,
                "background_name": bg_name,
                "contrast_ratio": eval_res["ratio"],
                "formatted_ratio": eval_res["formatted_ratio"],
                "wcag_aa_normal": eval_res["wcag_aa_normal"],
                "wcag_aa_large": eval_res["wcag_aa_large"],
                "wcag_aaa_normal": eval_res["wcag_aaa_normal"],
                "wcag_aaa_large": eval_res["wcag_aaa_large"],
            })

    # 3. Real-World Pairings Evaluation
    pairings_results = []
    for item in IN_CODE_PAIRINGS:
        ratio = calculate_contrast_ratio(item["fg"], item["bg"])
        eval_res = evaluate_wcag(ratio)
        pairings_results.append({
            **item,
            "contrast_ratio": eval_res["ratio"],
            "formatted_ratio": eval_res["formatted_ratio"],
            "wcag_aa_normal": eval_res["wcag_aa_normal"],
            "wcag_aa_large": eval_res["wcag_aa_large"],
            "wcag_aaa_normal": eval_res["wcag_aaa_normal"],
            "wcag_aaa_large": eval_res["wcag_aaa_large"],
        })

    return {
        "luminance_table": luminance_table,
        "canvases": CANVASES,
        "matrix_results": matrix_results,
        "pairings_results": pairings_results
    }


def format_markdown_report(data: Dict[str, Any]) -> str:
    lines = [
        "# Accessibility Contrast Calculator Audit Report",
        "",
        "- **Standard**: ITU-R BT.709 Relative Luminance & WCAG 2.1 Contrast Standards",
        "- **WCAG 2.1 AA Threshold**: Normal Text $\\ge 4.5:1$, Large Text / UI Components $\\ge 3.0:1$",
        "- **WCAG 2.1 AAA Threshold**: Normal Text $\\ge 7.0:1$, Large Text $\\ge 4.5:1$",
        "",
        "## 1. Relative Luminance of Design Tokens",
        "",
        "$$\\text{Luminance } L = 0.2126 \\cdot R_{\\text{lin}} + 0.7152 \\cdot G_{\\text{lin}} + 0.0722 \\cdot B_{\\text{lin}}$$",
        "",
        "| Hex Code | Token Name | Category | Relative Luminance ($L$) | Primary Role |",
        "|---|---|---|---:|---|"
    ]

    for item in data["luminance_table"]:
        lines.append(
            f"| `{item['hex']}` | **{item['name']}** | {item['category']} | `{item['luminance']:.5f}` | {item['role']} |"
        )

    lines.append("")
    lines.append("## 2. In-Code Real-World UI Contrast Audit")
    lines.append("")
    lines.append("| ID | Severity | Foreground Token | Background Canvas | Contrast Ratio | WCAG AA Normal (4.5:1) | WCAG AAA Normal (7:1) | Codebase Location & Notes |")
    lines.append("|---|---|---|---|---:|:---:|:---:|---|")

    for p in data["pairings_results"]:
        aa_badge = "PASS" if p["wcag_aa_normal"] else "**FAIL**"
        aaa_badge = "PASS" if p["wcag_aaa_normal"] else "FAIL"
        sev_badge = f"**{p['severity']}**" if p['severity'] in ('CRITICAL', 'HIGH') else p['severity']
        lines.append(
            f"| {p['id']} | {sev_badge} | `{p['fg']}` | `{p['bg']}` | **{p['formatted_ratio']}** | {aa_badge} | {aaa_badge} | **{p['usage']}**<br>_{p['location']}_<br>{p['notes']} |"
        )

    lines.append("")
    lines.append("## 3. Comprehensive Design Token Contrast Matrix")
    lines.append("")
    lines.append("Complete matrix of brand and UI tokens evaluated across all 4 canvas environments:")
    lines.append("")
    lines.append("| Foreground Token | Background Canvas | Contrast Ratio | WCAG AA Normal | WCAG AA Large | WCAG AAA Normal |")
    lines.append("|---|---|---:|:---:|:---:|:---:|")

    for m in data["matrix_results"]:
        aa_norm = "PASS" if m["wcag_aa_normal"] else "FAIL"
        aa_lg = "PASS" if m["wcag_aa_large"] else "FAIL"
        aaa_norm = "PASS" if m["wcag_aaa_normal"] else "FAIL"
        lines.append(
            f"| `{m['foreground_hex']}` ({m['foreground_name']}) | `{m['background_hex']}` ({m['background_name']}) | **{m['formatted_ratio']}** | {aa_norm} | {aa_lg} | {aaa_norm} |"
        )

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Calculate ITU-R BT.709 contrast ratios for M3 brand tokens.")
    parser.add_argument("--json-output", help="Path to write JSON contrast data")
    parser.add_argument("--markdown-output", help="Path to write Markdown report")
    args = parser.parse_args()

    data = run_contrast_audit()

    if args.json_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.json_output)), exist_ok=True)
        with open(args.json_output, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"JSON results written to {args.json_output}")

    md_report = format_markdown_report(data)
    if args.markdown_output:
        os.makedirs(os.path.dirname(os.path.abspath(args.markdown_output)), exist_ok=True)
        with open(args.markdown_output, 'w', encoding='utf-8') as f:
            f.write(md_report)
        print(f"Markdown report written to {args.markdown_output}")

    if not args.json_output and not args.markdown_output:
        print(md_report)

    failed_pairings = [p for p in data["pairings_results"] if not p["wcag_aa_normal"]]
    print(
        f"\nContrast audit complete: {len(data['luminance_table'])} tokens analyzed, "
        f"{len(data['matrix_results'])} canvas pairings evaluated, "
        f"{len(failed_pairings)}/{len(data['pairings_results'])} in-code UI pairings failed WCAG AA normal text."
    )


if __name__ == "__main__":
    main()
