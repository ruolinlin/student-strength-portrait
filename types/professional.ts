import type {
  ComparisonProfile,
  ExplorationField,
  PortraitProfile,
} from './portrait';

export interface ProfessionalContext {
  academic: {
    grade: string;
    curriculum: string;
    subjects: string;
    performanceRange: string;
    strongSubjects: string;
    difficultSubjects: string;
  };
  application: {
    destinations: string;
    applicationYear: string;
    universityLevel: string;
    targetUniversities: string;
  };
  majorExploration: {
    considered: string;
    excluded: string;
    reasons: string;
  };
  experience: string;
  family: string;
  counselorObservation: string;
  keyQuestion: string;
}

export interface ProfessionalBriefRecord {
  id?: string;
  assessment_id: string;
  academic_context: ProfessionalContext['academic'];
  application_context: ProfessionalContext['application'];
  experience_context: string;
  family_context: string;
  current_major_thoughts: string;
  counselor_observations: string;
  key_question: string;
  created_at?: string;
  updated_at?: string;
}

export interface StructuredExport {
  assessmentVersion: string;
  selfProfile: PortraitProfile;
  observerProfile: PortraitProfile | null;
  sharedProfile: ComparisonProfile | null;
  developmentExploration: Omit<ExplorationField, 'score'>[];
  context: ProfessionalContext;
}

export const emptyProfessionalContext: ProfessionalContext = {
  academic: {
    grade: '',
    curriculum: '',
    subjects: '',
    performanceRange: '',
    strongSubjects: '',
    difficultSubjects: '',
  },
  application: {
    destinations: '',
    applicationYear: '',
    universityLevel: '',
    targetUniversities: '',
  },
  majorExploration: { considered: '', excluded: '', reasons: '' },
  experience: '',
  family: '',
  counselorObservation: '',
  keyQuestion: '',
};
