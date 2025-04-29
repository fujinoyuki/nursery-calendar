-- event-mediaバケットの作成（既に存在する場合はエラーになるため、必要に応じて実行）
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', true);

-- event-mediaバケットへの認証済みユーザーのアクセス権限設定
-- 認証済みユーザーに完全な権限を与える
INSERT INTO storage.policies (name, definition, bucket_id)
VALUES (
  'Authenticated users can upload media',
  '(auth.role() = ''authenticated'')',
  'event-media'
);

-- イベント画像への公開アクセス権限設定
INSERT INTO storage.policies (name, definition, bucket_id, operation)
VALUES (
  'Public access to media files',
  'true',
  'event-media',
  'read'
);

-- 認証済みユーザーが自分自身のフォルダにのみアップロードできるポリシー
INSERT INTO storage.policies (name, definition, bucket_id, operation)
VALUES (
  'Users can only upload to their own folder',
  '((auth.uid())::text = (storage.foldername(name))[1])',
  'event-media',
  'insert'
);

-- 認証済みユーザーが自分自身のフォルダのファイルを削除できるポリシー
INSERT INTO storage.policies (name, definition, bucket_id, operation)
VALUES (
  'Users can only delete from their own folder',
  '((auth.uid())::text = (storage.foldername(name))[1])',
  'event-media',
  'remove'
); 