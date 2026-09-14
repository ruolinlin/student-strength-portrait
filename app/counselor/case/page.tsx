'use client';

export const dynamic = 'force-static';

import { useEffect, useState } from 'react';

import { AuthGate } from '@/components/auth-gate';
import { CounselorCase } from '@/components/counselor-case';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { getCounselorCases, isCloudPersistenceEnabled } from '@/lib/storage';
import { navigateTo } from '@/lib/navigation';

export default function CounselorCasePage() {
  const [assessmentId, setAssessmentId] = useState('');
  useEffect(() => {
    const read = () => setAssessmentId(decodeURIComponent(window.location.hash.slice(1)));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  const page = assessmentId ? <CounselorCase assessmentId={assessmentId} /> : <CounselorDashboard />;
  return isCloudPersistenceEnabled ? <AuthGate>{page}</AuthGate> : page;
}

function CounselorDashboard() {
  const [caseIds, setCaseIds] = useState<string[] | null>(null);
  useEffect(() => { void getCounselorCases().then((cases) => setCaseIds(cases.map((item) => item.assessment_id))).catch(() => setCaseIds([])); }, []);
  return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">指导师案例</span><h1>等待你进入指导的学生。</h1><p>仅已加入指导师白名单且学生主动提交的案例会显示在这里。</p>{caseIds === null ? <p>正在读取案例…</p> : caseIds.length ? <div className="hero-actions">{caseIds.map((id) => <Button key={id} variant="outline" onClick={() => navigateTo(`/counselor/case#${id}`)}>打开案例</Button>)}</div> : <p>目前没有可访问的案例。</p>}</section></main>;
}
