# 保育士イベントアイディア - Childcare Event Ideas

Next.js（TypeScript）で構築された保育士向けのイベントアイディア管理アプリケーションです。月ごとのイベントアイディアを登録・管理できます。

## 主な機能

- ユーザー認証（ログイン画面）
- 月別のイベントアイディア表示
- イベントの詳細表示
- 新規イベントの追加
- イベントの削除

## 技術スタック

- **フレームワーク**: Next.js 13+ (App Router)
- **言語**: TypeScript
- **データベース**: Supabase
- **認証**: Supabase Authentication (Basic認証)
- **スタイリング**: CSS Modules

## インストール方法

1. リポジトリをクローンする:

```bash
git clone https://github.com/yourusername/childcare-event-ideas.git
cd childcare-event-ideas
```

2. 依存関係をインストールする:

```bash
npm install
```

3. 環境変数を設定する:
   - `.env.local.example` ファイルを `.env.local` にコピーし、Supabaseの認証情報を入力します。

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. アプリケーションを起動する:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてアプリケーションを確認できます。

## データベースのセットアップ

Supabaseでデータベースをセットアップする方法については、`docs/supabase-setup.md` を参照してください。

## デザイン仕様

このアプリケーションは独自のデジタルエステティックを持っています：

- **カラースキーム**:
  - ベース: #FFFFFF（白）
  - テキスト: #000000（黒）
  - アクセントカラー: #FF0000（赤）、#0000FF（青）、#FFFF00（黄色）

- **タイポグラフィ**:
  - フォント: Courier New（モノスペース）
  - 太い黒線による境界線と区切り
  - カスタムX型マウスカーソル

- **レイアウト**:
  - グリッドベースのレイアウト
  - 非対称な要素配置
  - ホバー時のトランジション効果
  - スクロールスナップ効果

## ライセンス

このプロジェクトは [MITライセンス](LICENSE) の下で公開されています。
