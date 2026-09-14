'use client';

import type {
  AssessmentRecord,
  InvitationRecord,
  ResponseRecord,
  ResponseRole,
} from '@/types/assessment';
import type { ProfessionalBriefRecord } from '@/types/professional';
import { isTestModeEnabled, mockAnswers, requireTestMode, type TestPreset } from '@/lib/test-mode';
import { currentUserId, supabaseAuth } from '@/lib/supabase-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const isCloudPersistenceEnabled = Boolean(supabaseUrl && supabaseKey) && !isTestModeEnabled;

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
  const { data: { session } } = await supabaseAuth?.auth.getSession() ?? { data: { session: null } };
  const requestHeaders = new Headers({ apikey: supabaseKey ?? '', Authorization: `Bearer ${session?.access_token ?? supabaseKey ?? ''}`, 'Content-Type': 'application/json' });
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
    student_status: 'not_started',
    parent_status: 'not_started',
    basic_info_status: 'not_started',
    guidance_status: 'not_ready',
    is_test: isTestModeEnabled,
  };
  if (isCloudPersistenceEnabled) {
    const userId = await currentUserId();
    if (!userId) throw new Error('Authentication required');
    const existing = await rest<AssessmentRecord[]>(
      `assessments?student_user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    );
    if (existing[0]) return existing[0];
    const [created] = await rest<AssessmentRecord[]>('assessments', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ ...record, student_user_id: userId }),
    });
    await getOrCreateInvitation(created.id);
    return created;
  }
  const database = readLocal();
  database.assessments.push(record);
  writeLocal(database);
  await getOrCreateInvitation(record.id);
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
      ? { status: 'awaiting_observer', self_completed_at: completedAt, student_status: 'completed' }
      : { status: 'complete', observer_completed_at: completedAt, parent_status: 'completed' };
  if (isCloudPersistenceEnabled) {
    if (role === 'observer') {
      await rest<void>('rpc/set_parent_assessment_status', { method: 'POST', body: JSON.stringify({ next_status: 'completed' }) });
      return;
    }
    await rest<void>(`assessments?id=eq.${encodeURIComponent(assessmentId)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
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

export async function markAssessmentStarted(assessmentId: string, role: ResponseRole) {
  const field = role === 'self' ? 'student_status' : 'parent_status';
  const patch = { [field]: 'in_progress' };
  if (isCloudPersistenceEnabled) {
    if (role === 'observer') {
      await rest<void>('rpc/set_parent_assessment_status', { method: 'POST', body: JSON.stringify({ next_status: 'in_progress' }) });
      return;
    }
    await rest<void>(`assessments?id=eq.${encodeURIComponent(assessmentId)}`, { method: 'PATCH', body: JSON.stringify(patch) });
    return;
  }
  const database = readLocal();
  const record = database.assessments.find((item) => item.id === assessmentId);
  if (record && record[field] !== 'completed') Object.assign(record, patch);
  writeLocal(database);
}

export async function seedTestSession(preset: TestPreset, state: 'student' | 'parent' | 'both') {
  requireTestMode();
  const assessment = await createAssessment({ studentAlias: `测试学生 · ${preset}`, grade: '高二' });
  const database = readLocal();
  const storedAssessment = database.assessments.find((item) => item.id === assessment.id);
  const includeSelf = state === 'student' || state === 'both';
  const includeParent = state === 'parent' || state === 'both';
  for (const [role, include] of [['self', includeSelf], ['observer', includeParent]] as const) {
    if (!include) continue;
    for (const answer of mockAnswers(preset, role)) {
      database.responses.push({ id: crypto.randomUUID(), assessment_id: assessment.id, role, ...answer, created_at: new Date().toISOString() });
    }
    Object.assign(storedAssessment ?? assessment, role === 'self'
      ? { student_status: 'completed', self_completed_at: new Date().toISOString(), status: includeParent ? 'complete' : 'awaiting_observer' }
      : { parent_status: 'completed', observer_completed_at: new Date().toISOString(), status: includeSelf ? 'complete' : 'self_in_progress' });
  }
  writeLocal(database);
  return assessment;
}

export type DevelopmentSessionState =
  | 'student_not_started'
  | 'student_in_progress'
  | 'student_completed'
  | 'parent_not_started'
  | 'parent_in_progress'
  | 'parent_completed'
  | 'both_completed'
  | 'basic_info_completed'
  | 'counselor_case_ready';

export async function setDevelopmentSessionState(
  assessmentId: string,
  state: DevelopmentSessionState,
): Promise<AssessmentRecord> {
  requireTestMode();
  const database = readLocal();
  const assessment = database.assessments.find((item) => item.id === assessmentId);
  if (!assessment?.is_test) throw new Error('Development state can only change a test session.');

  const completedStudent = !['student_not_started', 'student_in_progress'].includes(state);
  const completedParent = ['parent_completed', 'both_completed', 'basic_info_completed', 'counselor_case_ready'].includes(state);
  const studentInProgress = state === 'student_in_progress';
  const parentInProgress = state === 'parent_in_progress';
  const now = new Date().toISOString();

  database.responses = database.responses.filter((response) => response.assessment_id !== assessmentId);
  for (const [role, shouldPopulate] of [['self', completedStudent], ['observer', completedParent]] as const) {
    if (!shouldPopulate) continue;
    for (const answer of mockAnswers(role === 'self' ? 'studentHigher' : 'parentHigher', role)) {
      database.responses.push({ id: crypto.randomUUID(), assessment_id: assessmentId, role, ...answer, created_at: now });
    }
  }
  Object.assign(assessment, {
    student_status: completedStudent ? 'completed' : studentInProgress ? 'in_progress' : 'not_started',
    parent_status: completedParent ? 'completed' : parentInProgress ? 'in_progress' : 'not_started',
    basic_info_status: ['basic_info_completed', 'counselor_case_ready'].includes(state) ? 'completed' : 'not_started',
    guidance_status: state === 'counselor_case_ready' ? 'ready_for_counselor' : 'not_ready',
    self_completed_at: completedStudent ? now : null,
    observer_completed_at: completedParent ? now : null,
    status: completedParent ? 'complete' : completedStudent ? 'awaiting_observer' : 'self_in_progress',
  });
  writeLocal(database);
  return assessment;
}

export function resetTestData() {
  requireTestMode();
  const database = readLocal();
  const testIds = new Set(database.assessments.filter((item) => item.is_test).map((item) => item.id));
  writeLocal({
    assessments: database.assessments.filter((item) => !testIds.has(item.id)),
    responses: database.responses.filter((item) => !testIds.has(item.assessment_id)),
    invitations: database.invitations.filter((item) => !testIds.has(item.assessment_id)),
    briefs: database.briefs.filter((item) => !testIds.has(item.assessment_id)),
  });
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

export async function claimParentInvitation(code: string): Promise<string> {
  if (!isCloudPersistenceEnabled) {
    const invitation = await getInvitationByCode(code);
    if (!invitation) throw new Error('Invitation not found');
    return invitation.assessment_id;
  }
  const result = await rest<string | string[]>('rpc/claim_parent_invitation', {
    method: 'POST',
    body: JSON.stringify({ invite_code: code }),
  });
  const assessmentId = Array.isArray(result) ? result[0] : result;
  if (!assessmentId) throw new Error('Invitation could not be claimed');
  return assessmentId;
}

export async function updateInvitationRelationship(
  assessmentId: string,
  relationship: string,
): Promise<void> {
  if (isCloudPersistenceEnabled) {
    const userId = await currentUserId();
    const assessment = await getAssessment(assessmentId);
    if (assessment?.parent_user_id === userId) {
      await rest<void>('rpc/set_parent_relationship', {
        method: 'POST',
        body: JSON.stringify({ next_relationship: relationship }),
      });
      return;
    }
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
