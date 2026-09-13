'use client';

export const dynamic = 'force-static';

/* oxlint-disable jsx-a11y/label-has-associated-control -- Base UI inputs are nested inside their visible labels. */

import { ArrowRight } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAssessment } from '@/lib/storage';
import { navigateTo } from '@/lib/navigation';

export default function StartAssessmentPage() {
  const [studentAlias, setStudentAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const assessment = await createAssessment({ studentAlias });
      navigateTo(`/session#${encodeURIComponent(assessment.id)}`);
    } catch {
      setError('暂时没能建立你的画像，请稍后再试。');
      setBusy(false);
    }
  }

  return (
    <main className="soft-page welcome-page">
      <SiteHeader quiet />
      <section className="welcome-card">
        <div className="hello-mark" aria-hidden="true"><svg viewBox="0 0 620 210"><defs><linearGradient id="hello-gradient" x1="0" x2="1"><stop stopColor="#79b8e8"/><stop offset=".28" stopColor="#79cfc5"/><stop offset=".55" stopColor="#a99ae8"/><stop offset=".78" stopColor="#e7a7c4"/><stop offset="1" stopColor="#efc982"/></linearGradient></defs><text x="18" y="155" className="hello-stroke">Hello</text></svg></div>
        <p className="welcome-greeting">很高兴在这里遇见你</p>
        <form onSubmit={start} className="welcome-form">
          <label><span>我们怎么称呼你？ <i>选填</i></span><Input value={studentAlias} maxLength={30} onChange={(e) => setStudentAlias(e.target.value)} /></label>
          <p className="welcome-helper">可以填写你喜欢的称呼，也可以直接继续。</p>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <Button size="lg" className="primary-button" disabled={busy} type="submit">{busy ? '正在准备…' : '继续'} <ArrowRight /></Button>
        </form>
      </section>
    </main>
  );
}
