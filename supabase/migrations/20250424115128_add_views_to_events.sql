-- viewsカラムを追加
ALTER TABLE events
ADD COLUMN views integer NOT NULL DEFAULT 0;

-- 既存のレコードのviewsを0に設定
UPDATE events SET views = 0 WHERE views IS NULL;
