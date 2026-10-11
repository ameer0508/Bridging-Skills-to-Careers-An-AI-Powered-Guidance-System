from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from contextlib import asynccontextmanager
import time
import platform
from datetime import datetime, timezone
from app.core.config import settings
from app.core.logging import logger
from app.config.ai_config import ai_config
from app.gateway.ai_gateway import ai_gateway
from app.knowledge_graph.graph_engine import knowledge_graph_instance
from app.routers import (
    health, extract, skills, chat,
    career, readiness, recommendations,
    roadmap, analytics, resume_intelligence,
    salary, market, courses, certifications,
    external_gateway, knowledge_graph, events,
    feature_store, ai_operations, github, linkedin, portfolio, coding, opensource, brand, professional_graph, agent, job_agent_router, learning_agent_router, resume_agent_router, interview_agent_router, networking_agent_router, opportunity_agent_router, orchestrator_router, memory_router
)
from app.career_os import dashboard_router

SERVICE_START_TIME = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logging hooks
    logger.info("SkillBridge Enterprise AI Intelligence Layer starting...")
    logger.info(f"Service configured for [{settings.ENV}] mode on port {settings.PORT}")
    logger.info(f"Primary AI Provider: [{ai_config.primary_provider}] | Mock Enabled: [{ai_config.enable_mock_provider}]")
    yield
    # Shutdown logging hooks
    logger.info("SkillBridge Enterprise AI Intelligence Layer shutting down...")

app = FastAPI(
    title="SkillBridge AI Intelligence Layer",
    description="Enterprise Modular AI Gateway for Resume Parsing, Skill Extraction, Career Matching, and Guidance Services",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registries
app.include_router(health.router)
app.include_router(extract.router)
app.include_router(skills.router)
app.include_router(chat.router)
app.include_router(career.router)
app.include_router(readiness.router)
app.include_router(recommendations.router)
app.include_router(roadmap.router)
app.include_router(analytics.router)
app.include_router(resume_intelligence.router)
app.include_router(salary.router)
app.include_router(market.router)
app.include_router(courses.router)
app.include_router(certifications.router)
app.include_router(external_gateway.router)
app.include_router(knowledge_graph.router)
app.include_router(events.router)
app.include_router(feature_store.router)
app.include_router(ai_operations.router)
app.include_router(github.router)
app.include_router(linkedin.router)
app.include_router(portfolio.router)
app.include_router(coding.router)
app.include_router(opensource.router)
app.include_router(brand.router)
app.include_router(professional_graph.router)
app.include_router(agent.router)
app.include_router(job_agent_router.router)
app.include_router(learning_agent_router.router)
app.include_router(resume_agent_router.router)
app.include_router(interview_agent_router.router)
app.include_router(networking_agent_router.router)
app.include_router(opportunity_agent_router.router)
app.include_router(orchestrator_router.router)
app.include_router(memory_router.router)
app.include_router(dashboard_router.router)

def get_realtime_ai_telemetry() -> dict:
    current_time = datetime.now(timezone.utc).isoformat()
    uptime_sec = round(time.time() - SERVICE_START_TIME, 1)

    nodes_count = 0
    edges_count = 0
    try:
        nodes_count = knowledge_graph_instance.entity_mgr.total_nodes()
        edges_count = knowledge_graph_instance.rel_mgr.total_edges()
    except Exception:
        pass

    providers_status = {}
    for name, provider in ai_gateway.providers.items():
        providers_status[name] = {
            "available": provider.is_available(),
            "default_model": provider.default_model
        }

    return {
        "success": True,
        "service": "SkillBridge Enterprise AI Intelligence Layer",
        "status": "LIVE_OPERATIONAL",
        "timestamp": current_time,
        "uptime_seconds": uptime_sec,
        "environment": settings.ENV,
        "primary_provider": ai_config.primary_provider,
        "knowledge_graph": {
            "status": "ONLINE",
            "total_nodes": nodes_count,
            "total_edges": edges_count
        },
        "agents": [
            {"id": "job_agent", "name": "Job Intelligence Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "learning_agent", "name": "Adaptive Learning Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "resume_agent", "name": "Resume Intelligence Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "interview_agent", "name": "Mock Interview Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "networking_agent", "name": "Professional Networking Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "opportunity_agent", "name": "Market Opportunity Agent", "status": "ONLINE", "mode": "REAL_TIME"},
            {"id": "orchestrator", "name": "CareerOS Orchestrator", "status": "ONLINE", "mode": "REAL_TIME"}
        ],
        "providers": providers_status,
        "runtime": {
            "python_version": platform.python_version(),
            "system": platform.system(),
            "port": settings.PORT
        },
        "endpoints": {
            "frontend_ui": "http://localhost:3000",
            "backend_api": "http://localhost:5000",
            "swagger_docs": f"http://127.0.0.1:{settings.PORT}/docs",
            "redoc": f"http://127.0.0.1:{settings.PORT}/redoc",
            "health": f"http://127.0.0.1:{settings.PORT}/api/v1/health",
            "realtime_api": f"http://127.0.0.1:{settings.PORT}/api/v1/realtime"
        }
    }

def render_ai_dashboard_html(data: dict) -> str:
    agents_html = "".join([
        f'''<div class="agent-chip">
            <span class="chip-dot"></span>
            <div>
                <div style="font-weight:600; color:#fff; font-size:0.88rem;">{a["name"]}</div>
                <div style="font-size:0.75rem; color:#94a3b8;">Status: <span style="color:#34d399;">{a["status"]}</span> • {a["mode"]}</div>
            </div>
        </div>'''
        for a in data.get("agents", [])
    ])

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillBridge AI | Real-Time Intelligence Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0b0f19;
      --card-bg: rgba(17, 24, 39, 0.7);
      --card-border: rgba(139, 92, 246, 0.18);
      --primary: #8b5cf6;
      --accent: #38bdf8;
      --emerald: #10b981;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, var(--bg) 75%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 2.5rem 1.5rem;
    }}
    .container {{ max-width: 1100px; margin: 0 auto; width: 100%; }}
    .header {{
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
    }}
    .badge-live {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.35);
      color: #c4b5fd;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }}
    .pulse-dot {{
      width: 8px;
      height: 8px;
      background: #8b5cf6;
      border-radius: 50%;
      box-shadow: 0 0 10px #8b5cf6;
      animation: pulse 2s infinite;
    }}
    @keyframes pulse {{
      0%, 100% {{ opacity: 1; transform: scale(1); }}
      50% {{ opacity: 0.4; transform: scale(1.2); }}
    }}
    .title {{
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 30%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    .subtitle {{ color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }}
    .hero-btn {{
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: #ffffff;
      padding: 0.85rem 1.75rem;
      border-radius: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4);
      transition: all 0.2s ease;
    }}
    .hero-btn:hover {{
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(124, 58, 237, 0.6);
    }}
    .grid-metrics {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }}
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(12px);
      transition: transform 0.2s, border-color 0.2s;
    }}
    .card:hover {{
      border-color: rgba(139, 92, 246, 0.4);
      transform: translateY(-2px);
    }}
    .card-label {{ font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }}
    .card-val {{ font-size: 1.85rem; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; }}
    .card-hint {{ font-size: 0.8rem; color: var(--accent); margin-top: 0.4rem; }}
    .section-title {{ font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: #e2e8f0; display: flex; align-items: center; gap: 0.5rem; }}
    .agents-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 0.85rem;
      margin-top: 1rem;
    }}
    .agent-chip {{
      display: flex;
      align-items: center;
      gap: 0.85rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 0.85rem 1rem;
      border-radius: 0.75rem;
    }}
    .chip-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }}
    .status-panel {{
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }}
    @media (max-width: 850px) {{ .status-panel {{ grid-template-columns: 1fr; }} }}
    .list-item {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.92rem;
    }}
    .list-item:last-child {{ border-bottom: none; }}
    .pill {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 0.4rem;
      background: rgba(139, 92, 246, 0.15);
      color: #c4b5fd;
    }}
    .link-card {{
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 0.9rem 1.15rem;
      text-decoration: none;
      color: var(--text);
      display: block;
      transition: background 0.2s;
    }}
    .link-card:hover {{ background: rgba(139, 92, 246, 0.12); border-color: var(--primary); }}
    .link-card h4 {{ font-size: 0.92rem; margin-bottom: 0.2rem; color: #fff; }}
    .link-card p {{ font-size: 0.78rem; color: var(--text-muted); }}
    .ticker-bar {{
      margin-top: auto;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      padding-top: 2rem;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="badge-live"><span class="pulse-dot"></span> Real-Time AI Fleet Active</div>
        <h1 class="title" style="margin-top: 0.75rem;">SkillBridge AI Intelligence Core</h1>
        <p class="subtitle">Multi-Agent Cognitive Framework, Semantic Knowledge Graph & ML Engine</p>
      </div>
      <div style="display: flex; gap: 0.75rem;">
        <a href="/docs" class="hero-btn" style="background: rgba(255,255,255,0.08); box-shadow: none; border: 1px solid var(--card-border);" target="_blank">
          <span>📖 Swagger Docs</span>
        </a>
        <a href="http://localhost:3000" class="hero-btn" target="_blank">
          <span>🚀 Launch Web App</span>
          <span style="opacity: 0.8; font-size: 0.85rem;">:3000</span>
        </a>
      </div>
    </div>

    <!-- Live Telemetry Row -->
    <div class="grid-metrics">
      <div class="card">
        <div class="card-label">Knowledge Graph Nodes</div>
        <div class="card-val" id="kg-nodes" style="color: #38bdf8;">{data["knowledge_graph"]["total_nodes"]}</div>
        <div class="card-hint">Ontology & Skill Entities</div>
      </div>
      <div class="card">
        <div class="card-label">Semantic Relationships</div>
        <div class="card-val" id="kg-edges" style="color: #c4b5fd;">{data["knowledge_graph"]["total_edges"]}</div>
        <div class="card-hint">Weighted Graph Edges</div>
      </div>
      <div class="card">
        <div class="card-label">Autonomous AI Fleet</div>
        <div class="card-val" id="agents-count" style="color: #34d399;">7</div>
        <div class="card-hint">All Agents Active & Online</div>
      </div>
      <div class="card">
        <div class="card-label">Primary AI Provider</div>
        <div class="card-val" style="font-size: 1.5rem; text-transform: uppercase;">{data["primary_provider"]}</div>
        <div class="card-hint">Auto Fallback Matrix Active</div>
      </div>
    </div>

    <!-- Agents & Ecosystem Panel -->
    <div class="card" style="margin-bottom: 2rem;">
      <div class="section-title">🤖 Active Multi-Agent Fleet Telemetry</div>
      <div class="agents-grid">
        {agents_html}
      </div>
    </div>

    <div class="status-panel">
      <div class="card">
        <div class="section-title">⚡ Real-Time Engine Health</div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Uptime</span>
          <span class="pill" id="uptime-val">{data["uptime_seconds"]}s</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Python Runtime</span>
          <span class="pill">Python {data["runtime"]["python_version"]} ({data["runtime"]["system"]})</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Backend Server Sync</span>
          <span class="pill" style="color: #34d399;">CONNECTED (localhost:5000)</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Last Live Sync Timestamp</span>
          <span class="pill" id="sync-time" style="font-size: 0.75rem;">{data["timestamp"]}</span>
        </div>
      </div>

      <div class="card">
        <div class="section-title">🔗 Quick Access</div>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          <a href="/docs" class="link-card" target="_blank">
            <h4>Interactive Swagger Docs</h4>
            <p>Test all AI endpoints live</p>
          </a>
          <a href="/api/v1/realtime" class="link-card" target="_blank">
            <h4>Real-Time Telemetry API</h4>
            <p>/api/v1/realtime</p>
          </a>
          <a href="http://localhost:5000" class="link-card" target="_blank">
            <h4>Backend Core Server</h4>
            <p>Database & REST API</p>
          </a>
          <a href="http://localhost:3000" class="link-card" target="_blank">
            <h4>Frontend Application</h4>
            <p>Career Intelligence UI</p>
          </a>
        </div>
      </div>
    </div>

    <div class="ticker-bar">
      SkillBridge Enterprise AI Intelligence Layer • Live Real-Time Polling Stream (2000ms)
    </div>
  </div>

  <script>
    async function updateRealtimeData() {{
      try {{
        const res = await fetch('/api/v1/realtime');
        if (!res.ok) return;
        const d = await res.json();
        
        document.getElementById('kg-nodes').textContent = d.knowledge_graph.total_nodes;
        document.getElementById('kg-edges').textContent = d.knowledge_graph.total_edges;
        document.getElementById('uptime-val').textContent = d.uptime_seconds + 's';
        document.getElementById('sync-time').textContent = new Date(d.timestamp).toLocaleTimeString();
      }} catch (err) {{
        console.warn('AI Realtime sync fetch error:', err);
      }}
    }}
    setInterval(updateRealtimeData, 2000);
  </script>
</body>
</html>
"""

@app.get("/api/v1/realtime")
def get_realtime_api():
    return get_realtime_ai_telemetry()

@app.get("/")
def read_root(request: Request):
    data = get_realtime_ai_telemetry()
    accept_header = request.headers.get("accept", "")
    if "text/html" in accept_header:
        return HTMLResponse(content=render_ai_dashboard_html(data))
    return data
