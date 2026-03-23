import React from 'react';
import { type AgentTask } from '../types';

interface TaskHistoryProps {
  tasks: AgentTask[];
  onSelectTask: (task: AgentTask) => void;
  currentTaskId?: string;
}

const TaskHistory: React.FC<TaskHistoryProps> = ({ tasks, onSelectTask, currentTaskId }) => {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-[#0d1117]/80 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
      <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500 mb-3">📜 Task History</h3>
      <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1
        [&::-webkit-scrollbar]:w-1.5 
        [&::-webkit-scrollbar-track]:bg-white/5 
        [&::-webkit-scrollbar-thumb]:bg-white/10 
        [&::-webkit-scrollbar-thumb]:rounded-full 
        hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
        
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all
              ${task.id === currentTaskId 
                ? 'bg-blue-500/10 border-blue-500/30' 
                : 'bg-white/5 border-transparent hover:bg-blue-500/10 hover:border-blue-500/20'
              }`}
            onClick={() => onSelectTask(task)}
          >
            <div className={`w-[7px] h-[7px] rounded-full shrink-0
              ${task.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]' 
                : task.status === 'failed' ? 'bg-rose-500' 
                : 'bg-blue-500 animate-[pulse-dot_1.5s_infinite]'}
            `} />
            
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">{task.userInput}</p>
              <span className="text-[10px] text-slate-500">{new Date(task.createdAt).toLocaleTimeString()}</span>
            </div>
            
            <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
              ${task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' 
                : task.status === 'failed' ? 'bg-rose-500/20 text-rose-300' 
                : 'bg-blue-500/20 text-blue-300'}
            `}>
              {task.status === 'completed' ? '✓' : task.status === 'failed' ? '✗' : '⟳'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskHistory;
