'use client';

/* oxlint-disable jsx-a11y/label-has-associated-control -- Base UI controls are nested inside their visible labels. */

import { Check, Clipboard, Download, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { compareProfiles } from '@/lib/comparison';
import { buildExploration } from '@/lib/exploration';
import { navigateTo } from '@/lib/navigation';
import {
  buildMarkdown,
  buildProfessionalPrompt,
  buildStructuredExport,
  downloadText,
} from '@/lib/professional-export';
import { completeAnswerMap, scoreProfile } from '@/lib/scoring';
import {
  getAssessment,
  getProfessionalBrief,
  getResponses,
  saveProfessionalBrief,
} from '@/lib/storage';
import {
  emptyProfessionalContext,
  type ProfessionalContext,
  type StructuredExport,
} from '@/types/professional';

const cloneEmptyContext = (): ProfessionalContext =>
  JSON.parse(JSON.stringify(emptyProfessionalContext));

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function ProfessionalBuilder({ assessmentId }: { assessmentId: string }) {
  const [context, setContext] = useState<ProfessionalContext>(cloneEmptyContext);
  const [payload, setPayload] = useState<StructuredExport | null>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      getAssessment(assessmentId),
      getResponses(assessmentId, 'self'),
      getResponses(assessmentId, 'observer'),
      getProfessionalBrief(assessmentId),
    ])
      .then(([assessment, selfRecords, observerRecords, brief]) => {
        if (!assessment || selfRecords.length !== 72) {
          setPayload(null);
          return;
        }
        const selfProfile = scoreProfile(completeAnswerMap(selfRecords));
        const observerProfile =
          observerRecords.length === 72
            ? scoreProfile(completeAnswerMap(observerRecords))
            : null;
        const sharedProfile = observerProfile
          ? compareProfiles(selfProfile, observerProfile)
          : null;
        const nextContext = brief
          ? {
              academic: { ...emptyProfessionalContext.academic, ...brief.academic_context },
              application: {
                ...emptyProfessionalContext.application,
                ...brief.application_context,
              },
              majorExploration: safeJson(
                brief.current_major_thoughts,
                emptyProfessionalContext.majorExploration,
              ),
              experience: brief.experience_context,
              family: brief.family_context,
              counselorObservation: brief.counselor_observations,
              keyQuestion: brief.key_question,
            }
          : {
              ...cloneEmptyContext(),
              academic: {
                ...emptyProfessionalContext.academic,
                grade: assessment.grade ?? '',
              },
            };
        setContext(nextContext);
        setPayload({
          assessmentVersion: assessment.assessment_version,
          selfProfile,
          observerProfile,
          sharedProfile,
          developmentExploration: buildExploration(selfProfile).map(({ score: _, ...field }) => field),
          context: nextContext,
        });
      })
      .catch(() => setPayload(null));
  }, [assessmentId]);

  const structured = useMemo(
    () => (payload ? buildStructuredExport({ ...payload, context }) : null),
    [context, payload],
  );
  const prompt = useMemo(
    () => (structured ? buildProfessionalPrompt(structured) : ''),
    [structured],
  );

  function updateAcademic(key: keyof ProfessionalContext['academic'], value: string) {
    setContext((current) => ({
      ...current,
      academic: { ...current.academic, [key]: value },
    }));
  }

  function updateApplication(key: keyof ProfessionalContext['application'], value: string) {
    setContext((current) => ({
      ...current,
      application: { ...current.application, [key]: value },
    }));
  }

  function updateMajor(key: keyof ProfessionalContext['majorExploration'], value: string) {
    setContext((current) => ({
      ...current,
      majorExploration: { ...current.majorExploration, [key]: value },
    }));
  }

  async function save() {
    setBusy(true);
    setStatus('');
    try {
      await saveProfessionalBrief({
        assessment_id: assessmentId,
        academic_context: context.academic,
        application_context: context.application,
        experience_context: context.experience,
        family_context: context.family,
        current_major_thoughts: JSON.stringify(context.majorExploration),
        counselor_observations: context.counselorObservation,
        key_question: context.keyQuestion,
      });
      setStatus('已保存');
    } catch {
      setStatus('保存失败，请重试');
    } finally {
      setBusy(false);
    }
  }

  if (payload === undefined) {
    return <main className="assessment-loading"><span className="breathing-dot" /><p>正在整理专业解读资料</p></main>;
  }
  if (!payload || !structured) {
    return <main className="soft-page"><SiteHeader quiet /><section className="start-card"><span className="eyebrow">还不能生成资料包</span><h1>请先完成学生自我画像。</h1><Button onClick={() => navigateTo(`/results#${encodeURIComponent(assessmentId)}`)}>回到画像</Button></section></main>;
  }

  return (
    <main className="professional-page">
      <SiteHeader />
      <section className="professional-heading">
        <span className="eyebrow">Professional Brief Builder</span>
        <h1>进一步理解这幅画像。</h1>
        <p>测评结果已经自动放入资料包。请由升学指导老师或生涯教师补充学业、经历与现实背景，再生成可以交给外部 AI 系统的结构化 Prompt。</p>
        <div className="brief-state"><span><Check /> Self Profile</span><span className={payload.observerProfile ? '' : 'muted'}>{payload.observerProfile ? <Check /> : '·'} Portrait from Others</span><span className={payload.sharedProfile ? '' : 'muted'}>{payload.sharedProfile ? <Check /> : '·'} Shared Portrait</span></div>
      </section>

      <div className="brief-layout">
        <div className="brief-form">
          <section className="form-section">
            <div className="form-section__heading"><span>01</span><div><h2>学业基础</h2><p>记录当前的学习环境与可观察学业证据。</p></div></div>
            <div className="field-grid">
              <label><span>年级</span><Input value={context.academic.grade} onChange={(e) => updateAcademic('grade', e.target.value)} /></label>
              <label><span>课程体系</span><Input placeholder="普高 / IB / A-Level / AP…" value={context.academic.curriculum} onChange={(e) => updateAcademic('curriculum', e.target.value)} /></label>
              <label className="wide"><span>主要学科</span><Input value={context.academic.subjects} onChange={(e) => updateAcademic('subjects', e.target.value)} /></label>
              <label><span>成绩区间</span><Input value={context.academic.performanceRange} onChange={(e) => updateAcademic('performanceRange', e.target.value)} /></label>
              <label><span>优势学科</span><Input value={context.academic.strongSubjects} onChange={(e) => updateAcademic('strongSubjects', e.target.value)} /></label>
              <label className="wide"><span>目前较困难的学科</span><Input value={context.academic.difficultSubjects} onChange={(e) => updateAcademic('difficultSubjects', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>02</span><div><h2>升学背景</h2><p>这些条件会影响后续需要检索的大学与课程范围。</p></div></div>
            <div className="field-grid">
              <label><span>目标国家 / 地区</span><Input value={context.application.destinations} onChange={(e) => updateApplication('destinations', e.target.value)} /></label>
              <label><span>申请年份</span><Input value={context.application.applicationYear} onChange={(e) => updateApplication('applicationYear', e.target.value)} /></label>
              <label><span>期望大学层级</span><Input value={context.application.universityLevel} onChange={(e) => updateApplication('universityLevel', e.target.value)} /></label>
              <label><span>已有目标院校</span><Input value={context.application.targetUniversities} onChange={(e) => updateApplication('targetUniversities', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>03</span><div><h2>专业探索</h2><p>将现在的想法当作待验证的假设，而不是已经做好的决定。</p></div></div>
            <div className="field-grid">
              <label className="wide"><span>目前考虑过的专业</span><Textarea value={context.majorExploration.considered} onChange={(e) => updateMajor('considered', e.target.value)} /></label>
              <label className="wide"><span>明确不考虑的专业</span><Textarea value={context.majorExploration.excluded} onChange={(e) => updateMajor('excluded', e.target.value)} /></label>
              <label className="wide"><span>原因</span><Textarea value={context.majorExploration.reasons} onChange={(e) => updateMajor('reasons', e.target.value)} /></label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>04</span><div><h2>重要经历</h2><p>可以包括项目、活动、竞赛、社团、研究、实习、志愿经历或作品。</p></div></div>
            <Textarea className="large-textarea" placeholder="尽量写下具体发生过的事情和学生在其中的行动。" value={context.experience} onChange={(e) => setContext({ ...context, experience: e.target.value })} />
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>05</span><div><h2>家庭与现实考虑</h2><p>学生与家长的期待、地域、预算、就业考虑及其他现实限制。</p></div></div>
            <Textarea className="large-textarea" value={context.family} onChange={(e) => setContext({ ...context, family: e.target.value })} />
          </section>

          <section className="form-section">
            <div className="form-section__heading"><span>06</span><div><h2>指导老师观察</h2><p>写下测评之外，只有在真实相处中才能看见的背景。</p></div></div>
            <Textarea className="large-textarea" value={context.counselorObservation} onChange={(e) => setContext({ ...context, counselorObservation: e.target.value })} />
          </section>

          <section className="form-section key-question-section">
            <div className="form-section__heading"><span>07</span><div><h2>关键问题</h2><p>这个问题将决定后续专业解读应该把注意力放在哪里。</p></div></div>
            <label><span>作为升学指导老师 / 生涯教师，你现在最希望进一步理解这个学生的什么？</span><Textarea className="large-textarea" value={context.keyQuestion} onChange={(e) => setContext({ ...context, keyQuestion: e.target.value })} /></label>
          </section>

          <div className="save-row"><Button size="lg" variant="outline" onClick={() => void save()} disabled={busy}><Save />{busy ? '正在保存' : '保存背景信息'}</Button>{status && <span>{status}</span>}</div>
        </div>

        <aside className="export-panel">
          <span className="eyebrow">结构化导出</span>
          <h2>专业解读资料包</h2>
          <p>系统会把画像、视角差异、探索方向和你补充的背景放进一个稳定结构。</p>
          <Button size="lg" className="primary-button" onClick={async () => { await navigator.clipboard.writeText(prompt); setStatus('专业 Prompt 已复制'); }}><Clipboard />复制 Professional Prompt</Button>
          <Button size="lg" variant="outline" onClick={() => downloadText('student-strength-portrait-brief.md', buildMarkdown(structured), 'text/markdown;charset=utf-8')}><Download />下载 Markdown</Button>
          <Button size="lg" variant="outline" onClick={() => downloadText('student-strength-portrait-data.json', JSON.stringify(structured, null, 2), 'application/json;charset=utf-8')}><Download />下载 JSON</Button>
          <div className="export-note"><strong>资料包不会自动决定专业。</strong><span>请将 Prompt 交给具有当前网络检索能力的 AI 系统，并由专业指导者审阅证据与结论。</span></div>
          <details className="prompt-preview"><summary>预览将要复制的 Prompt</summary><pre>{prompt}</pre></details>
          <Button size="lg" variant="outline" onClick={() => navigateTo(`/results#${encodeURIComponent(assessmentId)}`)}>返回测评结果，逐项对照解读</Button>
        </aside>
      </div>
    </main>
  );
}
