'use client';

import { ArrowRight, Eye, Layers3, Sparkles } from 'lucide-react';
import { type SyntheticEvent, useState } from 'react';

import { PortraitMark, SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { navigateTo } from '@/lib/navigation';

export default function Home() {
  const [code, setCode] = useState('');

  function openInvitation(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim()) navigateTo(`/observe#${encodeURIComponent(code.trim().toUpperCase())}`);
  }

  return (
    <main className="landing-page">
      <SiteHeader />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Development Strength Portrait</span>
          <h1>看见自己，<br />也看看别人眼中的你。</h1>
          <p>一份关于兴趣、优势、偏好、价值与能力信心的双视角画像。你完成自己的部分，再邀请一个真正熟悉你的人。</p>
          <div className="hero-actions">
            <Button size="lg" className="primary-button hero-primary" onClick={() => navigateTo('/assessment')}>
              开始我的画像 <ArrowRight />
            </Button>
            <form className="invite-entry" onSubmit={openInvitation}>
              <Input aria-label="邀请码" placeholder="输入邀请码" value={code} maxLength={8} onChange={(event) => setCode(event.target.value)} />
              <Button variant="outline" size="lg" type="submit">我受邀来看看 TA</Button>
            </form>
          </div>
          <span className="privacy-note">不需要真实姓名、学校或联系方式</span>
        </div>

        <div className="hero-art" aria-hidden="true">
          <div className="portrait-orbit portrait-orbit--one" />
          <div className="portrait-orbit portrait-orbit--two" />
          <div className="hero-card hero-card--self"><span>我眼中的自己</span><div className="mini-portrait"><i /><i /><i /><i /><i /></div></div>
          <div className="hero-card hero-card--other"><span>TA 眼中的我</span><div className="mini-lines"><i /><i /><i /></div></div>
          <div className="hero-center"><PortraitMark /></div>
          <p>当两个视角放在一起，<br />差异也会变成值得聊一聊的信息。</p>
        </div>
      </section>

      <section className="principles-section" aria-labelledby="how-it-works">
        <span className="eyebrow">两个视角，一次更好的对话</span>
        <h2 id="how-it-works">我们不会给你一个类型。<br />我们希望留下一幅可以继续发展的画像。</h2>
        <div className="principle-grid">
          <article><Eye /><span>01</span><h3>我眼中的我</h3><p>看见哪些事吸引你，你如何做事，什么对你重要。</p></article>
          <article><Sparkles /><span>02</span><h3>TA 眼中的我</h3><p>一个熟悉你的人独立完成同样的问题，只回答 TA 真实看见的你。</p></article>
          <article><Layers3 /><span>03</span><h3>我们一起看见的我</h3><p>把共同看见的特点和不同视角放在一起，形成新的探索问题。</p></article>
        </div>
      </section>

      <footer className="landing-footer"><span>学生发展优势测评 V0.1 · 开源试验版</span><span>发现兴趣，看见优势，理解选择。</span></footer>
    </main>
  );
}
