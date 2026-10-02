import { useEffect, useMemo, useRef, useState } from 'react';
import { lineColors, lineNames, stations } from '../data/network';
import Icon from './Icon';

type Props = { label: string; value: string; onChange: (stationId: string) => void; accent: string };

/** Searchable dropdown for choosing a station. */
export default function StationPicker({ label, value, onChange, accent }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  // Stations stay in running order (not alphabetical) because that is how riders think of the line.
  const filtered = useMemo(() => stations.filter((s) => s.name.includes(query.trim())), [query]);

  const choose = (stationId: string) => {
    onChange(stationId);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="station-picker" ref={wrapper}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        className={`station-trigger ${open ? 'is-open' : ''}`}
        onClick={() => {
          setQuery('');
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label={`${label}: ${value || 'اختر محطة'}`}
      >
        <span className="station-dot" style={{ borderColor: accent }}>
          <span style={{ background: accent }} />
        </span>
        <span className={value ? '' : 'muted'}>{value || 'اختر محطة'}</span>
        <span className="trigger-chevron">
          <Icon name="chevron" size={17} />
        </span>
      </button>

      {open && (
        <div className="station-dropdown">
          <div className="station-search">
            <Icon name="search" size={18} />
            <input
              autoFocus
              placeholder="ابحث عن محطة..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="ابحث عن محطة"
            />
          </div>
          <div className="station-list">
            {filtered.length ? (
              filtered.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  className={`station-option ${value === station.id ? 'selected' : ''}`}
                  onClick={() => choose(station.id)}
                >
                  <span>{station.name}</span>
                  <span className="option-lines">
                    {station.lines.map((line) => (
                      <i key={line} style={{ background: lineColors[line] }} title={lineNames[line]} />
                    ))}
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-search">لا توجد محطة بهذا الاسم</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
