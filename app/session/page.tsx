'use client';

import { useEffect, useState } from 'react';
import { SessionStatus } from '@/components/session-status';

export const dynamic = 'force-static';

export default function SessionPage() {
  const [id, setId] = useState('');
  const [showDeveloperTools, setShowDeveloperTools] = useState(false);
  useEffect(() => {
    const read = () => {
      setId(decodeURIComponent(window.location.hash.slice(1)));
      setShowDeveloperTools(new URLSearchParams(window.location.search).get('dev') === 'true');
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return id ? <SessionStatus assessmentId={id} showDeveloperTools={showDeveloperTools} /> : <main className="soft-page"><section className="start-card"><h1>请先创建一份测评。</h1></section></main>;
}
