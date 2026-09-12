'use client';

import { useParams } from 'next/navigation';
import { ResultsExperience } from '@/components/results-experience';

export default function ResultsPage() {
  const params = useParams<{ id: string }>();
  return <ResultsExperience assessmentId={params.id} />;
}
