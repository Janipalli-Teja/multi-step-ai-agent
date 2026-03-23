import { v4 as uuidv4 } from 'uuid';
import { AgentTask, AgentStep, SSEEvent } from '../types';
import { planTask, think, generateFinalResponse } from './planner';
import { toolRegistry } from '../tools';
import { memoryStore } from '../memory/memoryStore';
import { Response } from 'express';

const MAX_RETRIES = 3;
const tasks = new Map<string, AgentTask>();
const sseClients = new Map<string, Response[]>();

// ─── SSE Broadcasting ──────────────────────────────────────────────
export function registerSSEClient(taskId: string, res: Response): void {
  if (!sseClients.has(taskId)) {
    sseClients.set(taskId, []);
  }
  sseClients.get(taskId)!.push(res);
}

function broadcast(taskId: string, event: SSEEvent): void {
  const clients = sseClients.get(taskId) || [];
  const data = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach(client => {
    try {
      client.write(data);
    } catch {
      // client disconnected
    }
  });
}

// ─── Task Management ──────────────────────────────────────────────
export function getTask(taskId: string): AgentTask | undefined {
  return tasks.get(taskId);
}

export function getAllTasks(): AgentTask[] {
  return Array.from(tasks.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─── Main Agent Execution Loop ────────────────────────────────────
export async function runAgent(userInput: string): Promise<string> {
  const taskId = uuidv4();
  const memory = memoryStore.initSession(taskId);

  const task: AgentTask = {
    id: taskId,
    userInput,
    status: 'planning',
    plan: [],
    steps: [],
    createdAt: new Date().toISOString(),
    memory,
  };
  tasks.set(taskId, task);

  broadcast(taskId, { type: 'task_created', taskId, data: task, timestamp: new Date().toISOString() });

  try {
    // ── Phase 1: Planning ──────────────────────────────────────────
    console.log(`[Agent ${taskId}] Planning task: "${userInput}"`);
    const plan = await planTask(userInput);
    task.plan = plan;
    task.status = 'executing';

    // Initialize steps
    task.steps = plan.map((description, index) => ({
      id: uuidv4(),
      stepNumber: index + 1,
      description,
      status: 'pending',
      retryCount: 0,
    }));

    broadcast(taskId, { type: 'plan_ready', taskId, data: { plan, steps: task.steps }, timestamp: new Date().toISOString() });

    // ── Phase 2: Execution Loop ────────────────────────────────────
    const completedStepOutputs: Array<{ description: string; toolOutput: string }> = [];
    let previousObservations = '';

    for (const step of task.steps) {
      step.status = 'running';
      step.startedAt = new Date().toISOString();
      broadcast(taskId, { type: 'step_started', taskId, data: step, timestamp: new Date().toISOString() });

      let stepCompleted = false;

      // ReAct Loop: Think → Act → Observe → Adjust
      while (!stepCompleted && step.retryCount <= MAX_RETRIES) {
        try {
          // THINK
          const memorySummary = memoryStore.summarize(taskId);
          const agentThought = await think(taskId, userInput, step.description, previousObservations, memorySummary);

          step.thought = agentThought.thought;
          step.toolUsed = agentThought.toolName;
          step.toolInput = agentThought.actionInput;

          broadcast(taskId, { type: 'thought', taskId, data: { stepId: step.id, thought: agentThought.thought, tool: agentThought.toolName, input: agentThought.actionInput }, timestamp: new Date().toISOString() });

          // ACT
          const tool = toolRegistry.get(agentThought.toolName);
          if (!tool) throw new Error(`Tool "${agentThought.toolName}" not found in registry`);

          const toolResult = await tool.execute(agentThought.actionInput, memory);

          // OBSERVE
          step.observation = toolResult.summary;
          step.toolOutput = toolResult.summary;
          previousObservations += `\n[Step ${step.stepNumber}] ${step.description}: ${toolResult.summary}`;

          // Save result to memory
          memoryStore.setShortTerm(taskId, `step_${step.stepNumber}_result`, toolResult.data);
          memoryStore.saveLongTerm(taskId, `step_${step.stepNumber}`, { description: step.description, result: toolResult.summary });

          if (toolResult.success) {
            step.status = 'completed';
            step.completedAt = new Date().toISOString();
            stepCompleted = true;
            completedStepOutputs.push({ description: step.description, toolOutput: toolResult.summary });
            broadcast(taskId, { type: 'step_completed', taskId, data: step, timestamp: new Date().toISOString() });
            broadcast(taskId, { type: 'memory_updated', taskId, data: memoryStore.getSession(taskId), timestamp: new Date().toISOString() });
          } else {
            throw new Error(toolResult.error || 'Tool returned failure');
          }

        } catch (err) {
          step.retryCount++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[Agent ${taskId}] Step ${step.stepNumber} failed (attempt ${step.retryCount}): ${errorMsg}`);

          if (step.retryCount > MAX_RETRIES) {
            step.status = 'failed';
            step.error = errorMsg;
            step.completedAt = new Date().toISOString();
            broadcast(taskId, { type: 'step_failed', taskId, data: { step, error: errorMsg }, timestamp: new Date().toISOString() });
            // Continue to next step despite failure
            completedStepOutputs.push({ description: step.description, toolOutput: `Failed: ${errorMsg}` });
            stepCompleted = true;
          } else {
            step.status = 'retrying';
            step.error = errorMsg;
            // FEEDBACK: Pass the exact error back to the LLM via previousObservations
            previousObservations += `\n[Attempt ${step.retryCount} Failed] Tool Error: ${errorMsg}. Adjust your next JSON input to fix this error.`;
            
            broadcast(taskId, { type: 'step_started', taskId, data: { ...step, retryInfo: `Retry ${step.retryCount}/${MAX_RETRIES}` }, timestamp: new Date().toISOString() });
            await new Promise(r => setTimeout(r, 1000 * step.retryCount)); // exponential backoff
          }
        }
      }
    }

    // ── Phase 3: Final Response ────────────────────────────────────
    const finalResponse = await generateFinalResponse(userInput, completedStepOutputs);
    task.finalResponse = finalResponse;
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    tasks.set(taskId, task);

    broadcast(taskId, { type: 'task_completed', taskId, data: { task, finalResponse }, timestamp: new Date().toISOString() });
    console.log(`[Agent ${taskId}] Task completed: "${finalResponse}"`);

    return taskId;

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    task.status = 'failed';
    task.completedAt = new Date().toISOString();
    tasks.set(taskId, task);
    broadcast(taskId, { type: 'task_failed', taskId, data: { error: errorMsg }, timestamp: new Date().toISOString() });
    console.error(`[Agent ${taskId}] Fatal error: ${errorMsg}`);
    return taskId;
  }
}
