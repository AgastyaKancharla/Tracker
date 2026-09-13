import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface TaskContext {
  id: string;
  title: string;
  workspace: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
}

interface ClientContext {
  id: string;
  name: string;
  company: string;
}

interface VoiceCommandDraft {
  action: 'add' | 'edit' | 'delete' | 'complete' | 'uncomplete' | 'query' | 'unclear';
  taskId?: string;
  title?: string;
  description?: string;
  workspace?: 'personal' | 'business' | 'client';
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: string | null;
  dueTime?: string | null;
  isEvent?: boolean;
  clientName?: string;
  missingFields: string[];
  summary: string;
  clarification?: string;
  answer?: string;
  relevantTaskIds?: string[];
}

function buildSystemPrompt(
  todayIso: string,
  weekdayName: string,
  tasks: TaskContext[],
  clients: ClientContext[]
) {
  return `You turn a spoken command about a personal/business task tracker into a single JSON object describing what to do. Reply with ONLY the JSON object, no markdown fences, no commentary.

Today's date is ${todayIso} (YYYY-MM-DD), a ${weekdayName}. Resolve relative dates ("tomorrow", "next Friday", "in 3 days", "this week", "next week") against this date. Treat "this week" as the 7-day span starting today's Monday through Sunday.

Existing tasks (for resolving "the dentist task", "mark X done", "delete Y", answering questions, etc.) — an id, title, workspace, status, priority, and optional dueDate/dueTime for each:
${JSON.stringify(tasks)}

Existing clients (for workspace "client" tasks):
${JSON.stringify(clients)}

Output schema (all fields optional except "action", "missingFields", "summary"):
{
  "action": "add" | "edit" | "delete" | "complete" | "uncomplete" | "query" | "unclear",
  "taskId": string,            // REQUIRED for edit/delete/complete/uncomplete - the id of the matched existing task
  "title": string,
  "description": string,
  "workspace": "personal" | "business" | "client",
  "priority": "urgent" | "high" | "medium" | "low",
  "dueDate": "YYYY-MM-DD" | null,
  "dueTime": "HH:MM" | null,   // 24-hour
  "isEvent": boolean,
  "clientName": string,
  "missingFields": string[],   // field names still needed to make this a complete task, e.g. ["dueTime","priority"]
  "summary": string,           // one short human-readable sentence recapping the parsed action, for the user to review
  "clarification": string,     // ONLY if action is "unclear" or a task reference is ambiguous (multiple candidates) - a short question to ask the user
  "answer": string,            // ONLY for action "query" - your natural-language answer to their question, 2-4 sentences, spoken-friendly
  "relevantTaskIds": string[]  // ONLY for action "query" - ids of tasks you referenced in the answer
}

Rules:
- Use action "query" when the speaker is ASKING about their tasks rather than asking you to change anything - e.g. "what do I have today", "what's urgent this week", "how many client tasks are open", "when is my dentist appointment". Answer strictly from the tasks list provided above - never invent a task that isn't in that list. If nothing matches, say so plainly in "answer" (e.g. "You have nothing scheduled today."). Do not set missingFields/summary for query (leave missingFields empty and summary can restate the question briefly).
- For "add": title is essential. If the speaker didn't give a clear title, action must be "unclear" with a clarification asking for it.
- For "edit"/"delete"/"complete"/"uncomplete": you must resolve to exactly one taskId from the existing tasks list by title/description similarity. If none match confidently or more than one plausibly matches, set action to "unclear" and put the ambiguity in "clarification" (list the candidate titles).
- Only include fields the speaker actually specified or that you confidently inferred; leave everything else absent (not empty string) rather than guessing.
- workspace defaults are not assumed - infer from context (e.g. mentions of a client name -> "client"; work-sounding tasks -> "business"; personal errands -> "personal") but if truly unclear, add "workspace" to missingFields instead of guessing.
- priority: infer "urgent"/"high" from words like "urgent", "asap", "important"; default reasoning only, otherwise add "priority" to missingFields.
- Always return valid JSON matching the schema above, nothing else.`;
}

function buildMergePrompt(previousDraft: VoiceCommandDraft) {
  return `The user is adding more detail by voice to fill in or correct a task draft already in progress. Here is the current draft (JSON):
${JSON.stringify(previousDraft)}

Merge the new spoken text into this draft: update only the fields the new speech actually addresses (including correcting a field they explicitly changed), keep all other existing fields as they are, and recompute "missingFields" and "summary" for the merged result. Reply with ONLY the updated JSON object in the same schema.`;
}

export async function POST(request: NextRequest) {
  try {
    return await handleVoiceCommand(request);
  } catch (err) {
    // Last-resort safety net: an uncaught throw here would otherwise reach
    // the client as an empty response body, which fails client-side
    // `res.json()` with a confusing "Unexpected end of JSON input" error
    // instead of a readable message.
    const message = err instanceof Error ? err.message : 'Unexpected error handling the voice command.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleVoiceCommand(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Voice command parsing is not configured.' }, { status: 500 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  let body: {
    transcript?: string;
    tasks?: TaskContext[];
    clients?: ClientContext[];
    previousDraft?: VoiceCommandDraft;
    todayLocal?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const transcript = (body.transcript || '').trim();
  if (!transcript) {
    return NextResponse.json({ error: 'No speech transcript provided.' }, { status: 400 });
  }

  const tasks = Array.isArray(body.tasks) ? body.tasks.slice(0, 200) : [];
  const clients = Array.isArray(body.clients) ? body.clients.slice(0, 100) : [];
  // Use the browser's local date, not the server's (which runs in UTC on
  // Vercel) - otherwise "today"/"this week" resolve to the wrong day during
  // the hours the server's UTC date and the user's local date disagree.
  const isValidIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(body.todayLocal || '');
  const todayIso = isValidIsoDate ? (body.todayLocal as string) : new Date().toISOString().split('T')[0];
  const weekdayName = new Date(`${todayIso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });

  const messages = [
    { role: 'system', content: buildSystemPrompt(todayIso, weekdayName, tasks, clients) },
    ...(body.previousDraft
      ? [{ role: 'system', content: buildMergePrompt(body.previousDraft) }]
      : []),
    { role: 'user', content: transcript },
  ];

  let groqRes: Response;
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // llama-3.3-70b-versatile was deprecated/decommissioned by Groq on
        // 2026-08-16. gpt-oss-20b is OpenAI's open-weight model, still on
        // Groq's free tier.
        model: 'openai/gpt-oss-20b',
        messages,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
  } catch {
    return NextResponse.json({ error: 'Could not reach the voice parsing service.' }, { status: 502 });
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text().catch(() => '');
    return NextResponse.json(
      { error: `Voice parsing service error: ${groqRes.status} ${errText}`.slice(0, 500) },
      { status: 502 }
    );
  }

  let data: any;
  try {
    data = await groqRes.json();
  } catch {
    return NextResponse.json({ error: 'Malformed response from voice parsing service.' }, { status: 502 });
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: 'Empty response from voice parsing service.' }, { status: 502 });
  }

  let draft: VoiceCommandDraft;
  try {
    draft = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: 'Could not parse the voice command result.' }, { status: 502 });
  }

  return NextResponse.json({ draft });
}
