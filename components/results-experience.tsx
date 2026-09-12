'use client';

import {
  ArrowRight,
  Check,
  MessageCircleQuestion,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PortraitVisual } from '@/components/portrait-visual';
import { ProfileDetails } from '@/components/profile-details';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { compareProfiles } from '@/lib/comparison';
import { buildExploration } from '@/lib/exploration';
import { appHref, navigateTo } from '@/lib/navigation';
import { completeAnswerMap, scoreProfile } from '@/lib/scoring';
import {
  getAssessment,
  getOrCreateInvitation,
  getResponses,
  isCloudPersistenceEnabled,
} from '@/lib/storage';
import type { AssessmentRecord, InvitationRecord } from '@/types/assessment';

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
  const [invitation, setInvitation] = useState<InvitationRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      getAssessment(assessmentId),
      getResponses(assessmentId, 'self'),
      getResponses(assessmentId, 'observer'),
    ])
      .then(async ([record, self, observer]) => {
        setAssessment(record);
        setSelfAnswers(completeAnswerMap(self));
        setObserverAnswers(completeAnswerMap(observer));
        if (self.length === 72) setInvitation(await getOrCreateInvitation(assessmentId));
      })
      .catch(() => setError('还没能读取这幅画像，请稍后再试。'));
  }, [assessmentId]);

  const selfProfile = useMemo(
    () => (Object.keys(selfAnswers).length === 72 ? scoreProfile(selfAnswers) : null),
    [selfAnswers],
  );
  const observerProfile = useMemo(
    () => (Object.keys(observerAnswers).length === 72 ? scoreProfile(observerAnswers) : null),
    [observerAnswers],
  );
  const comparison = useMemo(
    () => (selfProfile && observerProfile ? compareProfiles(selfProfile, observerProfile) : null),
    [observerProfile, selfProfile],
  );
  const exploration = useMemo(
    () => (selfProfile ? buildExploration(selfProfile) : []),
    [selfProfile],
  );

  async function copyInvitation() {
    if (!invitation) return;
    const link = `${window.location.origin}${appHref(`/observe#${invitation.code}`)}`;
    await navigator.clipboard.writeText(
      `我想邀请你，从你的角度看看我。\n${link}\n邀请码：${invitation.code}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (assessment === undefined) {
    return <main className="assessment-loading"><span className="breathing-dot" /><p>正在把这些线索放在一起</p></main>;
  }
  if (!assessment || error) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">暂时找不到这幅画像</span><h1>{error || '这个链接可能已经失效。'}</h1><Button onClick={() => navigateTo('/')}>回到首页</Button></section></main>;
  }
  if (!selfProfile) {
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
          <span className="eyebrow">Self Portrait</span>
          <h1>这是我眼中的自己。</h1>
          <p>它不是一个类型，也不是对你的定论。它记下了你此刻对自己的理解：哪些事会吸引你，你如何做事，以及什么对你重要。</p>
        </div>
        <PortraitVisual self={selfProfile} />
      </section>

      <details className="details-drawer"><summary>看看画像里更细的线索 <ArrowRight /></summary><ProfileDetails profile={selfProfile} /></details>

      {!observerProfile ? (
        <section className="invitation-card">
          <div><span className="eyebrow">Portrait from Others</span><h2>邀请一个真正熟悉你的人。</h2><p>对方会独立看到同样的 72 个问题。你们不会看到对方的逐题回答。</p></div>
          <div className="invite-code"><span>邀请码</span><b>{invitation?.code ?? '正在生成'}</b></div>
          <Button size="lg" className="primary-button" disabled={!invitation} onClick={() => void copyInvitation()}>{copied ? <Check /> : <Send />}{copied ? '已复制邀请' : '复制邀请链接'}</Button>
          {!isCloudPersistenceEnabled && invitation && (
            <>
              <Button variant="outline" size="lg" onClick={() => navigateTo(`/observe#${encodeURIComponent(invitation.code)}`)}>在本机完成他评</Button>
              <p className="local-mode-warning">本机私测模式下，请在同一浏览器、同一 `localhost` 地址中完成他评。不要改用另一个浏览器、隐私窗口或设备；配置 Supabase 后才可跨设备使用。</p>
            </>
          )}
          <Button variant="ghost" onClick={() => location.reload()}><RefreshCw />看看 TA 是否已完成</Button>
        </section>
      ) : (
        <>
          <section className="portrait-reveal portrait-reveal--other">
            <div className="portrait-reveal__copy"><span className="eyebrow">Portrait from Others</span><h2>这是你眼中的我。</h2><p>这幅画像来自长期相处中真实被看见的部分。它和自我画像一样重要，但并不替代自我画像。</p></div>
            <PortraitVisual self={observerProfile} />
          </section>
          <details className="details-drawer"><summary>看看 TA 眼中更细的线索 <ArrowRight /></summary><ProfileDetails profile={observerProfile} /></details>

          <section className="shared-portrait">
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
      <footer className="results-footer">这是一幅可以随着经验继续变化的画像。</footer>
    </main>
  );
}
