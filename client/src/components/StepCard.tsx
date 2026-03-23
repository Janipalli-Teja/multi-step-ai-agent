import React from 'react';
import { type AgentStep, type StepStatus } from '../types';

const TOOL_ICONS: Record<string, string> = {
  calendar: '📅',
  notification: '📩',
  search: '🔍',
  memory: '🧠',
};

const STATUS_CONFIG: Record<StepStatus, { label: string; colorClass: string; pulse: boolean; badgeBg: string; badgeBorder: string }> = {
  pending: { label: 'Pending', colorClass: 'text-slate-500', pulse: false, badgeBg: 'bg-slate-500/10', badgeBorder: 'border-slate-500/30' },
  running: { label: 'Running...', colorClass: 'text-blue-500', pulse: true, badgeBg: 'bg-blue-500/10', badgeBorder: 'border-blue-500/30' },
  retrying: { label: 'Retrying...', colorClass: 'text-amber-500', pulse: true, badgeBg: 'bg-amber-500/10', badgeBorder: 'border-amber-500/30' },
  completed: { label: 'Completed', colorClass: 'text-emerald-500', pulse: false, badgeBg: 'bg-emerald-500/10', badgeBorder: 'border-emerald-500/30' },
  failed: { label: 'Failed', colorClass: 'text-rose-500', pulse: false, badgeBg: 'bg-rose-500/10', badgeBorder: 'border-rose-500/30' },
};

interface StepCardProps {
  step: AgentStep;
  isLatestThought?: boolean;
}

const StepCard: React.FC<StepCardProps> = ({ step, isLatestThought }) => {
  const cfg = STATUS_CONFIG[step.status];
  const toolIcon = step.toolUsed ? TOOL_ICONS[step.toolUsed] || '🔧' : '';

  let cardClasses = 'relative bg-gray-900/80 border rounded-xl p-4.5 backdrop-blur-md transition-all overflow-hidden ';
  if (isLatestThought) {
    cardClasses += 'border-blue-500/30 bg-blue-500/5 before:opacity-100 before:animate-shimmer';
  } else if (step.status === 'completed') {
    cardClasses += 'border-emerald-500/20 bg-emerald-500/5 before:opacity-0';
  } else if (step.status === 'failed') {
    cardClasses += 'border-rose-500/20 bg-rose-500/5 before:opacity-0';
  } else if (step.status === 'retrying') {
    cardClasses += 'border-amber-500/30 bg-amber-500/5 before:opacity-0';
  } else {
    cardClasses += 'border-white/5 before:opacity-0';
  }

  return (
    <div className={cardClasses}>
      {/* Shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[linear-gradient(90deg,transparent,theme(colors.blue.500),transparent)] transition-opacity duration-300 pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start gap-3.5">
        <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 mt-0.5 ${step.status === 'completed' ? 'bg-emerald-500' : step.status === 'failed' ? 'bg-rose-500' : step.status === 'running' || isLatestThought ? 'bg-blue-500' : step.status === 'retrying' ? 'bg-amber-500' : 'bg-slate-500'}`}>
          {step.status === 'completed' ? '✓' : step.status === 'failed' ? '✗' : step.stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-snug">{step.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border bg-black/30 ${cfg.colorClass} ${cfg.badgeBorder} ${cfg.pulse ? 'animate-badge-pulse' : ''}`}>
              {cfg.pulse && <span className={`w-1.5 h-1.5 rounded-full ${step.status === 'retrying' ? 'bg-amber-500' : 'bg-blue-500'}`} />}
              {cfg.label}
            </span>
            {step.toolUsed && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300">
                {toolIcon} {step.toolUsed}
              </span>
            )}
            {step.retryCount > 0 && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                ↻ Retry {step.retryCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {step.thought && (
        <div className="mt-3.5 pt-3.5 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-purple-400">💭 Thought</span>
          <p className="text-[13px] text-slate-400 leading-relaxed">{step.thought}</p>
        </div>
      )}

      {step.toolInput && (
        <div className="mt-3.5 pt-3.5 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-blue-400">⚡ Action Input</span>
          <pre className="text-[11px] text-sky-300 bg-black/30 rounded-lg p-2.5 overflow-x-auto leading-relaxed border border-white/5 font-mono">
            {JSON.stringify(step.toolInput, null, 2)}
          </pre>
        </div>
      )}

      {step.toolOutput && (
        <div className="mt-3.5 pt-3.5 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-emerald-400">👁 Observation</span>
          <p className="text-[13px] text-slate-400 leading-relaxed">{step.toolOutput}</p>
        </div>
      )}

      {step.error && (
        <div className="mt-3.5 pt-3.5 border-t border-white/5">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1.5 text-rose-400">⚠ Error</span>
          <p className="text-[13px] text-red-300">{step.error}</p>
        </div>
      )}
    </div>
  );
};

export default StepCard;
