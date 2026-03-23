import { MemoryState, MemoryEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

class MemoryStore {
  private sessions: Map<string, MemoryState> = new Map();
  private longTermStore: MemoryEntry[] = [];

  initSession(taskId: string): MemoryState {
    const memory: MemoryState = {
      shortTerm: {},
      longTerm: [], // Start fresh as per user request
    };
    this.sessions.set(taskId, memory);
    return memory;
  }

  getSession(taskId: string): MemoryState | undefined {
    return this.sessions.get(taskId);
  }

  setShortTerm(taskId: string, key: string, value: unknown): void {
    const session = this.sessions.get(taskId);
    if (session) {
      session.shortTerm[key] = value;
    }
  }

  getShortTerm(taskId: string, key: string): unknown {
    return this.sessions.get(taskId)?.shortTerm[key];
  }

  saveLongTerm(taskId: string, key: string, value: unknown): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuidv4(),
      key,
      value,
      timestamp: new Date().toISOString(),
      taskId,
    };
    this.longTermStore.push(entry);
    // Sync to session
    const session = this.sessions.get(taskId);
    if (session) {
      session.longTerm = this.longTermStore.slice(-20);
    }
    return entry;
  }

  getAllLongTerm(): MemoryEntry[] {
    return this.longTermStore;
  }

  clearSession(taskId: string): void {
    this.sessions.delete(taskId);
  }

  summarize(taskId: string): string {
    const session = this.sessions.get(taskId);
    if (!session) return 'No memory found.';
    const keys = Object.keys(session.shortTerm);
    const summary = keys.map(k => `${k}: ${JSON.stringify(session.shortTerm[k])}`).join(', ');
    return summary || 'Memory is empty.';
  }
}

export const memoryStore = new MemoryStore();
