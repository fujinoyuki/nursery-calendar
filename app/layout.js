import './globals.css';

export const metadata = {
  title: '保育士イベントカレンダー',
  description: '保育士のための季節別イベントアイデア',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}