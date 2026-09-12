'use client';

/* oxlint-disable jsx-a11y/label-has-associated-control -- Base UI inputs are nested inside their visible labels. */

import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type SyntheticEvent, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAssessment, isCloudPersistenceEnabled } from '@/lib/storage';

export default function StartAssessmentPage() {
  const router = useRouter();
  const [studentAlias, setStudentAlias] = useState('');
  const [grade, setGrade] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const assessment = await createAssessment({ studentAlias, grade });
      router.push(`/assessment/run#${encodeURIComponent(assessment.id)}`);
    } catch {
      setError('暂时没能建立你的画像，请稍后再试。');
      setBusy(false);
    }
  }

  return (
    <main className="soft-page">
      <SiteHeader quiet />
      <section className="start-card">
        <span className="eyebrow">在开始之前</span>
        <h1>这幅画像，可以先用一个你喜欢的称呼开始。</h1>
        <p>称呼和年级都可以留空。我们不需要你的真实姓名、学校、生日或联系方式。</p>
        <form onSubmit={start} className="start-form">
          <label><span>我们怎么称呼你？ <i>选填</i></span><Input value={studentAlias} maxLength={30} placeholder="例如：小雨" onChange={(e) => setStudentAlias(e.target.value)} /></label>
          <label><span>你现在的年级 <i>选填</i></span><Input value={grade} maxLength={20} placeholder="例如：高二" onChange={(e) => setGrade(e.target.value)} /></label>
          {error && <p className="inline-error" role="alert">{error}</p>}
          <Button size="lg" className="primary-button" disabled={busy} type="submit">{busy ? '正在准备…' : '进入第一个部分'} <ArrowRight /></Button>
        </form>
        <div className="storage-note"><LockKeyhole /><span>{isCloudPersistenceEnabled ? '回答会安全保存，刷新后可继续。' : '当前为本机私测模式，回答会保存在这台设备上。'}</span></div>
      </section>
    </main>
  );
}
