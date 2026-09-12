import Link from 'next/link';

export function PortraitMark({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`portrait-mark ${small ? 'h-8 w-8' : 'h-10 w-10'}`}
    >
      <span />
      <span />
      <span />
    </span>
  );
}

export function SiteHeader({ quiet = false }: { quiet?: boolean }) {
  return (
    <header className={`site-header ${quiet ? 'site-header--quiet' : ''}`}>
      <Link href="/" className="brand" aria-label="学生发展优势测评首页">
        <PortraitMark small />
        <span>学生发展优势测评</span>
      </Link>
      {!quiet && <span className="brand-note">Development Strength Portrait</span>}
    </header>
  );
}
