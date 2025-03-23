'use client';

import { useState, useEffect } from 'react';
import EventItem from './EventItem';
import { eventData } from '../lib/data';

export default function MonthGrid() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might fetch this from an API
    setMonths(eventData);
    setLoading(false);
  }, []);

  const getSeasonClass = (month) => {
    // Map months to seasons with different styling
    if ([12, 1, 2].includes(month)) {
      // Winter
      return {
        borderColor: '#00BFFF',
        background: 'linear-gradient(135deg, white 85%, #00BFFF 85%)',
      };
    } else if ([3, 4, 5].includes(month)) {
      // Spring
      return {
        borderColor: '#FF69B4',
        background: 'linear-gradient(135deg, white 85%, #FF69B4 85%)',
      };
    } else if ([6, 7, 8].includes(month)) {
      // Summer
      return {
        borderColor: '#FF8C00',
        background: 'linear-gradient(135deg, white 85%, #FF8C00 85%)',
      };
    } else {
      // Fall
      return {
        borderColor: '#8B4513',
        background: 'linear-gradient(135deg, white 85%, #8B4513 85%)',
      };
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>読み込み中...</h2>
      </div>
    );
  }

  return (
    <div className="grid" style={{ 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      position: 'relative', /* モーダルの配置のための基準点 */
    }}>
      {months.map((month) => {
        const seasonStyle = getSeasonClass(month.month);
        
        return (
          <div 
            key={month.month} 
            className="month-card"
            style={{
              marginBottom: '2rem',
              borderWidth: 'var(--border-width)',
              borderColor: seasonStyle.borderColor,
              background: seasonStyle.background,
              boxShadow: '5px 5px 0 rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}
          >
            <h2 style={{ 
              marginBottom: '1.5rem',
              textAlign: 'center',
              borderBottom: `3px solid var(--color-text)`,
              paddingBottom: '0.5rem',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}>
              {month.name}
            </h2>
            
            <div 
              style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                backgroundColor: 'var(--color-accent-1)',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                border: '2px solid var(--color-text)'
              }}
            >
              {month.month}
            </div>
            
            <ul className="event-list">
              {month.events.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}