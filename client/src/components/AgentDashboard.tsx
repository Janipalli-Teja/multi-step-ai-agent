import React from 'react';
import { type AgentTask } from '../types';
import StepCard from './StepCard';

interface AgentDashboardProps {
  task: AgentTask | null;
  liveThoughtIndex: number;
}

const AgentDashboard: React.FC<AgentDashboardProps> = ({ task, liveThoughtIndex }) => {
  const stepsEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [task?.steps]);

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-10 md:py-20 text-center bg-[#0d1117]/60 border border-white/5 rounded-2xl backdrop-blur-xl">
        <div className="relative w-[120px] h-[120px] mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-[orbit-spin_4s_linear_infinite]" />
          <div className="absolute inset-[15px] rounded-full border border-purple-500/25 animate-[orbit-spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-[30px] rounded-full border border-cyan-500/20 animate-[orbit-spin_3s_linear_infinite]" />
          <div className="text-3xl z-10 animate-float">🤖</div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-slate-100">Agent Ready</h2>
        <p className="text-slate-400 text-[15px] max-w-[400px] mb-7 leading-relaxed">Enter a task above to watch the agent think, plan, and act in real-time.</p>
        <div className="flex gap-2.5 flex-wrap justify-center">
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400">🧠 LLM Planning</span>
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400">⚡ Tool Execution</span>
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400">🔄 Retry Logic</span>
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/5 border border-white/5 text-slate-400">💾 Memory</span>
        </div>
      </div>
    );
  }

  const completedCount = task.steps.filter(s => s.status === 'completed').length;
  const progress = task.steps.length > 0 ? (completedCount / task.steps.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Task Info Bar */}
      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 bg-[#0d1117]/80 border border-white/5 rounded-xl px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">Task ID</span>
          <span className="font-mono text-xs text-slate-400">{task.id.split('-')[0]}...</span>
        </div>
        
        <div className="basis-full md:basis-auto flex-1 flex items-center gap-3 order-3 md:order-none mt-2 md:mt-0">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">{completedCount}/{task.steps.length} steps</span>
        </div>
        
        <div className="ml-auto">
          <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap border
            ${task.status === 'planning' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : ''}
            ${task.status === 'executing' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : ''}
            ${task.status === 'completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : ''}
            ${task.status === 'failed' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : ''}
          `}>
            {task.status === 'planning' && '🧠 Planning'}
            {task.status === 'executing' && '⚡ Executing'}
            {task.status === 'completed' && '✅ Completed'}
            {task.status === 'failed' && '❌ Failed'}
          </span>
        </div>
      </div>

      {/* User Goal */}
      <div className="flex items-start gap-3 bg-gradient-to-br from-blue-500/10 to-violet-500/5 border border-blue-500/20 rounded-xl p-4 md:px-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-blue-500 mt-0.5 whitespace-nowrap">🎯 Goal</span>
        <p className="text-[15px] text-slate-100 italic leading-relaxed">"{task.userInput}"</p>
      </div>

      {/* Plan Overview */}
      {task.plan.length > 0 && (
        <div className="bg-[#0d1117]/60 border border-white/5 rounded-xl p-5">
          <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">📋 Generated Plan</h3>
          <div className="flex flex-col gap-2">
            {task.plan.map((step, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-all
                  ${i < completedCount ? 'bg-emerald-500/5 border-emerald-500/15' : 
                    i === completedCount && task.status === 'executing' ? 'bg-blue-500/10 border-blue-500/25 animate-step-glow' : 
                    'bg-white/5 border-transparent'}
                `}
              >
                <span className={`w-[22px] h-[22px] rounded-full text-[11px] font-bold flex items-center justify-center shrink-0
                  ${i < completedCount ? 'bg-emerald-500/20 text-emerald-300' : 
                    i === completedCount && task.status === 'executing' ? 'bg-blue-500/20 text-blue-300' : 
                    'bg-white/10 text-slate-500'}
                `}>
                  {i + 1}
                </span>
                <span className={`text-[13px] flex-1 ${i < completedCount ? 'text-slate-500' : 'text-slate-400'}`}>
                  {step}
                </span>
                {i < completedCount && <span className="text-emerald-500 font-bold text-sm">✓</span>}
                {i === completedCount && task.status === 'executing' && <span className="text-blue-500 font-bold animate-arrow-pulse">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ReAct Loop Visualization */}
      {task.status === 'executing' && (
        <div className="bg-[#0d1117]/60 border border-white/5 rounded-xl p-5 hidden sm:block">
          <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-center sm:text-left">🔄 ReAct Loop</h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 flex-wrap">
            {['Think', 'Act', 'Observe', 'Adjust'].map((phase, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center gap-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all border
                  ${liveThoughtIndex % 4 === i 
                    ? 'bg-blue-500/15 border-blue-500/40 shadow-[0_0_16px_rgba(59,130,246,0.3)] animate-loop-beat' 
                    : 'bg-white/5 border-white/5'}
                `}>
                  {['💭', '⚡', '👁', '🔧'][i]}
                </div>
                <span className="text-xs text-slate-500 font-semibold uppercase">{phase}</span>
                {i < 3 && <div className="text-slate-500 text-lg sm:mx-1 rotate-90 sm:rotate-0">→</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Cards */}
      <div>
        <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-widest mb-3">⚙️ Execution Steps</h3>
        <div className="flex flex-col gap-3">
          {task.steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              isLatestThought={task.status === 'executing' && i === liveThoughtIndex}
            />
          ))}
        </div>
      </div>

      {/* Final Response */}
      {task.finalResponse && (
        <div className="flex items-start gap-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
          <div className="text-[32px] animate-float">✅</div>
          <div>
            <h3 className="text-base font-bold text-emerald-300 mb-2">Mission Accomplished</h3>
            <p className="text-[15px] text-slate-400 leading-relaxed">{task.finalResponse}</p>
          </div>
        </div>
      )}

      <div ref={stepsEndRef} />
    </div>
  );
};

export default AgentDashboard;
