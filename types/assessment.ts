export type DimensionKey =
  | 'interest'
  | 'strengths'
  | 'preferences'
  | 'values'
  | 'selfEfficacy';

export type ResponseRole = 'self' | 'observer';
export type PreferencePole = 'left' | 'right';

export interface AssessmentItem {
  id: string;
  dimension: DimensionKey;
  subdimension: string;
  selfText: string;
  otherText: string;
  reverse: boolean;
  preferencePole?: PreferencePole;
  designReason?: string;
  status?: string;
}

export interface AssessmentRecord {
  id: string;
  created_at: string;
  student_alias?: string | null;
  grade?: string | null;
  status: 'self_in_progress' | 'awaiting_observer' | 'complete';
  self_completed_at?: string | null;
  observer_completed_at?: string | null;
  assessment_version: string;
  student_status?: 'not_started' | 'in_progress' | 'completed';
  parent_status?: 'not_started' | 'in_progress' | 'completed';
  basic_info_status?: 'not_started' | 'in_progress' | 'completed';
  guidance_status?: 'not_ready' | 'ready_for_counselor' | 'in_review' | 'released';
  is_test?: boolean;
}

export interface ResponseRecord {
  id?: string;
  assessment_id: string;
  role: ResponseRole;
  item_id: string;
  score: number;
  item_started_at?: string | null;
  item_answered_at?: string | null;
  created_at?: string;
}

export interface InvitationRecord {
  assessment_id: string;
  code: string;
  relationship?: string | null;
  created_at: string;
  completed_at?: string | null;
}
