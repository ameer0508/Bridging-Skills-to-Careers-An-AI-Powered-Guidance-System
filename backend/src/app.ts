import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import resumeRouter from './routes/resume.js';
import skillsRouter from './routes/skills.js';
import careerRouter from './routes/career.js';
import readinessRouter from './routes/readiness.js';
import recommendationsRouter from './routes/recommendations.js';
import roadmapRouter from './routes/roadmap.js';
import analyticsRouter from './routes/analytics.js';
import conversationRouter from './routes/conversation.js';
import opportunitiesRouter from './routes/opportunities.js';
import interviewRouter from './routes/interview.js';
import orchestratorRouter from './routes/orchestrator.js';
import env from './config/env.js';
import { diagnosticsAreOpen, requireDiagnosticsAccess } from './middlewares/diagnostics.js';

import rateLimit from 'express-rate-limit';

const app = express();

// Behind the bundled nginx proxy in production, trust one hop so rate limiting and
// request logs see the real client address instead of the proxy's.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

import { Career } from './models/Career.js';
import { CareerRequirement } from './models/CareerRequirement.js';
import { Recommendation } from './models/Recommendation.js';
import { SavedOpportunity } from './models/SavedOpportunity.js';

// Security and Hardening Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy does not allow access from this origin.'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api/', apiLimiter);
app.use(requestLogger);

// Real-Time System Telemetry Helper
const getBackendRealtimeData = async () => {
  const dbConnected = mongoose.connection.readyState === 1;
  let careerCount = 0;
  let recommendationCount = 0;
  let requirementCount = 0;
  let opportunityCount = 0;

  if (dbConnected) {
    try {
      const [careers, recs, reqs, opps] = await Promise.all([
        Career.countDocuments().catch(() => 0),
        Recommendation.countDocuments().catch(() => 0),
        CareerRequirement.countDocuments().catch(() => 0),
        SavedOpportunity.countDocuments().catch(() => 0),
      ]);
      careerCount = careers;
      recommendationCount = recs;
      requirementCount = reqs;
      opportunityCount = opps;
    } catch {
      // fallback
    }
  }

  const memory = process.memoryUsage();
  return {
    success: true,
    service: 'SkillBridge Career Intelligence Platform - Backend Core',
    status: dbConnected ? 'LIVE_OPERATIONAL' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    database: {
      status: dbConnected ? 'CONNECTED' : 'DISCONNECTED',
      host: dbConnected ? mongoose.connection.host : null,
      careers_count: careerCount,
      requirements_count: requirementCount,
      recommendations_count: recommendationCount,
      saved_opportunities_count: opportunityCount,
    },
    system: {
      node_version: process.version,
      platform: process.platform,
      memory_rss_mb: Math.round((memory.rss / (1024 * 1024)) * 10) / 10,
      heap_used_mb: Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10,
      heap_total_mb: Math.round((memory.heapTotal / (1024 * 1024)) * 10) / 10,
    },
    ai_service: {
      url: env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
      health_url: `${env.AI_SERVICE_URL || 'http://127.0.0.1:8000'}/api/v1/health`,
    },
    endpoints: {
      frontend_ui: 'http://localhost:3000',
      health: 'http://localhost:5000/health',
      realtime_api: 'http://localhost:5000/api/v1/realtime',
      api_root: 'http://localhost:5000/api/v1',
    },
  };
};

// Real-Time HTML Dashboard Generator
const renderBackendDashboardHtml = (data: Awaited<ReturnType<typeof getBackendRealtimeData>>) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkillBridge Backend | Real-Time Operations Console</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 25, 43, 0.7);
      --card-border: rgba(99, 102, 241, 0.15);
      --primary: #6366f1;
      --primary-light: #818cf8;
      --accent: #06b6d4;
      --emerald: #10b981;
      --amber: #f59e0b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: radial-gradient(circle at 50% 0%, #172038 0%, var(--bg) 75%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      padding: 2.5rem 1.5rem;
    }
    .container { max-width: 1100px; margin: 0 auto; width: 100%; }
    .header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--card-border);
    }
    .badge-live {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.4rem 0.9rem;
      border-radius: 9999px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 10px #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
    }
    .title {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 0.25rem; }
    .hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      padding: 0.85rem 1.75rem;
      border-radius: 0.75rem;
      font-weight: 700;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
      transition: all 0.2s ease;
    }
    .hero-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.6);
    }
    .grid-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      backdrop-filter: blur(12px);
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-2px);
    }
    .card-label { font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
    .card-val { font-size: 1.85rem; font-weight: 800; color: #fff; font-family: 'JetBrains Mono', monospace; }
    .card-hint { font-size: 0.8rem; color: var(--accent); margin-top: 0.4rem; display: flex; align-items: center; gap: 0.35rem; }
    .section-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: #e2e8f0; display: flex; align-items: center; gap: 0.5rem; }
    .status-panel {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    @media (max-width: 850px) { .status-panel { grid-template-columns: 1fr; } }
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.92rem;
    }
    .list-item:last-child { border-bottom: none; }
    .pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 0.4rem;
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
    }
    .pill-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    .link-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      text-decoration: none;
      color: var(--text);
      display: block;
      transition: background 0.2s;
    }
    .link-card:hover { background: rgba(99, 102, 241, 0.1); border-color: var(--primary); }
    .link-card h4 { font-size: 0.95rem; margin-bottom: 0.25rem; color: #fff; }
    .link-card p { font-size: 0.8rem; color: var(--text-muted); }
    .ticker-bar {
      margin-top: auto;
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      padding-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="badge-live"><span class="pulse-dot"></span> Backend Running</div>
        <h1 class="title" style="margin-top: 0.75rem;">SkillBridge Backend Core</h1>
        <p class="subtitle">REST API Foundation & Live Career Intelligence Engine</p>
      </div>
      <div>
        <a href="http://localhost:3000" class="hero-btn" target="_blank">
          <span>🚀 Launch Web Application</span>
          <span style="opacity: 0.8; font-size: 0.85rem;">:3000</span>
        </a>
      </div>
    </div>

    <!-- Live Telemetry Row -->
    <div class="grid-metrics">
      <div class="card">
        <div class="card-label">Database Status</div>
        <div class="card-val" id="db-status" style="color: #34d399;">${data.database.status}</div>
        <div class="card-hint">MongoDB connection state</div>
      </div>
      <div class="card">
        <div class="card-label">Career Taxonomy</div>
        <div class="card-val" id="careers-count">${data.database.careers_count}</div>
        <div class="card-hint">Verified career paths</div>
      </div>
      <div class="card">
        <div class="card-label">Learning Resources</div>
        <div class="card-val" id="recs-count">${data.database.recommendations_count}</div>
        <div class="card-hint">Adaptive recommendations</div>
      </div>
      <div class="card">
        <div class="card-label">Memory Allocation</div>
        <div class="card-val" id="mem-rss">${data.system.memory_rss_mb} <span style="font-size: 1rem; color: var(--text-muted);">MB</span></div>
        <div class="card-hint">Heap: <span id="mem-heap">${data.system.heap_used_mb}</span> MB</div>
      </div>
    </div>

    <!-- System & Ecosystem Status Panel -->
    <div class="status-panel">
      <div class="card">
        <div class="section-title">⚡ Live System Telemetry</div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Process Uptime</span>
          <span class="pill" id="uptime-val">${data.uptime_seconds}s</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Node Environment</span>
          <span class="pill">${process.env.NODE_ENV || 'development'} (${data.system.node_version})</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">AI Intelligence Service</span>
          <span class="pill" id="ai-status">configured: ${data.ai_service.url} (not probed here)</span>
        </div>
        <div class="list-item">
          <span style="color: var(--text-muted);">Last Live Telemetry Sync</span>
          <span class="pill" id="sync-time" style="font-size: 0.75rem;">${data.timestamp}</span>
        </div>
      </div>

      <div class="card">
        <div class="section-title">🔗 Quick Access</div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a href="http://localhost:3000" class="link-card" target="_blank">
            <h4>Frontend Web App</h4>
            <p>React 19 + Tailwind v4 UI</p>
          </a>
          <a href="http://127.0.0.1:8000" class="link-card" target="_blank">
            <h4>AI Intelligence Layer</h4>
            <p>FastAPI ML Gateway</p>
          </a>
          <a href="/api/v1/realtime" class="link-card" target="_blank">
            <h4>Real-Time JSON API</h4>
            <p>/api/v1/realtime</p>
          </a>
          <a href="/health" class="link-card" target="_blank">
            <h4>Health Endpoint</h4>
            <p>/health</p>
          </a>
        </div>
      </div>
    </div>

    <div class="ticker-bar">
      SkillBridge Enterprise Career Intelligence Platform • Live Auto-Refreshing Stream (2000ms)
    </div>
  </div>

  <script>
    async function updateRealtimeData() {
      try {
        const res = await fetch('/api/v1/realtime');
        if (!res.ok) return;
        const d = await res.json();
        
        document.getElementById('db-status').textContent = d.database.status;
        document.getElementById('careers-count').textContent = d.database.careers_count;
        document.getElementById('recs-count').textContent = d.database.recommendations_count;
        document.getElementById('mem-rss').innerHTML = d.system.memory_rss_mb + ' <span style="font-size: 1rem; color: #94a3b8;">MB</span>';
        document.getElementById('mem-heap').textContent = d.system.heap_used_mb;
        document.getElementById('uptime-val').textContent = d.uptime_seconds + 's';
        document.getElementById('sync-time').textContent = new Date(d.timestamp).toLocaleTimeString();
      } catch (err) {
        console.warn('Realtime sync fetch error:', err);
      }
    }
    setInterval(updateRealtimeData, 2000);
  </script>
</body>
</html>
`;

// Root endpoint. On a developer's machine it serves the status page (which polls the
// diagnostics endpoint below). Anywhere else it is a plain banner with no system details.
app.get('/', async (req, res) => {
  if (!diagnosticsAreOpen()) {
    return res.status(200).json({ success: true, service: 'SkillBridge API', health: '/health' });
  }
  const realtimeData = await getBackendRealtimeData();
  if (req.accepts('html')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderBackendDashboardHtml(realtimeData));
  }
  return res.status(200).json(realtimeData);
});

// Infrastructure diagnostics: uptime, memory, database host and global record counts.
// Open in local development only; otherwise administrators only (see middlewares/diagnostics.ts).
app.get('/api/v1/realtime', requireDiagnosticsAccess, async (_req, res, next) => {
  try {
    res.status(200).json(await getBackendRealtimeData());
  } catch (error) {
    next(error);
  }
});

// Health check endpoint. Public on purpose (load balancers and Compose use it), so it reports
// only whether the service and its database are up.
app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const statusCode = dbStatus === 'UP' ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
    },
  });
});

// Root API V1 metadata response
app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillBridge API Foundation Active',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      resumes: '/api/v1/resumes',
      skills: '/api/v1/skills',
      careers: '/api/v1/careers',
      readiness: '/api/v1/readiness',
      recommendations: '/api/v1/recommendations',
      roadmap: '/api/v1/roadmap',
      analytics: '/api/v1/analytics',
      ai: '/api/v1/ai',
      opportunities: '/api/v1/opportunities',
      interviews: '/api/v1/interviews',
    },
  });
});

// API Route Registrations
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/resumes', resumeRouter);
app.use('/api/v1/skills', skillsRouter);
app.use('/api/v1/careers', careerRouter);
app.use('/api/v1/readiness', readinessRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/roadmap', roadmapRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/ai', conversationRouter);
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/interviews', interviewRouter);
app.use('/api/v1/orchestrator', orchestratorRouter);

// Error handling middleware
app.use(errorHandler);

export default app;
