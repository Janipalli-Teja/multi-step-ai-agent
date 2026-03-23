import React from 'react';
import { type AgentTask } from '../types';

interface TaskInputProps {
  onSubmit: (input: string) => void;
  isRunning: boolean;
  currentTask: AgentTask | null;
}

const EXAMPLE_TASKS = [
  'Book a meeting with the team tomorrow at 3PM and notify everyone',
  'Schedule a project review session and send calendar invites to all stakeholders',
  'Find available time slots and organize a weekly standup meeting',
  'Set up an emergency team sync and alert all members immediately',
];

const TaskInput: React.FC<TaskInputProps> = ({ onSubmit, isRunning, currentTask }) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isRunning) {
      onSubmit(input.trim());
    }
  };

  const getStatusInfo = () => {
    if (!currentTask) return null;
    const statusMap = {
      planning: { label: 'Planning steps...', color: 'text-amber-500 border-amber-500/30', bg: 'bg-amber-500/10', icon: '🧠' },
      executing: { label: 'Executing task...', color: 'text-blue-400 border-blue-500/30', bg: 'bg-blue-500/10', icon: '⚡' },
      completed: { label: 'Task completed!', color: 'text-emerald-400 border-emerald-500/30', bg: 'bg-emerald-500/10', icon: '✅' },
      failed: { label: 'Task failed', color: 'text-rose-400 border-rose-500/30', bg: 'bg-rose-500/10', icon: '❌' },
    };
    return statusMap[currentTask.status];
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-[#0d1117]/90 border border-white/5 rounded-2xl p-5 md:p-7 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6 text-center md:text-left">
        <div className="relative w-[52px] h-[52px] flex items-center justify-center shrink-0">
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-br from-blue-500 to-violet-500 [mask-image:linear-gradient(#fff_0_0)] [mask-composite:exclude] animate-spin-slow" />
          <span className="text-2xl z-10">🤖</span>
        </div>
        <div>
          <h1 className="text-[22px] font-extrabold bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent">AgenticAI</h1>
          <p className="text-xs text-slate-500 mt-0.5">Autonomous Multi-Step AI Agent</p>
        </div>
        {statusInfo && (
          <div className={`mt-3 md:mt-0 md:ml-auto flex items-center gap-2 text-[13px] font-semibold px-3.5 py-1.5 rounded-full border ${statusInfo.color} ${statusInfo.bg}`}>
            <span className={isRunning ? 'animate-spin-slow' : ''}>{statusInfo.icon}</span>
            {statusInfo.label}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mb-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-1 sm:p-0">
          <span className="hidden sm:block px-3.5 text-base text-slate-500">✨</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. Book a meeting with the team and notify everyone..."
            disabled={isRunning}
            className="flex-1 px-3 py-3.5 sm:py-3.5 bg-transparent border-none outline-none font-sans text-[15px] text-slate-100 placeholder-slate-500 disabled:opacity-50 text-center sm:text-left"
          />
          <button
            type="submit"
            disabled={isRunning || !input.trim()}
            className={`flex items-center justify-center gap-2 py-3 px-6 sm:py-3 sm:px-6 m-1 sm:m-1.5 rounded-lg bg-gradient-to-br text-white font-bold text-sm transition-all shadow-lg whitespace-nowrap
              ${isRunning ? 'from-blue-800 to-violet-900 bg-blue-900' : 'from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 hover:-translate-y-px hover:shadow-blue-500/40'} 
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRunning ? (
              <><span className="animate-spin inline-block">⟳</span> Running</>
            ) : (
              <><span>▶</span> Run Agent</>
            )}
          </button>
        </div>
      </form>

      {!currentTask && (
        <div>
          <p className="text-xs text-slate-500 mb-2.5 font-medium text-center md:text-left">Try an example:</p>
          <div className="flex flex-col gap-2">
            {EXAMPLE_TASKS.map((task, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(task)}
                disabled={isRunning}
                className="text-left py-2.5 px-3.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-[13px] hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-slate-100 hover:translate-x-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-sans"
              >
                {task}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskInput;
