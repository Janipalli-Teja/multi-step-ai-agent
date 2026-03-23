import React, { useState, useEffect, useCallback, useRef } from 'react';
import TaskInput from './components/TaskInput';
import AgentDashboard from './components/AgentDashboard';
import MemoryPanel from './components/MemoryPanel';
import TaskHistory from './components/TaskHistory';
import { type AgentTask, type SSEEvent, type MemoryEntry } from './types';
import { api, createSSEConnection } from './services/api';

const App: React.FC = () => {
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [allTasks, setAllTasks] = useState<AgentTask[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [taskMemory, setTaskMemory] = useState<Record<string, unknown> | null>(null);
  const [longTermMemory, setLongTermMemory] = useState<MemoryEntry[]>([]);
  const [liveThoughtIndex, setLiveThoughtIndex] = useState(0);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  useEffect(() => {
    api.health()
      .then(() => setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  useEffect(() => {
    const fetchMemory = () => api.getMemory().then(d => setLongTermMemory(d.longTerm)).catch(() => {});
    fetchMemory();
    const interval = setInterval(fetchMemory, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    switch (event.type) {
      case 'task_created':
      case 'task_state':
        setCurrentTask(event.data as AgentTask);
        break;
      case 'plan_ready': {
        const d = event.data as { plan: string[]; steps: AgentTask['steps'] };
        setCurrentTask(prev => prev ? { ...prev, plan: d.plan, steps: d.steps, status: 'executing' } : prev);
        break;
      }
      case 'step_started': {
        const step = event.data as AgentTask['steps'][0];
        setLiveThoughtIndex(step.stepNumber - 1);
        setCurrentTask(prev => {
          if (!prev) return prev;
          const steps = prev.steps.map(s => s.id === step.id ? { ...s, ...step } : s);
          return { ...prev, steps };
        });
        break;
      }
      case 'thought': {
        const d = event.data as { stepId: string; thought: string; tool: string; input: Record<string, unknown> };
        setCurrentTask(prev => {
          if (!prev) return prev;
          const steps = prev.steps.map(s =>
            s.id === d.stepId ? { ...s, thought: d.thought, toolUsed: d.tool, toolInput: d.input } : s
          );
          return { ...prev, steps };
        });
        break;
      }
      case 'step_completed':
      case 'step_failed': {
        const step = event.data as AgentTask['steps'][0] | { step: AgentTask['steps'][0]; error: string };
        const actualStep = 'step' in step ? step.step : step;
        setCurrentTask(prev => {
          if (!prev) return prev;
          const steps = prev.steps.map(s => s.id === actualStep.id ? { ...s, ...actualStep } : s);
          return { ...prev, steps };
        });
        break;
      }
      case 'memory_updated': {
        const mem = event.data as { shortTerm: Record<string, unknown> };
        if (mem?.shortTerm) setTaskMemory(mem.shortTerm);
        break;
      }
      case 'task_completed': {
        const d = event.data as { task: AgentTask; finalResponse: string };
        setCurrentTask({ ...d.task, finalResponse: d.finalResponse });
        setIsRunning(false);
        setAllTasks(prev => {
          const exists = prev.find(t => t.id === d.task.id);
          return exists ? prev.map(t => t.id === d.task.id ? d.task : t) : [d.task, ...prev];
        });
        sseRef.current?.close();
        break;
      }
      case 'task_failed': {
        setCurrentTask(prev => prev ? { ...prev, status: 'failed' } : prev);
        setIsRunning(false);
        sseRef.current?.close();
        break;
      }
    }
  }, []);

  const handleSubmit = async (userInput: string) => {
    setIsRunning(true);
    setCurrentTask(null);
    setTaskMemory(null);
    setLiveThoughtIndex(0);
    sseRef.current?.close();

    try {
      const { taskId } = await api.runTask(userInput);
      const es = createSSEConnection(taskId, handleSSEEvent);
      sseRef.current = es;
    } catch (err) {
      console.error('Failed to start task:', err);
      setIsRunning(false);
    }
  };

  const handleSelectTask = (task: AgentTask) => {
    setCurrentTask(task);
    api.getTaskMemory(task.id).then(m => setTaskMemory(m.shortTerm)).catch(() => {});
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-sans bg-bgBase overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid" />
      <div className="fixed rounded-full blur-[100px] pointer-events-none z-0 opacity-40 w-[600px] h-[600px] -top-[200px] -left-[200px] bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)]" />
      <div className="fixed rounded-full blur-[100px] pointer-events-none z-0 opacity-40 w-[500px] h-[500px] -bottom-[150px] -right-[150px] bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] animate-glow-drift" />

      {serverOnline === false && (
        <div className="relative z-50 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border-b border-amber-500/30 px-6 py-2.5 text-[13px] text-amber-300 text-center">
          ⚠️ Server offline — start the server with <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">npm run dev</code> in the root folder, then add your <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">GEMINI_API_KEY</code> to <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">.env</code>
        </div>
      )}

      <header className="relative z-50 flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 border-b border-white/5 bg-black/80 backdrop-blur-xl gap-4 md:gap-0">
        <div className="flex flex-row items-center justify-center gap-2">
          <span className="text-2xl animate-float">🤖</span>
          <span className="text-xl font-extrabold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">AI Assistant</span>
        </div>
        
        <nav className="flex items-center justify-center md:justify-end gap-3 flex-wrap w-full md:w-auto">
          
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${serverOnline === true ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : serverOnline === false ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${serverOnline === true ? 'bg-emerald-400 animate-pulse-dot shadow-[0_0_6px_#34d399]' : serverOnline === false ? 'bg-rose-400' : 'bg-amber-400 animate-fast-pulse-dot'}`} />
            {serverOnline === true ? 'Server Online' : serverOnline === false ? 'Server Offline' : 'Checking...'}
          </div>
        </nav>
      </header>

      <main className="relative z-10 flex flex-col lg:grid lg:grid-cols-[260px_1fr_280px] gap-6 p-4 md:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-65px)]">
        
        <aside className="flex flex-col gap-4 order-2 lg:order-1">
          <TaskHistory tasks={allTasks} onSelectTask={handleSelectTask} currentTaskId={currentTask?.id} />

          <div className="bg-neutral-900/80 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-3.5">Architecture</h4>
            <div className="flex flex-col items-center gap-1">
              {['User Input', 'Planner (LLM)', 'Agent Loop', 'Tool Layer', 'Memory', 'Response'].map((item, i, arr) => (
                <React.Fragment key={i}>
                  <div className="w-full text-center px-3 py-2 bg-blue-500/5 border border-blue-500/15 rounded-lg text-xs font-medium text-slate-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors">{item}</div>
                  {i < arr.length - 1 && <div className="text-xs text-slate-500">↓</div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex flex-col gap-5 min-w-0 order-1 lg:order-2">
          <TaskInput onSubmit={handleSubmit} isRunning={isRunning} currentTask={currentTask} />
          <AgentDashboard 
            task={currentTask} 
            liveThoughtIndex={liveThoughtIndex} 
            onRetry={() => currentTask && handleSubmit(currentTask.userInput)}
          />
        </section>

        <aside className="flex flex-col gap-4 order-3 lg:order-3">
          <MemoryPanel taskMemory={taskMemory} longTermMemory={longTermMemory} task={currentTask} />

          <div className="bg-neutral-900/80 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
            <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-3.5">Available Tools</h4>
            <div className="flex flex-col gap-2">
              {[
                { icon: '📅', name: 'calendar', desc: 'Manage events' },
                { icon: '📧', name: 'email_sender', desc: 'Send emails' },
                { icon: '🔍', name: 'search', desc: 'Find info' },
                { icon: '🧠', name: 'memory', desc: 'Store state' },
              ].map(tool => (
                <div key={tool.name} className="flex items-center gap-3 p-2.5 bg-white/5 border border-white/5 rounded-lg hover:bg-violet-500/10 hover:border-violet-500/20 transition-all">
                  <span className="text-lg shrink-0">{tool.icon}</span>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-100">{tool.name}</p>
                    <p className="text-[11px] text-slate-500">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
};

export default App;
