'use client';

import type {
  AssessmentRecord,
  InvitationRecord,
  ResponseRecord,
  ResponseRole,
} from '@/types/assessment';
import type { ProfessionalBriefRecord } from '@/types/professional';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isCloudPersistenceEnabled = Boolean(supabaseUrl && supabaseKey);

const headers = {
  apikey: supabaseKey ?? '',
  Authorization: `Bearer ${supabaseKey ?? ''}`,
  'Content-Type': 'application/json',
};

interface LocalDatabase {
  assessments: AssessmentRecord[];
  responses: ResponseRecord[];
  invitations: InvitationRecord[];
  briefs: ProfessionalBriefRecord[];
}

const LOCAL_KEY = 'strength-portrait-v02';

function readLocal(): LocalDatabase {
  if (typeof window === 'undefined') {
    return { assessments: [], responses: [], invitations: [], briefs: [] };
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}');
    return {
      assessments: parsed.assessments ?? [],
      responses: parsed.responses ?? [],
      invitations: parsed.invitations ?? [],
      briefs: parsed.briefs ?? [],
    };
  } catch {
    return { assessments: [], responses: [], invitations: [], briefs: [] };
  }
}

function writeLocal(database: LocalDatabase) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(database));
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const requestHeaders = new Headers(headers);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => requestHeaders.set(key, value));
  }
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: requestHeaders,
  });
  if (!response.ok) {
    throw new Error(`Persistence request failed (${response.status})`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function createAssessment(input: {
  studentAlias?: string;
  grade?: string;
}): Promise<AssessmentRecord> {
  const record: AssessmentRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    student_alias: input.studentAlias || null,
    grade: input.grade || null,
    status: 'self_in_progress',
    assessment_version: '0.2',
  };
  if (isCloudPersistenceEnabled) {
    const [created] = await rest<AssessmentRecord[]>('assessments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(record),
    });
    return created;
  }
  const database = readLocal();
  database.assessments.push(record);
  writeLocal(database);
  return record;
}

export async function getAssessment(id: string): Promise<AssessmentRecord | null> {
  if (isCloudPersistenceEnabled) {
    const records = await rest<AssessmentRecord[]>(
      `assessments?id=eq.${encodeURIComponent(id)}&limit=1`,
    );
    return records[0] ?? null;
  }
  return readLocal().assessments.find((record) => record.id === id) ?? null;
}

export async function saveResponse(
  response: Omit<ResponseRecord, 'id' | 'created_at'>,
): Promise<void> {
  const record = { ...response, created_at: new Date().toISOString() };
  if (isCloudPersistenceEnabled) {
    await rest<void>('responses?on_conflict=assessment_id,role,item_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(record),
    });
    return;
  }
  const database = readLocal();
  const index = database.responses.findIndex(
    (item) =>
      item.assessment_id === response.assessment_id &&
      item.role === response.role &&
      item.item_id === response.item_id,
  );
  if (index >= 0) database.responses[index] = { ...database.responses[index], ...record };
  else database.responses.push(record);
  writeLocal(database);
}

export async function getResponses(
  assessmentId: string,
  role: ResponseRole,
): Promise<ResponseRecord[]> {
  if (isCloudPersistenceEnabled) {
    return rest<ResponseRecord[]>(
      `responses?assessment_id=eq.${encodeURIComponent(assessmentId)}&role=eq.${role}&order=item_id.asc`,
    );
  }
  return readLocal().responses.filter(
    (response) => response.assessment_id === assessmentId && response.role === role,
  );
}

export async function completeAssessmentRole(
  assessmentId: string,
  role: ResponseRole,
): Promise<void> {
  const completedAt = new Date().toISOString();
  const patch =
    role === 'self'
      ? { status: 'awaiting_observer', self_completed_at: completedAt }
      : { status: 'complete', observer_completed_at: completedAt };
  if (isCloudPersistenceEnabled) {
    await rest<void>(`assessments?id=eq.${encodeURIComponent(assessmentId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    if (role === 'observer') {
      await rest<void>(`invitations?assessment_id=eq.${encodeURIComponent(assessmentId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ completed_at: completedAt }),
      });
    }
    return;
  }
  const database = readLocal();
  const assessment = database.assessments.find((item) => item.id === assessmentId);
  if (assessment) Object.assign(assessment, patch);
  if (role === 'observer') {
    const invitation = database.invitations.find((item) => item.assessment_id === assessmentId);
    if (invitation) invitation.completed_at = completedAt;
  }
  writeLocal(database);
}

function invitationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
}

export async function getOrCreateInvitation(
  assessmentId: string,
): Promise<InvitationRecord> {
  const existing = await getInvitationByAssessment(assessmentId);
  if (existing) return existing;
  const record: InvitationRecord = {
    assessment_id: assessmentId,
    code: invitationCode(),
    created_at: new Date().toISOString(),
  };
  if (isCloudPersistenceEnabled) {
    const [created] = await rest<InvitationRecord[]>('invitations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(record),
    });
    return created;
  }
  const database = readLocal();
  database.invitations.push(record);
  writeLocal(database);
  return record;
}

export async function getInvitationByAssessment(
  assessmentId: string,
): Promise<InvitationRecord | null> {
  if (isCloudPersistenceEnabled) {
    const records = await rest<InvitationRecord[]>(
      `invitations?assessment_id=eq.${encodeURIComponent(assessmentId)}&limit=1`,
    );
    return records[0] ?? null;
  }
  return (
    readLocal().invitations.find((record) => record.assessment_id === assessmentId) ?? null
  );
}

export async function getInvitationByCode(
  code: string,
): Promise<InvitationRecord | null> {
  const normalized = code.trim().toUpperCase();
  if (isCloudPersistenceEnabled) {
    const records = await rest<InvitationRecord[]>(
      `invitations?code=eq.${encodeURIComponent(normalized)}&limit=1`,
    );
    return records[0] ?? null;
  }
  return readLocal().invitations.find((record) => record.code === normalized) ?? null;
}

export async function updateInvitationRelationship(
  assessmentId: string,
  relationship: string,
): Promise<void> {
  if (isCloudPersistenceEnabled) {
    await rest<void>(`invitations?assessment_id=eq.${encodeURIComponent(assessmentId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ relationship: relationship || null }),
    });
    return;
  }
  const database = readLocal();
  const invitation = database.invitations.find((item) => item.assessment_id === assessmentId);
  if (invitation) invitation.relationship = relationship || null;
  writeLocal(database);
}

export async function getProfessionalBrief(
  assessmentId: string,
): Promise<ProfessionalBriefRecord | null> {
  if (isCloudPersistenceEnabled) {
    const records = await rest<ProfessionalBriefRecord[]>(
      `professional_briefs?assessment_id=eq.${encodeURIComponent(assessmentId)}&limit=1`,
    );
    return records[0] ?? null;
  }
  return readLocal().briefs.find((brief) => brief.assessment_id === assessmentId) ?? null;
}

export async function saveProfessionalBrief(
  brief: ProfessionalBriefRecord,
): Promise<void> {
  const now = new Date().toISOString();
  const record = { ...brief, updated_at: now, created_at: brief.created_at ?? now };
  if (isCloudPersistenceEnabled) {
    await rest<void>('professional_briefs?on_conflict=assessment_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(record),
    });
    return;
  }
  const database = readLocal();
  const index = database.briefs.findIndex((item) => item.assessment_id === brief.assessment_id);
  if (index >= 0) database.briefs[index] = record;
  else database.briefs.push(record);
  writeLocal(database);
}
