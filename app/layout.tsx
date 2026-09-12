import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '学生发展优势测评',
  description: '一份关于兴趣、优势、偏好、价值与能力信心的双视角发展画像。',
  openGraph: {
    title: '学生发展优势测评',
    description: '看见自己，也看看别人眼中的你。',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '学生发展优势测评',
    description: '看见自己，也看看别人眼中的你。',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
