'use client';

import { useState, useRef, useEffect } from 'react';
import type { Golfer } from '@/lib/types';

const inputStyle = {
  padding: '6px 8px',
  backgroundColor: '#333',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: '4px',
  fontSize: '12px',
  minWidth: '180px',
} as const;

const listStyle = {
  position: 'absolute' as const,
  top: '100%',
  left: 0,
  right: 0,
  marginTop: '2px',
  maxHeight: '200px',
  overflowY: 'auto' as const,
  backgroundColor: '#222',
  border: '1px solid #555',
  borderRadius: '4px',
  zIndex: 100,
  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
};

const itemStyle = {
  padding: '8px 12px',
  cursor: 'pointer' as const,
  fontSize: '12px',
  color: '#fff',
};

export function GolferTypeahead({
  golfers,
  value,
  onChange,
  placeholder = 'Type to search...',
  excludeIds = [],
}: {
  golfers: Golfer[];
  value: string;
  onChange: (golferId: string) => void;
  placeholder?: string;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedGolfer = golfers.find((g) => g.id === value);
  const displayValue = open ? query : (selectedGolfer?.name ?? '');

  const filtered = golfers.filter(
    (g) =>
      !excludeIds.includes(g.id) &&
      g.name.toLowerCase().includes(query.toLowerCase().trim())
  );

  useEffect(() => {
    if (open) setHighlightIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (golferId: string) => {
    onChange(golferId);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter') setOpen(true);
      if ((e.key === 'Backspace' || e.key === 'Delete') && value) {
        e.preventDefault();
        onChange('');
      }
      if (e.key === 'Backspace') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightIndex]) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex].id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          if (selectedGolfer) {
            setQuery(selectedGolfer.name);
            e.target.select();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inputStyle}
      />
      {open && filtered.length > 0 && (
        <ul style={listStyle} role="listbox">
          {filtered.slice(0, 20).map((g, i) => (
            <li
              key={g.id}
              role="option"
              aria-selected={i === highlightIndex}
              style={{
                ...itemStyle,
                backgroundColor: i === highlightIndex ? '#444' : 'transparent',
              }}
              onMouseEnter={() => setHighlightIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(g.id);
              }}
            >
              {g.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
