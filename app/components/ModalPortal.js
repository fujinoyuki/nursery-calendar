'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ModalPortal({ children, onClose }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // コンポーネントがマウントされたことを記録
    setMounted(true);
    
    // モーダルを開いたときに背景スクロールを無効化
    document.body.style.overflow = 'hidden';
    
    // ESCキーでモーダルを閉じられるようにする
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    
    // クリーンアップ関数
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // 画面全体のオーバーレイ要素
  const modalOverlay = (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
      }}
      onClick={(e) => {
        // モーダル外のクリックでオーバーレイを閉じる
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );

  // クライアントサイドでレンダリングされる場合のみポータルを作成
  if (!mounted || typeof window === 'undefined') {
    return null;
  }

  // モーダルをdocument.bodyに直接ポータル
  return createPortal(
    modalOverlay,
    document.body
  );
}