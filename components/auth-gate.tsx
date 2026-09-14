'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { currentUserId, sendMagicLink } from '@/lib/supabase-auth';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { void currentUserId().then((id) => { setSignedIn(Boolean(id)); setReady(true); }); }, []);
  if (!ready) return <main className="assessment-loading"><span className="breathing-dot" /><p>正在确认登录状态</p></main>;
  if (signedIn) return <>{children}</>;
  async function submit(event: React.SyntheticEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); try { await sendMagicLink(email); setSent(true); } catch (reason) { const message = reason instanceof Error ? reason.message : ''; setError(message.includes('only request') ? '请稍等约一分钟后再请求一次验证码邮件。' : '暂时无法发送邮件，请检查邮箱后重试。'); } finally { setBusy(false); } }
  return <main className="auth-page"><section className="auth-modal"><span className="eyebrow">安全登录</span><h1 id="auth-title">先验证你的邮箱。</h1><p>我们会发送一封登录链接，用于保护你的测评会话与邀请链接。</p><form className="start-form" onSubmit={(event) => void submit(event)}><label htmlFor="auth-email"><span>邮箱</span></label><Input id="auth-email" type="email" value={email} required onChange={(event) => setEmail(event.target.value)} /><Button className="primary-button" type="submit" disabled={busy}>{busy ? '正在发送…' : '发送登录链接'} <ArrowRight /></Button>{sent && <p>邮件已发送。请在同一设备打开邮件中的链接后返回这里。</p>}{error && <p className="inline-error" role="alert">{error}</p>}</form></section></main>;
}
