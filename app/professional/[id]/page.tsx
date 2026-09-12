'use client';

import { useParams } from 'next/navigation';
import { ProfessionalBuilder } from '@/components/professional-builder';

export default function ProfessionalPage() {
  const params = useParams<{ id: string }>();
  return <ProfessionalBuilder assessmentId={params.id} />;
}
