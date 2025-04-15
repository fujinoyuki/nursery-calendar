# Supabase Database Setup Guide

This guide explains how to set up Supabase for the Childcare Event Ideas application.

## Initial Setup

1. Go to [Supabase](https://supabase.com) and create a new account or sign in.
2. Create a new project and give it a name (e.g., "childcare-event-ideas").
3. Take note of the URL and anon key (public API key) from the API settings page.
4. Add these values to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Schema

### Events Table

Create a new table called `events` with the following structure:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a constraint to ensure month is between 1 and 12
ALTER TABLE events ADD CONSTRAINT month_range CHECK (month >= 1 AND month <= 12);
```

### Users Setup

For authentication, Supabase provides built-in user authentication. You can use the Authentication tab in the Supabase dashboard to manage users.

1. Go to Authentication → Settings and make sure Email auth is enabled.
2. To add a test user, go to Authentication → Users and click "Add User".
3. Enter an email and password for your test user.

## Row Level Security (RLS) Policies

Set up Row Level Security to ensure data privacy:

```sql
-- Enable RLS on the events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to select events
CREATE POLICY "Allow users to view all events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to insert their own events
CREATE POLICY "Allow users to insert their own events" ON events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to update their own events
CREATE POLICY "Allow users to update their own events" ON events
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a policy that allows authenticated users to delete their own events
CREATE POLICY "Allow users to delete their own events" ON events
  FOR DELETE USING (auth.role() = 'authenticated');
```

## Sample Data (Optional)

You can insert some sample data into the `events` table:

```sql
INSERT INTO events (month, title, description) VALUES
(1, '雪遊び', '園庭や公園で雪だるま作りや雪合戦を楽しみます。寒さ対策をしっかりと行い、温かい飲み物を用意しておくと良いでしょう。'),
(1, 'お正月あそび', '羽根つき、コマ回し、福笑いなど、日本の伝統的なお正月遊びを体験します。'),
(1, '冬の自然観察', '冬ならではの自然現象（霜、氷など）を観察し、季節の変化を学びます。'),
(4, '花見ピクニック', '近くの公園で桜の花見をしながらピクニックを楽しみます。春の花々についても学びます。'),
(4, '春の虫探し', '春に現れる虫（てんとう虫、蝶など）を探して観察します。虫かごや図鑑を用意しておくと良いでしょう。'),
(4, '植物の栽培開始', 'ひまわりやトマトなど、夏に向けての植物の種まきを行います。成長過程を観察する準備をします。'),
(7, '水遊び', 'プールや水鉄砲、シャボン玉などを使った水遊びを行います。熱中症対策を忘れずに。'),
(7, '七夕まつり', '七夕の由来を学び、笹に願い事を書いた短冊を飾ります。'),
(7, '夏の工作', '貝殻や砂などを使った夏らしい工作を楽しみます。'),
(10, '秋の自然物収集', 'どんぐり、落ち葉、木の実などを集めて工作や装飾に使います。'),
(10, 'ハロウィンパーティー', '仮装や飾り付け、ハロウィンにまつわるゲームを楽しみます。'),
(10, '焼き芋パーティー', '安全に配慮しながら、秋の味覚である焼き芋を楽しみます。'),
(12, 'クリスマス会', 'クリスマスの由来を学び、ツリーの飾り付けやプレゼント交換を行います。'),
(12, '年賀状づくり', '来年の干支について学び、手作りの年賀状を作成します。'),
(12, '冬の工作', '雪の結晶や冬をテーマにした工作を楽しみます。');
```

## Next Steps

1. Connect your frontend application to Supabase using the provided credentials.
2. Test the authentication flow and database operations.
3. Set up storage if you want to add image uploads later.
