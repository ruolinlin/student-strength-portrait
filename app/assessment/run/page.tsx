'use client';

export const dynamic = 'force-static';

import { useEffect, useState } from 'react';

import { AssessmentRunner } from '@/components/assessment-runner';
import { SiteHeader } from '@/components/site-header';

export default function AssessmentRunPage() {
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    const readHash = () => setAssessmentId(decodeURIComponent(window.location.hash.slice(1)));
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  if (!assessmentId) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">还没有开始画像</span><h1>请先从首页建立一份新的学生画像。</h1></section></main>;
  }

  return <AssessmentRunner assessmentId={assessmentId} perspective="self" />;
}
