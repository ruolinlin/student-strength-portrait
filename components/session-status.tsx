'use client';

import { ArrowRight, Check, Clipboard, FlaskConical, Link } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getAssessment, getInvitationByAssessment, resetTestData, seedTestSession } from '@/lib/storage';
import { isTestModeEnabled } from '@/lib/test-mode';
import { navigateTo } from '@/lib/navigation';
import type { AssessmentRecord, InvitationRecord } from '@/types/assessment';

type Status = 'not_started' | 'in_progress' | 'completed';

const statusCopy: Record<Status, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
};

function statusOf(value?: string): Status {
  return value === 'in_progress' || value === 'completed' ? value : 'not_started';
}

export function SessionStatus({ assessmentId, showDeveloperTools = false }: { assessmentId: string; showDeveloperTools?: boolean }) {
  const [assessment, setAssessment] = useState<AssessmentRecord | null>();
  const [invitation, setInvitation] = useState<InvitationRecord | null>();
  const [message, setMessage] = useState('');
  const refresh = useCallback(() => Promise.all([getAssessment(assessmentId), getInvitationByAssessment(assessmentId)])
    .then(([nextAssessment, nextInvitation]) => { setAssessment(nextAssessment); setInvitation(nextInvitation); }), [assessmentId]);

  useEffect(() => { void refresh(); }, [refresh]);

  if (assessment === undefined) return <main className="assessment-loading"><span className="breathing-dot" /><p>正在准备测评会话</p></main>;
  if (!assessment) return <main className="soft-page"><section className="start-card"><h1>未找到这份测评。</h1><Button onClick={() => navigateTo('/')}>回到首页</Button></section></main>;

  const studentStatus = statusOf(assessment.student_status);
  const parentStatus = statusOf(assessment.parent_status);
  const bothDone = studentStatus === 'completed' && parentStatus === 'completed';
  const observerUrl = invitation ? `${window.location.origin}${window.location.pathname.replace(/\/session\/?$/, '/observe/')}#${invitation.code}` : '';
  const copy = async (value: string, confirmation: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setMessage(confirmation);
  };
  const seed = async (state: 'student' | 'parent' | 'both') => {
    const next = await seedTestSession(state === 'both' ? 'mixed' : state === 'student' ? 'studentHigher' : 'parentHigher', state);
    navigateTo(`/session?dev=true#${next.id}`);
  };

  return (
    <main className="soft-page session-page">
      <section className="session-shell" aria-labelledby="session-title">
        <header className="session-heading">
          <h1 id="session-title">本次测评</h1>
          <p>你和家长可以分别完成测评，不需要等待对方。</p>
        </header>

        <section className="session-card session-card--student" aria-labelledby="student-status-title">
          <div className="session-card__heading"><div><h2 id="student-status-title">我的测评</h2><span className={`status-pill status-pill--${studentStatus}`}>{studentStatus === 'completed' && <Check />}{statusCopy[studentStatus]}</span></div></div>
          {studentStatus === 'completed' ? <>
            <p>已完成 <Check aria-label="已完成" /></p>
            <Button className="primary-button" onClick={() => navigateTo(`/results#${assessment.id}`)}>查看我的发展优势报告 <ArrowRight /></Button>
          </> : <>
            <p>{studentStatus === 'in_progress' ? '你可以从上次停下的地方继续。' : '从这里开始，慢慢认识你的发展优势。'}</p>
            <Button className="primary-button" onClick={() => navigateTo(`/assessment/run#${assessment.id}`)}>{studentStatus === 'in_progress' ? '继续测评' : '开始测评'} <ArrowRight /></Button>
          </>}
        </section>

        <section className="session-card session-card--parent" aria-labelledby="parent-status-title">
          <div className="session-card__heading"><div><h2 id="parent-status-title">家长测评</h2><span className={`status-pill status-pill--${parentStatus}`}>{parentStatus === 'completed' && <Check />}{statusCopy[parentStatus]}</span></div></div>
          {parentStatus === 'not_started' && <>
            <p>邀请家长从 TA 的视角了解你的发展优势。</p>
            <div className="invitation-code"><span>邀请码</span><b>{invitation?.code ?? '正在生成'}</b></div>
            <div className="session-card__actions">
              <Button variant="outline" onClick={() => void copy(observerUrl, '邀请链接已复制')}><Link />复制邀请链接</Button>
              <Button variant="outline" onClick={() => void copy(invitation?.code ?? '', '邀请码已复制')}><Clipboard />复制邀请码</Button>
            </div>
          </>}
          {parentStatus === 'in_progress' && <p>家长正在填写</p>}
          {parentStatus === 'completed' && <p>已完成 <Check aria-label="已完成" /></p>}
        </section>

        <section className={`session-card session-card--comparison${bothDone ? ' session-card--ready' : ' session-card--locked'}`} aria-labelledby="comparison-title">
          <div className="session-card__heading"><div><h2 id="comparison-title">双视角发展优势对比</h2></div></div>
          {bothDone ? <><p>你和家长的两个视角已经准备好了。</p><Button className="primary-button" onClick={() => navigateTo(`/results#${assessment.id}`)}>查看双视角对比 <ArrowRight /></Button></> : <><p>双方完成后即可查看。</p><span className="comparison-lock" aria-disabled="true">等待双方完成</span></>}
        </section>

        {message && <output className="session-message">{message}</output>}
      </section>

      {isTestModeEnabled && showDeveloperTools && <details className="details-drawer session-developer-tools">
        <summary><FlaskConical />开发测试工具</summary>
        <p>仅在本机测试链接中显示；测试数据不会连接或写入 Supabase。</p>
        <div className="hero-actions"><Button onClick={() => void seed('student')}>模拟学生完成</Button><Button onClick={() => void seed('parent')}>模拟家长完成</Button><Button onClick={() => void seed('both')}>模拟双方完成</Button><Button variant="destructive" onClick={() => { resetTestData(); setMessage('测试数据已重置'); }}>重置测试数据</Button></div>
      </details>}
    </main>
  );
}
