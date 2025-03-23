'use client';

import ModalPortal from './ModalPortal';

export default function EventDetailModal({ event, onClose }) {
  return (
    <ModalPortal onClose={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          position: 'relative',
          backgroundColor: 'var(--color-base)',
          border: '4px solid var(--color-text)',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            fontSize: '2rem',
            fontWeight: 'bold',
            border: 'none',
            background: 'none',
            padding: '0 10px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
        
        <h2 style={{ 
          borderBottom: '4px solid var(--color-accent-1)',
          paddingBottom: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '2rem'
        }}>
          {event.title}
        </h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            backgroundColor: 'var(--color-accent-3)',
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            marginBottom: '0.5rem'
          }}>
            内容
          </h3>
          <p style={{ lineHeight: '1.6' }}>{event.description}</p>
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            backgroundColor: 'var(--color-accent-3)',
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            marginBottom: '0.5rem'
          }}>
            必要な材料
          </h3>
          <p style={{ lineHeight: '1.6' }}>{event.materials}</p>
        </div>
        
        <div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            backgroundColor: 'var(--color-accent-3)',
            display: 'inline-block',
            padding: '0.25rem 0.5rem',
            marginBottom: '0.5rem'
          }}>
            対象年齢
          </h3>
          <p style={{ 
            fontWeight: 'bold', 
            fontSize: '1.2rem',
            border: '3px solid var(--color-text)',
            display: 'inline-block',
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-accent-2)',
            color: 'white'
          }}>
            {event.ageGroup}
          </p>
        </div>
      </div>
    </ModalPortal>
  );
}