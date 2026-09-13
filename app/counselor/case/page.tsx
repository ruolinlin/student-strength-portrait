'use client';

export const dynamic = 'force-static';

import { useEffect, useState } from 'react';

import { CounselorCase } from '@/components/counselor-case';
import { SiteHeader } from '@/components/site-header';

export default function CounselorCasePage() {
  const [assessmentId, setAssessmentId] = useState('');
  useEffect(() => {
    const read = () => setAssessmentId(decodeURIComponent(window.location.hash.slice(1)));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return assessmentId ? <CounselorCase assessmentId={assessmentId} /> : <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">辅导案例</span><h1>请从测试会话或案例链接打开。</h1></section></main>;
}
