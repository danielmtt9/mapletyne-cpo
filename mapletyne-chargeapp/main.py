"""OCPP Charge App — PWA for EV drivers."""
import os
import logging

import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import config
from core.middleware import inject_context
from plugins import discover_plugins

logging.basicConfig(level=logging.INFO)

app = FastAPI(title=config.APP_TITLE, docs_url=None, redoc_url=None)

# ── Health Check Endpoint ────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "mapletyne-chargeapp", "title": config.APP_TITLE}


# ── PWA Manifest & Service Worker ──────────────────────────────────────────
@app.get("/manifest.json")
async def pwa_manifest():
    return FileResponse(
        "static/manifest.json",
        media_type="application/manifest+json",
        headers={"Cache-Control": "no-cache"}
    )

@app.get("/sw.js")
async def pwa_service_worker():
    return FileResponse(
        "static/sw.js",
        media_type="application/javascript",
        headers={
            "Service-Worker-Allowed": "/app/",
            "Cache-Control": "no-cache"
        }
    )

# ── Dynamic Skin Static Assets ─────────────────────────────────────────────
@app.get("/skin/{filename:path}")
async def dynamic_skin_static(request: Request, filename: str):
    """Serve skin static asset dynamically based on resolved tenant skin."""
    skin_name = getattr(request.state, "skin", config.SKIN)
    # 1. Active tenant skin path
    skin_file = Path("skins") / skin_name / "static" / filename
    if skin_file.is_file():
        media_type = "text/css" if filename.endswith(".css") else None
        return FileResponse(skin_file, media_type=media_type)
    # 2. Fallback to default skin path
    default_file = Path("skins") / "default" / "static" / filename
    if default_file.is_file():
        media_type = "text/css" if filename.endswith(".css") else None
        return FileResponse(default_file, media_type=media_type)
    return HTMLResponse("Skin asset not found", status_code=404)

# Base static always available at /static (home.js, htmx, logos, fallback CSS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Templates ─────────────────────────────────────────────────────────────
# Resolution order: skin templates → plugin templates → base templates
template_dirs = []
skin_templates = f"skins/{config.SKIN}/templates"
if os.path.isdir(skin_templates):
    template_dirs.append(skin_templates)
# Add plugin template directories
for plugin_name in config.PLUGINS:
    plugin_tmpl = f"plugins/{plugin_name}/templates"
    if os.path.isdir(plugin_tmpl):
        template_dirs.append(plugin_tmpl)
template_dirs.append("templates")

templates = Jinja2Templates(directory=template_dirs)
templates.env.globals["app_title"] = config.APP_TITLE
app.state.templates = templates

# ── Routes ────────────────────────────────────────────────────────────────
from routes import home, charge, auth, session, receipt, qr, push, cert_setup

for router in [home.router, charge.router, auth.router, session.router, receipt.router, qr.router, push.router, cert_setup.router]:
    app.include_router(router)

# ── Plugins ───────────────────────────────────────────────────────────────
for plugin_router in discover_plugins(config.PLUGINS):
    app.include_router(plugin_router)

# ── Middleware ────────────────────────────────────────────────────────────
app.middleware("http")(inject_context)

if __name__ == "__main__":
    uvicorn.run("main:app", host=config.APP_HOST, port=config.APP_PORT, reload=True)
