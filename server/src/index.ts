import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { runAgent, getTask, getAllTasks, registerSSEClient } from './agent/executionEngine';
import { memoryStore } from './memory/memoryStore';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL // we can check against specific ones if needed, but true allows all
];

app.use(cors({ 
  origin: true, // This allows wildcard domains securely
  credentials: true 
}));
app.use(express.json());

// ─── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), apiKeySet: !!process.env.GEMINI_API_KEY });
});

// ─── Run a New Task ────────────────────────────────────────────────
app.post('/api/agent/run', async (req, res) => {
  const { userInput } = req.body as { userInput: string };

  if (!userInput || !userInput.trim()) {
    return res.status(400).json({ error: 'userInput is required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  // Start agent asynchronously, return taskId immediately
  const taskIdPromise = runAgent(userInput.trim());

  // Return taskId once created (non-blocking)
  taskIdPromise.then(taskId => {
    console.log(`Task ${taskId} finished.`);
  }).catch(console.error);

  // Small delay to allow task ID to be set
  await new Promise(r => setTimeout(r, 50));
  const allTasks = getAllTasks();
  const latest = allTasks[0];

  return res.json({ taskId: latest?.id || 'pending', message: 'Agent started. Connect to SSE stream for live updates.' });
});

// ─── SSE Stream ────────────────────────────────────────────────────
app.get('/api/agent/stream/:taskId', (req, res) => {
  const { taskId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.flushHeaders();

  registerSSEClient(taskId, res);

  // Send current task state immediately if exists
  const task = getTask(taskId);
  if (task) {
    res.write(`data: ${JSON.stringify({ type: 'task_state', taskId, data: task, timestamp: new Date().toISOString() })}\n\n`);
  }

  // Keepalive
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepalive);
  });
});

// ─── Get Task by ID ────────────────────────────────────────────────
app.get('/api/agent/task/:taskId', (req, res) => {
  const task = getTask(req.params.taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json(task);
});

// ─── Get All Tasks ─────────────────────────────────────────────────
app.get('/api/agent/tasks', (_req, res) => {
  return res.json(getAllTasks());
});

// ─── Memory Endpoints ──────────────────────────────────────────────
app.get('/api/memory', (_req, res) => {
  return res.json({ longTerm: memoryStore.getAllLongTerm() });
});

app.get('/api/memory/:taskId', (req, res) => {
  const session = memoryStore.getSession(req.params.taskId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  return res.json(session);
});

// ─── Start Server ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AgenticAI Server running on http://localhost:${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/api/agent/stream/:taskId`);
  console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing — set GEMINI_API_KEY in .env'}\n`);
});

export default app;
