# UI/UX Remediation Estimate

Source: `docs/audits/UI_UX_DEFICIENCY_AUDIT.md` (defect register DEF-*). Execution: sequential Ollama agents (`qwen3.6:latest`), verified by `tools/*` scanners, `tests/test_uiux_scanners.py`, existing suites and `npm run build`.

| Batch | Scope (defect IDs) | Files | Risk | Est. effort (agent+verify) |
|:--|:--|:--|:--|:--|
| B0 (done directly) | CMS-01 key to env, CMS-02 `/api/cms/` ingress | nginx x2, Dockerfile, compose | High (secret, ingress) | 15 min |
| B1 Navigation | NAV-01..05, SEC-02 | chargeapp templates, routes, home.js | Medium | 30 min |
| B2 Contrast | CTR-01..10 | admin pages/components, skins, puck | Low | 45 min |
| B3 Typography/spacing | TYP-01..09, SPC-01..05 | puck*, admin pages, chargeapp css | Low | 30 min |
| B4 Icons | ICO-01..09 | chargeapp templates, admin pages | Medium (many files) | 60 min |
| B5 Infra/404/legal/cookies | INF-01..05, LEG-01..06, LOC-01..02 | both apps | Medium | 75 min |
| B6 Skins/whitelabel | SKN-01..03, WHT-01..02 | chargeapp base/main/skins, theme-provider | Medium | 45 min |
| B7 Puck/Payload | CMS-03..10 | puck*, ReactLivePage, App.tsx, payload.ts | Medium | 60 min |
| B8 Misc | PRF-01, SEC-01 | admin tables, auth storage | Medium | 30 min |
| Verify loop | scanners, tests, build, container rebuild, re-inspection | - | - | 2-3 rounds |

Total estimate: ~6-7 hours of wall-clock agent time (single GPU, sequential). Largest risk: large multi-file edits by the model breaking builds; mitigated by running `npm run build` and the test suites after every batch and reverting failing files.
