import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '保育士イベントアイディア',
  description: '季節ごとの保育士のイベントアイディアを管理するアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
