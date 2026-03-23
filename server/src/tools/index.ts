import { ToolDefinition, ToolResult, MemoryState } from '../types';

// ─── Calendar Tool ─────────────────────────────────────────────────
export const calendarTool: ToolDefinition = {
  name: 'calendar',
  description: 'Manages calendar events. Can check availability, find free slots, and create/list meetings.',
  parameters: {
    action: { type: 'string', description: 'One of: check_availability | find_slot | create_event | list_events', required: true },
    date: { type: 'string', description: 'Date for the operation in YYYY-MM-DD format' },
    time: { type: 'string', description: 'Time for the event in HH:MM format' },
    title: { type: 'string', description: 'Title of the event' },
    attendees: { type: 'string', description: 'Comma-separated list of attendee names/emails' },
    duration: { type: 'string', description: 'Duration in minutes (default: 60)' },
  },
  execute: async (params: Record<string, unknown>, memory: MemoryState): Promise<ToolResult> => {
    const action = params.action as string;
    const date = (params.date as string) || new Date().toISOString().split('T')[0];
    const time = params.time as string;
    const title = (params.title as string) || 'Team Meeting';
    const attendees = (params.attendees as string) || 'team';
    const duration = parseInt((params.duration as string) || '60');

    // Simulate realistic calendar logic
    await simulateDelay(800);

    const busySlots = (memory.shortTerm['busy_slots'] as string[]) || ['09:00', '10:00', '14:00', '15:00'];

    switch (action) {
      case 'check_availability': {
        const isBusy = time && busySlots.includes(time);
        if (isBusy) {
          return {
            success: true,
            data: { available: false, conflictAt: time, busySlots },
            summary: `Time slot ${time} on ${date} is BUSY. Conflicts exist at: ${busySlots.join(', ')}`,
          };
        }
        return {
          success: true,
          data: { available: true, time, date },
          summary: `Time slot ${time || 'requested'} on ${date} is AVAILABLE.`,
        };
      }

      case 'find_slot': {
        const allSlots = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        const freeSlots = allSlots.filter(s => !busySlots.includes(s));
        const suggested = freeSlots[0] || '16:00';
        memory.shortTerm['suggested_slot'] = suggested;
        return {
          success: true,
          data: { freeSlots, suggested, date },
          summary: `Found ${freeSlots.length} available slots on ${date}. Best suggestion: ${suggested}`,
        };
      }

      case 'create_event': {
        const finalTime = time || (memory.shortTerm['suggested_slot'] as string) || '16:00';
        const eventId = `EVT-${Date.now()}`;
        const event = { id: eventId, title, date, time: finalTime, attendees, duration };
        memory.shortTerm['created_event'] = event;
        return {
          success: true,
          data: event,
          summary: `✅ Event "${title}" created on ${date} at ${finalTime} for ${duration} minutes with attendees: ${attendees}. Event ID: ${eventId}`,
        };
      }

      case 'list_events': {
        const created = memory.shortTerm['created_event'];
        const events = created ? [created] : [];
        return {
          success: true,
          data: { events, date },
          summary: events.length > 0 ? `Found ${events.length} event(s) on ${date}.` : `No events scheduled for ${date}.`,
        };
      }

      default:
        return { success: false, error: `Unknown action: ${action}`, summary: `Failed: unknown calendar action "${action}"` };
    }
  },
};

// ─── Email Sender Tool ─────────────────────────────────────────────
export const emailSenderTool: ToolDefinition = {
  name: 'email_sender',
  description: 'Sends emails to people about meetings or events.',
  parameters: {
    recipients: { type: 'string', description: 'Comma-separated list of recipient names/emails', required: true },
    subject: { type: 'string', description: 'Subject line of the notification' },
    message: { type: 'string', description: 'Body of the notification message' },
  },
  execute: async (params: Record<string, unknown>, memory: MemoryState): Promise<ToolResult> => {
    await simulateDelay(600);

    const type = (params.type as string) || 'email';
    const recipients = (params.recipients as string) || 'team';
    const event = memory.shortTerm['created_event'] as { title?: string; date?: string; time?: string } | undefined;
    const subject = (params.subject as string) || (event ? `Meeting: ${event.title}` : 'Meeting Notification');
    const message = (params.message as string) || (event
      ? `You have been invited to "${event.title}" on ${event.date} at ${event.time}.`
      : 'Please check your calendar for upcoming meetings.');

    const recipientList = recipients.split(',').map(r => r.trim());
    const results = recipientList.map(r => ({ recipient: r, status: 'delivered', channel: type }));

    memory.shortTerm['notifications_sent'] = results;

    return {
      success: true,
      data: { results, subject, message },
      summary: `✅ EMAIL sent to ${recipientList.length} recipient(s): ${recipientList.join(', ')}. Subject: "${subject}"`,
    };
  },
};

// ─── Search Tool ───────────────────────────────────────────────────
export const searchTool: ToolDefinition = {
  name: 'search',
  description: 'Searches for information, looks up contacts, or retrieves context needed for tasks.',
  parameters: {
    query: { type: 'string', description: 'The search query', required: true },
    type: { type: 'string', description: 'Search type: contacts | web | knowledge', required: false },
  },
  execute: async (params: Record<string, unknown>, _memory: MemoryState): Promise<ToolResult> => {
    await simulateDelay(500);

    const query = params.query as string;
    const type = (params.type as string) || 'web';

    const mockResults: Record<string, unknown[]> = {
      contacts: [
        { name: 'Alice Johnson', email: 'alice@team.com', role: 'Engineering Lead' },
        { name: 'Bob Smith', email: 'bob@team.com', role: 'Product Manager' },
        { name: 'Carol Davis', email: 'carol@team.com', role: 'Designer' },
        { name: 'Dan Lee', email: 'dan@team.com', role: 'Backend Dev' },
      ],
      web: [
        { title: `Results for "${query}"`, snippet: `Found relevant information about ${query}.`, url: 'https://example.com' },
      ],
      knowledge: [
        { topic: query, content: `Internal knowledge base entry for: ${query}`, source: 'Internal Wiki' },
      ],
    };

    const results = mockResults[type] || mockResults['web'];
    return {
      success: true,
      data: { results, query, type },
      summary: `Found ${results.length} result(s) for "${query}" (type: ${type}).`,
    };
  },
};

// ─── Memory Tool ───────────────────────────────────────────────────
export const memoryToolDef: ToolDefinition = {
  name: 'memory',
  description: 'Reads or writes to the agent memory to store and retrieve information across steps.',
  parameters: {
    action: { type: 'string', description: 'read | write | summarize', required: true },
    key: { type: 'string', description: 'Memory key to read or write' },
    value: { type: 'string', description: 'Value to store (for write action)' },
  },
  execute: async (params: Record<string, unknown>, memory: MemoryState): Promise<ToolResult> => {
    await simulateDelay(200);
    const action = params.action as string;
    const key = params.key as string;

    switch (action) {
      case 'write': {
        memory.shortTerm[key] = params.value;
        return { success: true, data: { key, value: params.value }, summary: `Stored "${key}" = "${params.value}" in memory.` };
      }
      case 'read': {
        const val = memory.shortTerm[key];
        return { success: true, data: { key, value: val }, summary: val !== undefined ? `Memory["${key}"] = ${JSON.stringify(val)}` : `Key "${key}" not found in memory.` };
      }
      case 'summarize': {
        const keys = Object.keys(memory.shortTerm);
        const summary = keys.map(k => `${k}: ${JSON.stringify(memory.shortTerm[k])}`).join(' | ');
        return { success: true, data: memory.shortTerm, summary: `Current memory state: ${summary || 'empty'}` };
      }
      default:
        return { success: false, error: `Unknown action: ${action}`, summary: `Memory action "${action}" not recognized.` };
    }
  },
};

// ─── Tool Registry ─────────────────────────────────────────────────
export const toolRegistry: Map<string, ToolDefinition> = new Map([
  ['calendar', calendarTool],
  ['email_sender', emailSenderTool],
  ['search', searchTool],
  ['memory', memoryToolDef],
]);

export function getToolDescriptions(): string {
  const descriptions = Array.from(toolRegistry.values()).map(tool => {
    const params = Object.entries(tool.parameters)
      .map(([k, v]) => `    - ${k} (${v.type}${v.required ? ', required' : ''}): ${v.description}`)
      .join('\n');
    return `Tool: ${tool.name}\nDescription: ${tool.description}\nParameters:\n${params}`;
  });
  return descriptions.join('\n\n');
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
