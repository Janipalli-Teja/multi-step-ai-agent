import { GoogleGenerativeAI } from '@google/generative-ai';
import { getToolDescriptions } from '../tools';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function planTask(userInput: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an autonomous AI agent planner. 
Your job is to break down a user's high-level task into clear, specific, actionable steps.

Available tools:
${getToolDescriptions()}

User Task: "${userInput}"

Produce a numbered list of steps (3-6 steps max) that the agent should execute to complete this task.
Each step should mention which tool to use.
Return ONLY a JSON array of step description strings. Example:
["Search for team contacts", "Check calendar availability at 3PM", "Create meeting event", "Send email notifications to all attendees"]

JSON array:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[jsonMatch.length - 1]) as string[];
    }
    // Fallback: split by newlines
    return text.split('\n').filter(l => l.trim()).map(l => l.replace(/^\d+\.\s*/, '').trim());
  } catch {
    return [
      'Search for relevant contacts and context',
      'Check calendar availability',
      'Create the required event or task',
      'Send notifications to all relevant parties',
    ];
  }
}

export async function think(
  taskId: string,
  userInput: string,
  currentStep: string,
  previousObservations: string,
): Promise<{ thought: string; toolName: string; actionInput: Record<string, unknown> }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Task: "${userInput}"
Ongoing: "${currentStep}"
Past: ${previousObservations || 'None'}

Tools:
${getToolDescriptions()}

What's NEXT? Respond ONLY as JSON:
{ "thought": "Reasoning", "toolName": "name", "actionInput": { ... } }`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[jsonMatch.length - 1]);
    }
  } catch {
    // fallback
  }

  // Smart fallback based on step keywords
  const stepLower = currentStep.toLowerCase();
  if (stepLower.includes('search') || stepLower.includes('contact') || stepLower.includes('find')) {
    return { thought: `Searching info for: ${currentStep}`, toolName: 'search', actionInput: { query: userInput, type: 'contacts' } };
  } else if (stepLower.includes('availab') || stepLower.includes('calendar') || stepLower.includes('schedule')) {
    return { thought: `Checking calendar for availability`, toolName: 'calendar', actionInput: { action: 'check_availability', date: new Date().toISOString().split('T')[0] } };
  } else if (stepLower.includes('notify') || stepLower.includes('email') || stepLower.includes('send')) {
    return { thought: `Sending email to the team`, toolName: 'email_sender', actionInput: { subject: 'Meeting Update', recipients: 'alice@team.com' } };
  } else if (stepLower.includes('creat') || stepLower.includes('event') || stepLower.includes('book')) {
    return { thought: `Creating the meeting event`, toolName: 'calendar', actionInput: { action: 'create_event', title: 'Team Meeting', date: new Date().toISOString().split('T')[0] } };
  }

  return { thought: `Executing step: ${currentStep}`, toolName: 'memory', actionInput: { action: 'summarize' } };
}

export async function generateFinalResponse(
  userInput: string,
  completedSteps: Array<{ description: string; toolOutput: string }>,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const stepsText = completedSteps.map((s, i) => `Step ${i + 1}: ${s.description}\nResult: ${s.toolOutput}`).join('\n\n');

  const prompt = `Task: "${userInput}"
Results:
${stepsText}

Summarize for the user in < 3 sentences. Be specific and friendly.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
