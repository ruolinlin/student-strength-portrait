'use client';

import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { navigateTo } from '@/lib/navigation';
import { getAssessment } from '@/lib/storage';
import type { AssessmentRecord } from '@/types/assessment';

const stateLabel = (value?: string) => ({ not_started: '未开始', in_progress: '进行中', completed: '已完成', not_ready: '未开始', ready_for_counselor: '已就绪', in_review: '整理中', released: '已发布' }[value ?? 'not_started'] ?? '未开始');

function StateRow({ label, value }: { label: string; value?: string }) {
  const complete = value === 'completed' || value === 'ready_for_counselor' || value === 'released';
  return <div className="case-state-row"><span>{label}</span><b className={complete ? 'is-complete' : value === 'in_progress' || value === 'in_review' ? 'is-progress' : ''}>{complete && <Check />}{stateLabel(value)}</b></div>;
}

export function CounselorCase({ assessmentId }: { assessmentId: string }) {
  const [assessment, setAssessment] = useState<AssessmentRecord | null>();
  useEffect(() => { void getAssessment(assessmentId).then(setAssessment); }, [assessmentId]);

  if (assessment === undefined) return <main className="assessment-loading"><span className="breathing-dot" /><p>正在整理辅导案例</p></main>;
  if (!assessment) return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">未找到案例</span><h1>请检查案例链接。</h1></section></main>;
  const comparisonReady = assessment.student_status === 'completed' && assessment.parent_status === 'completed';

  return <main className="soft-page counselor-page"><SiteHeader quiet />
    <section className="counselor-case" aria-labelledby="case-title">
      <span className="eyebrow">Counselor Case · Development Preview</span>
      <h1 id="case-title">{assessment.student_alias || '学生'}的辅导案例</h1>
      <p>这里汇集同一份测评会话的状态与后续指导材料，仅对已授权指导师和学生主动提交的案例开放。</p>
      <div className="case-status-grid">
        <section><h2>测评进度</h2><StateRow label="学生测评" value={assessment.student_status} /><StateRow label="家长测评" value={assessment.parent_status} /><StateRow label="学生基础信息" value={assessment.basic_info_status} /></section>
        <section><h2>指导准备</h2><StateRow label="双视角对比" value={comparisonReady ? 'completed' : 'not_ready'} /><StateRow label="指导流程" value={assessment.guidance_status} /><p className="case-note">{comparisonReady ? '两个测评视角已经齐备，可开始对照解读。' : '等待双方完成后，双视角对比将自动可用。'}</p></section>
      </div>
      <div className="case-actions">
        <Button variant="outline" onClick={() => navigateTo(`/student/session#${assessment.id}`)}>查看学生会话 <ArrowRight /></Button>
        {comparisonReady ? <Button className="primary-button" onClick={() => navigateTo(`/results#${assessment.id}`)}>查看双视角报告 <ArrowRight /></Button> : <span className="case-locked"><LockKeyhole />双视角报告尚未解锁</span>}
        <Button variant="outline" onClick={() => navigateTo(`/professional#${assessment.id}`)}>打开辅导资料包 <ArrowRight /></Button>
      </div>
    </section>
  </main>;
}
