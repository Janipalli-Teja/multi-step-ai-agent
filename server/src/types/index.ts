export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';

export interface AgentStep {
  id: string;
  stepNumber: number;
  description: string;
  status: StepStatus;
  toolUsed?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: string;
  thought?: string;
  observation?: string;
  retryCount: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentTask {
  id: string;
  userInput: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  plan: string[];
  steps: AgentStep[];
  finalResponse?: string;
  createdAt: string;
  completedAt?: string;
  memory: MemoryState;
}

export interface MemoryState {
  shortTerm: Record<string, unknown>;
  longTerm: MemoryEntry[];
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: unknown;
  timestamp: string;
  taskId: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: Record<string, unknown>, memory: MemoryState) => Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  summary: string;
}

export interface AgentThought {
  thought: string;
  action: string;
  actionInput: Record<string, unknown>;
  toolName: string;
}

export interface SSEEvent {
  type: 'task_created' | 'plan_ready' | 'step_started' | 'step_completed' | 'step_failed' | 'thought' | 'task_completed' | 'task_failed' | 'memory_updated';
  taskId: string;
  data: unknown;
  timestamp: string;
}
