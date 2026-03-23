import axios from 'axios';
import { type AgentTask, type MemoryEntry, type SSEEvent } from '../types';

const BASE_URL = 'http://localhost:3001/api';

export const api = {
  health: () => axios.get(`${BASE_URL}/health`),

  runTask: (userInput: string): Promise<{ taskId: string; message: string }> =>
    axios.post(`${BASE_URL}/agent/run`, { userInput }).then(r => r.data),

  getTask: (taskId: string): Promise<AgentTask> =>
    axios.get(`${BASE_URL}/agent/task/${taskId}`).then(r => r.data),

  getAllTasks: (): Promise<AgentTask[]> =>
    axios.get(`${BASE_URL}/agent/tasks`).then(r => r.data),

  getMemory: (): Promise<{ longTerm: MemoryEntry[] }> =>
    axios.get(`${BASE_URL}/memory`).then(r => r.data),

  getTaskMemory: (taskId: string) =>
    axios.get(`${BASE_URL}/memory/${taskId}`).then(r => r.data),
};

export function createSSEConnection(taskId: string, onEvent: (event: SSEEvent) => void): EventSource {
  const es = new EventSource(`${BASE_URL}/agent/stream/${taskId}`);
  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data) as SSEEvent;
      onEvent(event);
    } catch {
      // ignore malformed
    }
  };
  es.onerror = () => {
    es.close();
  };
  return es;
}
