'use client';

import { ArrowRight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AssessmentRunner } from '@/components/assessment-runner';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { getInvitationByCode, getResponses, updateInvitationRelationship } from '@/lib/storage';
import type { InvitationRecord } from '@/types/assessment';

const relationships = ['父亲', '母亲', '祖父母', '其他家人', '老师', '导师', '其他'];

export default function ObserverPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [invitation, setInvitation] = useState<InvitationRecord | null>();
  const [observerCompleted, setObserverCompleted] = useState<boolean | null>(null);
  const [relationship, setRelationship] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    getInvitationByCode(params.code)
      .then(async (record) => {
        setInvitation(record);
        if (!record) {
          setObserverCompleted(false);
          return;
        }
        const responses = await getResponses(record.assessment_id, 'observer');
        setObserverCompleted(responses.length === 72);
      })
      .catch(() => {
        setInvitation(null);
        setObserverCompleted(false);
      });
  }, [params.code]);

  if (invitation === undefined || observerCompleted === null) return <main className="assessment-loading"><span className="breathing-dot" /><p>正在打开邀请</p></main>;
  if (!invitation) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">邀请码没有对应的画像</span><h1>请检查邀请码，或回到完成自评时所用的同一浏览器再试。</h1><p>本机私测模式不会把记录同步到其他浏览器、隐私窗口或设备。</p><Button onClick={() => location.assign('/')}>回到首页</Button></section></main>;
  }
  if (observerCompleted) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">他评已完成</span><h1>这份双视角画像已经准备好了。</h1><p>为避免覆盖已有观察结果，这个邀请码不会再次开启作答。</p><Button className="primary-button" onClick={() => router.push(`/results?from=observer#${encodeURIComponent(invitation.assessment_id)}`)}>查看双视角画像 <ArrowRight /></Button></section></main>;
  }
  if (started) return <AssessmentRunner assessmentId={invitation.assessment_id} perspective="observer" />;

  return (
    <main className="soft-page observer-page">
      <SiteHeader quiet />
      <section className="start-card observer-intro">
        <span className="eyebrow">一份来自熟悉之人的观察</span>
        <h1>TA 邀请你，<br />从你的角度看看 TA。</h1>
        <div className="observer-copy"><p>不是判断 TA。</p><p>也不用猜 TA 会怎么回答。</p><p>只回答你在真实相处中看到的这个人。</p></div>
        <div className="relationship-picker"><span>你与 TA 的关系 <i>选填</i></span><div>{relationships.map((item) => <button type="button" className={relationship === item ? 'selected' : ''} key={item} onClick={() => setRelationship(item)}>{item}</button>)}</div></div>
        <Button size="lg" className="primary-button" onClick={async () => { await updateInvitationRelationship(invitation.assessment_id, relationship); setStarted(true); }}>开始 <ArrowRight /></Button>
      </section>
    </main>
  );
}
