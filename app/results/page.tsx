'use client';

export const dynamic = 'force-static';

import { useEffect, useState } from 'react';

import { ResultsExperience } from '@/components/results-experience';
import { SiteHeader } from '@/components/site-header';

export default function ResultsPage() {
  const [assessmentId, setAssessmentId] = useState('');

  useEffect(() => {
    const readHash = () => setAssessmentId(decodeURIComponent(window.location.hash.slice(1)));
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  if (!assessmentId) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">暂时找不到这幅画像</span><h1>这个结果链接里缺少画像编号。</h1></section></main>;
  }

  return <ResultsExperience assessmentId={assessmentId} />;
}
