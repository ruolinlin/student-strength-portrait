'use client';

export const dynamic = 'force-static';

import { useEffect, useState } from 'react';

import { ProfessionalBuilder } from '@/components/professional-builder';
import { SiteHeader } from '@/components/site-header';

export default function ProfessionalPage() {
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    const readHash = () => setAssessmentId(decodeURIComponent(window.location.hash.slice(1)));
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  if (!assessmentId) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">还不能生成资料包</span><h1>这个链接里缺少画像编号。</h1></section></main>;
  }

  return <ProfessionalBuilder assessmentId={assessmentId} />;
}
