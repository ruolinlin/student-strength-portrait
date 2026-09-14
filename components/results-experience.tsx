'use client';

import {
  ArrowRight,
  Check,
  MessageCircleQuestion,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PortraitVisual } from '@/components/portrait-visual';
import { ProfileDetails } from '@/components/profile-details';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { compareProfiles } from '@/lib/comparison';
import { buildExploration } from '@/lib/exploration';
import { navigateTo } from '@/lib/navigation';
import { completeAnswerMap, scoreProfile } from '@/lib/scoring';
import {
  getAssessment,
  getAssessmentReport,
  getResponses,
} from '@/lib/storage';
import type { AssessmentRecord } from '@/types/assessment';

function DiscoveryList({
  entries,
  empty,
}: {
  entries: Array<{ key: string; displayLabel: string }>;
  empty: string;
}) {
  if (!entries.length) return <p className="empty-discovery">{empty}</p>;
  return <div className="discovery-tags">{entries.slice(0, 8).map((entry) => <span key={entry.key}>{entry.displayLabel}</span>)}</div>;
}

export function ResultsExperience({ assessmentId }: { assessmentId: string }) {
  const searchParams = useSearchParams();
  const fromObserver = searchParams.get('from') === 'observer';
  const [assessment, setAssessment] = useState<AssessmentRecord | null>();
  const [selfAnswers, setSelfAnswers] = useState<Record<string, number>>({});
  const [observerAnswers, setObserverAnswers] = useState<Record<string, number>>({});
  const [selfReport, setSelfReport] = useState<ReturnType<typeof scoreProfile> | null>(null);
  const [observerReport, setObserverReport] = useState<ReturnType<typeof scoreProfile> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getAssessment(assessmentId),
      getResponses(assessmentId, 'self'),
      getResponses(assessmentId, 'observer'),
      getAssessmentReport(assessmentId, 'self'),
      getAssessmentReport(assessmentId, 'observer'),
    ])
      .then(async ([record, self, observer, savedSelfReport, savedObserverReport]) => {
        setAssessment(record);
        setSelfAnswers(completeAnswerMap(self));
        setObserverAnswers(completeAnswerMap(observer));
        setSelfReport(savedSelfReport?.profile ?? null);
        setObserverReport(savedObserverReport?.profile ?? null);
      })
      .catch(() => setError('还没能读取这幅画像，请稍后再试。'));
  }, [assessmentId]);

  const selfProfile = useMemo(
    () => selfReport ?? (Object.keys(selfAnswers).length === 72 ? scoreProfile(selfAnswers) : null),
    [selfAnswers, selfReport],
  );
  const observerProfile = useMemo(
    () => observerReport ?? (Object.keys(observerAnswers).length === 72 ? scoreProfile(observerAnswers) : null),
    [observerAnswers, observerReport],
  );
  const comparison = useMemo(
    () => (selfProfile && observerProfile ? compareProfiles(selfProfile, observerProfile) : null),
    [observerProfile, selfProfile],
  );
  const exploration = useMemo(
    () => (selfProfile ? buildExploration(selfProfile) : []),
    [selfProfile],
  );

  if (assessment === undefined) {
    return <main className="assessment-loading"><span className="breathing-dot" /><p>正在把这些线索放在一起</p></main>;
  }
  if (!assessment || error) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">暂时找不到这幅画像</span><h1>{error || '这个链接可能已经失效。'}</h1><Button onClick={() => navigateTo('/')}>回到首页</Button></section></main>;
  }
  const primaryProfile = fromObserver ? observerProfile : selfProfile;
  if (!primaryProfile) {
    return (
      <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">画像还没完成</span><h1>你已经留下了 {Object.keys(selfAnswers).length} 个回答。可以从上次的位置继续。</h1><Button className="primary-button" onClick={() => navigateTo(`/assessment/run#${encodeURIComponent(assessmentId)}`)}>继续完成 <ArrowRight /></Button></section></main>
    );
  }

  return (
    <main className="results-page">
      <SiteHeader />
      {fromObserver && <div className="observer-finished"><Check />谢谢你认真看完了 TA。下面是两个视角放在一起后的画像。</div>}

      <section className="portrait-reveal">
        <div className="portrait-reveal__copy">
          <span className="eyebrow">{fromObserver ? 'Parent Portrait' : 'Self Portrait'}</span>
          <h1>{fromObserver ? '这是你观察到的 TA。' : '这是我眼中的自己。'}</h1>
          <p>{fromObserver ? '这不是对 TA 的定论，而是你此刻基于长期观察形成的一幅画像：哪些事情会吸引 TA，TA 通常如何做事，以及什么对 TA 更重要。' : '它不是一个类型，也不是对你的定论。它记下了你此刻对自己的理解：哪些事会吸引你，你如何做事，以及什么对你重要。'}</p>
        </div>
        <PortraitVisual self={primaryProfile} />
      </section>

      <details className="details-drawer"><summary>看看画像里更细的线索 <ArrowRight /></summary><ProfileDetails profile={primaryProfile} /></details>

      {!observerProfile || !selfProfile ? (
        <section className="results-status-card results-status-card--pending">
          <span className="eyebrow">家长测评</span>
          <h2>{assessment.parent_status === 'in_progress' ? '家长正在填写。' : '家长测评尚未完成。'}</h2>
          <p>{assessment.parent_status === 'in_progress' ? '完成后，双视角发展优势对比会在这里准备好。' : '家长入口已在本次测评页面，可从那里查看状态并邀请家长完成。'}</p>
          <Button variant="outline" onClick={() => navigateTo(`/session#${assessment.id}`)}>查看测评状态 <ArrowRight /></Button>
        </section>
      ) : (
        <>
          <section className="results-status-card results-status-card--complete">
            <span className="eyebrow">已完成</span>
            <h2>你的发展优势报告和双视角报告已经准备好了。</h2>
            <p>上方是你的发展优势报告；继续向下，即可查看你和家长的双视角对比。</p>
            <div className="results-status-card__actions">
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>查看我的发展优势报告 <ArrowRight /></Button>
              <Button className="primary-button" onClick={() => document.getElementById('dual-perspective-report')?.scrollIntoView({ behavior: 'smooth' })}>查看双视角报告 <ArrowRight /></Button>
            </div>
          </section>
          {!fromObserver && <section className="portrait-reveal portrait-reveal--other">
            <div className="portrait-reveal__copy"><span className="eyebrow">Portrait from Others</span><h2>这是你观察到的 TA。</h2><p>这不是对 TA 的定论，而是你此刻基于长期观察形成的一幅画像：哪些事情会吸引 TA，TA 通常如何做事，以及什么对 TA 更重要。</p></div>
            <PortraitVisual self={observerProfile} />
          </section>}
          {!fromObserver && <details className="details-drawer"><summary>看看 TA 眼中更细的线索 <ArrowRight /></summary><ProfileDetails profile={observerProfile} /></details>}

          <section className="shared-portrait" id="dual-perspective-report">
            <div className="shared-heading"><span className="eyebrow">What we see together</span><h2>我们一起看见的你。</h2><p>这不是一次“答对了多少”的比较。同样的地方让我们看见稳定的线索，不同的地方让我们有机会问出更好的问题。</p></div>
            <PortraitVisual self={selfProfile} observer={observerProfile} />
            <div className="discovery-grid">
              <article className="discovery-card discovery-card--shared"><span>01</span><h3>我们都看见的我</h3><p>有些特点，你自己知道，而 TA 也一直看得见。</p><DiscoveryList entries={comparison?.sharedHigh ?? []} empty="还没有特别集中的共同高分，这不代表你们不了解彼此。" /></article>
              <article className="discovery-card"><span>02</span><h3>TA 看见，而我没那么注意到的我</h3><p>TA 似乎比你更容易注意到这一面。</p><DiscoveryList entries={comparison?.observerHigher ?? []} empty="目前没有达到明显差异阈值的线索。" /><div className="conversation-prompt"><MessageCircleQuestion /><span>TA 是在什么时候看见你的这一面的？</span></div></article>
              <article className="discovery-card"><span>03</span><h3>我知道，但 TA 还没完全看见的我</h3><p>有些东西可能更多发生在你的内心，或者还没有很多机会表现出来。</p><DiscoveryList entries={comparison?.selfHigher ?? []} empty="目前没有达到明显差异阈值的线索。" /></article>
            </div>
          </section>
        </>
      )}

      <section className="exploration-section">
        <span className="eyebrow">Development exploration</span>
        <h2>带着这幅画像，<br />看看有哪些方向值得进一步探索。</h2>
        <p>这些不是专业推荐。它们只是把画像中的多条线索放到一起，提供几个可以用真实经历去验证的假设。</p>
        <div className="exploration-list">{exploration.map((field, index) => <article key={field.id}><span>0{index + 1}</span><div><i>{field.level}</i><h3>{field.title}</h3><p>{field.description}</p><div className="field-signals">相关线索：{field.signals.join('、')}</div><div className="field-action">可以这样试试：{field.action}</div></div></article>)}</div>
      </section>

      <section className="professional-bridge">
        <div><span className="eyebrow">进一步理解这幅画像</span><h2>把测评线索与学业、经历和现实条件放在一起。</h2><p>真正的升学与生涯选择，还需要结合学业、经历、家庭考虑和不断变化的专业与职业世界。</p></div>
        <Button size="lg" className="primary-button" onClick={() => navigateTo(`/professional#${encodeURIComponent(assessmentId)}`)}>生成专业解读资料包 <ArrowRight /></Button>
      </section>
    </main>
  );
}
