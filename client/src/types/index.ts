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
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: unknown;
  timestamp: string;
  taskId: string;
}

export interface SSEEvent {
  type: 
    | 'task_created'
    | 'plan_ready'
    | 'step_started'
    | 'step_completed'
    | 'step_failed'
    | 'thought'
    | 'task_completed'
    | 'task_failed'
    | 'memory_updated'
    | 'task_state';
  taskId: string;
  data: unknown;
  timestamp: string;
}
