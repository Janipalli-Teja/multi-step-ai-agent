import React from 'react';
import { type MemoryEntry, type AgentTask } from '../types';

interface MemoryPanelProps {
  taskMemory: Record<string, unknown> | null;
  longTermMemory: MemoryEntry[];
  task: AgentTask | null;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ taskMemory, longTermMemory, task }) => {
  const [activeTab, setActiveTab] = React.useState<'short' | 'long'>('short');

  const shortTermEntries = taskMemory ? Object.entries(taskMemory) : [];
  const relevantLongTerm = task ? longTermMemory.filter(e => e.taskId === task.id) : longTermMemory;

  return (
    <div className="bg-neutral-900/80 border border-white/5 rounded-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[500px]">
      <div className="flex items-center gap-2 p-4 pb-0 mb-3">
        <span className="text-lg">🧠</span>
        <h3 className="text-sm font-bold text-slate-100">Memory System</h3>
      </div>

      <div className="flex px-4 gap-1 mb-3 shrink-0">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold font-sans transition-all
            ${activeTab === 'short' 
              ? 'bg-blue-500/10 border-blue-500/25 text-blue-300' 
              : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-400'
            }`}
          onClick={() => setActiveTab('short')}
        >
          Short-Term
          {shortTermEntries.length > 0 && 
            <span className="bg-blue-500/20 text-blue-300 rounded-full px-1.5 py-[1px] text-[10px]">{shortTermEntries.length}</span>
          }
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-semibold font-sans transition-all
            ${activeTab === 'long' 
              ? 'bg-blue-500/10 border-blue-500/25 text-blue-300' 
              : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-400'
            }`}
          onClick={() => setActiveTab('long')}
        >
          Long-Term
          {relevantLongTerm.length > 0 && 
            <span className="bg-blue-500/20 text-blue-300 rounded-full px-1.5 py-[1px] text-[10px]">{relevantLongTerm.length}</span>
          }
        </button>
      </div>

      <div className="px-4 pb-4 overflow-y-auto flex-1
        [&::-webkit-scrollbar]:w-1 
        [&::-webkit-scrollbar-track]:bg-transparent 
        [&::-webkit-scrollbar-thumb]:bg-white/10 
        [&::-webkit-scrollbar-thumb]:rounded-sm">
        
        {activeTab === 'short' && (
          <>
            {shortTermEntries.length === 0 ? (
              <div className="flex flex-col items-center p-8 text-slate-500 gap-2">
                <span className="text-2xl">🔮</span>
                <p className="text-xs">No short-term memory yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {shortTermEntries.map(([key, value]) => (
                  <div key={key} className="bg-white/5 border border-white/5 rounded-lg p-2.5">
                    <span className="text-[11px] font-bold text-purple-300 font-mono block mb-1">{key}</span>
                    <pre className="text-[10px] text-sky-300 overflow-x-auto max-h-20 leading-relaxed font-mono">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'long' && (
          <>
            {relevantLongTerm.length === 0 ? (
              <div className="flex flex-col items-center p-8 text-slate-500 gap-2">
                <span className="text-2xl">📚</span>
                <p className="text-xs">No long-term memory yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {relevantLongTerm.slice().reverse().map((entry) => (
                  <div key={entry.id} className="bg-white/5 border border-white/5 rounded-lg p-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-bold text-purple-300 font-mono">{entry.key}</span>
                      <span className="text-[10px] text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-[10px] text-sky-300 overflow-x-auto max-h-20 leading-relaxed font-mono">
                      {JSON.stringify(entry.value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemoryPanel;
