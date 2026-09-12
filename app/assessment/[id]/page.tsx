'use client';

import { useParams } from 'next/navigation';
import { AssessmentRunner } from '@/components/assessment-runner';

export default function SelfAssessmentPage() {
  const params = useParams<{ id: string }>();
  return <AssessmentRunner assessmentId={params.id} perspective="self" />;
}
