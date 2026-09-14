'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Cloud, HardDrive } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { assessmentItems } from '@/data/assessment';
import { responseLabels, sections } from '@/data/dimensions';
import {
  completeAssessmentRole,
  getResponses,
  isCloudPersistenceEnabled,
  markAssessmentStarted,
  saveResponse,
  saveAssessmentReport,
} from '@/lib/storage';
import { navigateTo } from '@/lib/navigation';
import { scoreProfile } from '@/lib/scoring';
import type { ResponseRole } from '@/types/assessment';

const transition = { duration: 0.25, ease: 'easeOut' as const };

export function AssessmentRunner({
  assessmentId,
  perspective,
}: {
  assessmentId: string;
  perspective: ResponseRole;
}) {
  const progressKey = `strength-portrait-progress:${assessmentId}:${perspective}`;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());

  const currentItem = assessmentItems[index];
  const currentSection = useMemo(
    () =>
      [...sections]
        .reverse()
        .find((section) => index >= section.startIndex) ?? sections[0],
    [index],
  );
  const labels = responseLabels[perspective];

  useEffect(() => {
    void markAssessmentStarted(assessmentId, perspective);
    let active = true;
    getResponses(assessmentId, perspective)
      .then((records) => {
        if (!active) return;
        const restored = Object.fromEntries(
          records.map((record) => [record.item_id, record.score]),
        );
        const storedIndex = Number(localStorage.getItem(progressKey));
        const firstMissing = assessmentItems.findIndex((item) => !restored[item.id]);
        const nextIndex = Number.isFinite(storedIndex)
          ? Math.min(Math.max(storedIndex, 0), 71)
          : firstMissing >= 0
            ? firstMissing
            : 71;
        setAnswers(restored);
        setIndex(nextIndex);
        setShowIntro(sections.some((section) => section.startIndex === nextIndex));
      })
      .catch(() => setError('暂时没能读取你已有的回答，请刷新重试。'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [assessmentId, perspective, progressKey]);

  useEffect(() => {
    if (!loading) localStorage.setItem(progressKey, String(index));
  }, [index, loading, progressKey]);

  const choose = useCallback(
    async (score: number) => {
      if (saving || showIntro) return;
      setSaving(true);
      setError('');
      setAnswers((current) => ({ ...current, [currentItem.id]: score }));
      try {
        await saveResponse({
          assessment_id: assessmentId,
          role: perspective,
          item_id: currentItem.id,
          score,
          item_started_at: startedAt,
          item_answered_at: new Date().toISOString(),
        });
        await new Promise((resolve) => setTimeout(resolve, 190));
        if (index === assessmentItems.length - 1) {
          await saveAssessmentReport(
            assessmentId,
            perspective,
            scoreProfile({ ...answers, [currentItem.id]: score }),
          );
          await completeAssessmentRole(assessmentId, perspective);
          localStorage.removeItem(progressKey);
          const observerQuery = perspective === 'observer' ? '?from=observer' : '';
          navigateTo(`/results${observerQuery}#${encodeURIComponent(assessmentId)}`);
          return;
        }
        const nextIndex = index + 1;
        setStartedAt(new Date().toISOString());
        setIndex(nextIndex);
        setShowIntro(sections.some((section) => section.startIndex === nextIndex));
      } catch {
        setError('这一题还没保存好，再点一次就可以。');
      } finally {
        setSaving(false);
      }
    }, [answers, assessmentId, currentItem, index, perspective, progressKey, saving, showIntro, startedAt],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= '1' && event.key <= '5' && !showIntro) {
        void choose(Number(event.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [choose, showIntro]);

  useEffect(() => {
    const modelContext = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              title: string;
              description: string;
              inputSchema: object;
              annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
              execute: (input: unknown) => Promise<object>;
            },
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!modelContext?.registerTool || showIntro || loading) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: 'answer_current_assessment_item',
          title: '回答当前题目',
          description: '用 1–5 回答当前屏幕上的测评题，并与界面中点击选项执行相同的保存和前进操作。',
          inputSchema: {
            type: 'object',
            properties: {
              score: { type: 'integer', minimum: 1, maximum: 5 },
            },
            required: ['score'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          async execute(input) {
            const score = (input as { score?: unknown })?.score;
            if (!Number.isInteger(score) || Number(score) < 1 || Number(score) > 5) {
              throw new Error('score 必须是 1 到 5 之间的整数');
            }
            const answeredItemId = currentItem.id;
            await choose(Number(score));
            return { itemId: answeredItemId, score: Number(score), saved: true };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [choose, currentItem.id, loading, showIntro]);

  if (loading) {
    return (
      <main className="assessment-shell assessment-loading">
        <span className="breathing-dot" />
        <p>正在找回你的画像进度</p>
      </main>
    );
  }

  return (
    <main className="assessment-shell">
      <header className="assessment-topbar">
        <span>{perspective === 'self' ? '我眼中的自己' : '你眼中的 TA'}</span>
        <span className="save-status">
          {isCloudPersistenceEnabled ? <Cloud /> : <HardDrive />}
          {saving ? '正在保存' : '已保存'}
        </span>
      </header>

      <div className="progress-track" aria-label="测评进度">
        <motion.i
          animate={{ width: `${((index + (showIntro ? 0 : 1)) / 72) * 100}%` }}
          transition={transition}
        />
      </div>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.section
            key={`intro-${currentSection.dimension}`}
            className="section-intro"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={transition}
          >
            <span className="eyebrow">第 {sections.indexOf(currentSection) + 1} 个部分</span>
            <h1>{perspective === 'observer' ? currentSection.title.replace('你', 'TA') : currentSection.title}</h1>
            <p>{currentSection.description.replaceAll('你', perspective === 'observer' ? 'TA' : '你')}</p>
            <Button size="lg" className="primary-button" onClick={() => {
              setStartedAt(new Date().toISOString());
              setShowIntro(false);
            }}>
              继续
            </Button>
          </motion.section>
        ) : (
          <motion.section
            key={currentItem.id}
            className="question-stage"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -7, scale: 0.995 }}
            transition={transition}
          >
            <div className="question-copy">
              <span className="question-section">{currentSection.title}</span>
              <h1>{perspective === 'self' ? currentItem.selfText : currentItem.otherText}</h1>
            </div>

            <div className="answer-grid" role="radiogroup" aria-label="选择符合程度">
              {labels.map((label, optionIndex) => {
                const score = optionIndex + 1;
                const selected = answers[currentItem.id] === score;
                return (
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={selected ? 'answer-option answer-option--selected' : 'answer-option'}
                    key={label}
                    disabled={saving}
                    onClick={() => void choose(score)}
                  >
                    <span>{score}</span>
                    <b>{label}</b>
                  </button>
                );
              })}
            </div>
            {error && <p className="inline-error" role="alert">{error}</p>}
          </motion.section>
        )}
      </AnimatePresence>

      <footer className="assessment-footer">
        <Button
          variant="ghost"
          size="lg"
          disabled={index === 0 || saving}
          onClick={() => {
            setStartedAt(new Date().toISOString());
            setShowIntro(false);
            setIndex((value) => Math.max(0, value - 1));
          }}
        >
          <ArrowLeft />
          上一题
        </Button>
      </footer>
    </main>
  );
}
