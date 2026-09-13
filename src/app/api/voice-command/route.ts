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
  action: 'add' | 'edit' | 'delete' | 'complete' | 'uncomplete' | 'unclear';
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
}

function buildSystemPrompt(todayIso: string, tasks: TaskContext[], clients: ClientContext[]) {
  return `You turn a spoken command about a personal/business task tracker into a single JSON object describing what to do. Reply with ONLY the JSON object, no markdown fences, no commentary.

Today's date is ${todayIso} (YYYY-MM-DD). Resolve relative dates ("tomorrow", "next Friday", "in 3 days") against this date.

Existing tasks (for resolving "the dentist task", "mark X done", "delete Y", etc.) — an id, title, workspace, status, priority, and optional dueDate/dueTime for each:
${JSON.stringify(tasks)}

Existing clients (for workspace "client" tasks):
${JSON.stringify(clients)}

Output schema (all fields optional except "action", "missingFields", "summary"):
{
  "action": "add" | "edit" | "delete" | "complete" | "uncomplete" | "unclear",
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
  "clarification": string      // ONLY if action is "unclear" or a task reference is ambiguous (multiple candidates) - a short question to ask the user
}

Rules:
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
  const todayIso = new Date().toISOString().split('T')[0];

  const messages = [
    { role: 'system', content: buildSystemPrompt(todayIso, tasks, clients) },
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
        model: 'llama-3.3-70b-versatile',
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

  const data = await groqRes.json();
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
