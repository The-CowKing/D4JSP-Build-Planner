import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DESIGN, RARITY_COLORS } from '../lib/constants';

export default function ItemSearch({ slotType, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const searchItems = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let dbQuery = supabase
          .from('d4_equipment')
          .select('id, name, type, rarity, image_url')
          .ilike('name', `%${query}%`)
          .limit(20);

        // Filter by slot type if relevant
        if (slotType && slotType !== 'OffHand') {
          dbQuery = dbQuery.ilike('type', `%${slotType}%`);
        }

        const { data, error: queryError } = await dbQuery;

        if (queryError) throw queryError;

        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search items. Try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchItems, 300);
    return () => clearTimeout(timer);
  }, [query, slotType]);

  const getRarityColor = (rarity) => {
    const rarityKey = rarity?.toLowerCase() || 'common';
    return RARITY_COLORS[rarityKey] || RARITY_COLORS.common;
  };

  return (
    <div
      style={{
        background: DESIGN.cardGradient,
        border: DESIGN.border,
        borderRadius: '4px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{
          fontFamily: DESIGN.fonts.heading,
          color: DESIGN.gold,
          fontSize: '18px',
          margin: 0,
        }}>
          Find Item
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.color = DESIGN.gold}
          onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
        >
          ×
        </button>
      </div>

      {/* Search Input */}
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by item name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          fontFamily: DESIGN.fonts.body,
          padding: '12px',
          background: 'rgba(0,0,0,0.3)',
          border: DESIGN.border,
          color: '#fff',
          fontSize: '14px',
          borderRadius: '2px',
          marginBottom: '20px',
          outline: 'none',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = DESIGN.gold;
          e.target.style.boxShadow = `0 0 10px rgba(212,175,55,0.2)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = DESIGN.border.split('solid ')[1];
          e.target.style.boxShadow = 'none';
        }}
      />

      {/* Results */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {loading && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            padding: '20px',
            fontFamily: DESIGN.fonts.body,
          }}>
            Searching...
          </div>
        )}

        {error && (
          <div style={{
            color: '#ff6464',
            padding: '12px',
            background: 'rgba(255,100,100,0.1)',
            borderRadius: '2px',
            fontSize: '12px',
            fontFamily: DESIGN.fonts.body,
          }}>
            {error}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.5)',
            padding: '20px',
            fontFamily: DESIGN.fonts.body,
            fontSize: '13px',
          }}>
            No items found. Try a different search.
          </div>
        )}

        {results.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            style={{
              padding: '12px',
              background: `linear-gradient(135deg, ${getRarityColor(item.rarity)}, ${getRarityColor(item.rarity)}11)`,
              border: `1px solid ${getRarityColor(item.rarity)}`,
              borderRadius: '2px',
              color: getRarityColor(item.rarity),
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: DESIGN.fonts.body,
              fontSize: '13px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${getRarityColor(item.rarity)}, ${getRarityColor(item.rarity)}22)`;
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(135deg, ${getRarityColor(item.rarity)}, ${getRarityColor(item.rarity)}11)`;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                {item.name}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.7 }}>
                {item.type} • {item.rarity}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
