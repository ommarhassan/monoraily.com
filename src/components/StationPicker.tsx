import { useEffect, useMemo, useRef, useState } from 'react';
import { lineColors, lineNames, stations } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';

const stationTranslations: Record<string, string> = {
  'الاستاد': 'Stadium',
  'هشام بركات': 'Hisham Barakat',
  'نوري خطاب': 'Nouri Khattab',
  'جامعة الأزهر': 'Al-Azhar University',
  'الحي السابع': '7th District',
  'ذاكر حسين': 'Zaker Hussein',
  'أحمد الزمر': 'Ahmed El-Zomor',
  'الحي العاشر': '10th District',
  'زهراء مدينة نصر': 'Zahraa Nasr City',
  'الطريق الدائري': 'Ring Road',
  'المشير طنطاوي': 'El Mushir Tantawi',
  'أرض المعارض': 'Exhibition Center',
  'استاد القاهرة': 'Cairo Stadium',
  'سيتي سنتر': 'City Centre',
  'مستشفى التجمع': 'Tagamoa Hospital',
  'نادي القاهرة الجديدة': 'New Cairo Club',
  'مساجد': 'Mosques',
  'الحي الحكومي': 'Government District',
  'مدينة الفنون والثقافة': 'Arts & Culture City',
  'مركز المؤتمرات': 'Conference Center',
  'مدينة العدالة': 'Justice City',
  'العاصمة الإدارية': 'Administrative Capital',
  'التجمع الخامس': '5th Settlement',
  'اللوتس': 'El Lotus',
  'الجامعة الأمريكية': 'AUC',
  'بيت الوطن': 'Beit El Watan',
  'المحطة المركزية': 'Central Station',
  'النرجس': 'El Narges',
  'الياسمين': 'El Yasmine',
  'الشويفات': 'Choueifat',
  'سفنكس': 'Sphinx',
  'وادي النيل': 'Wadi El Nil',
  'جامعة الدول': 'Gam’at El Dewal',
};

export function getStationName(name: string, lang: string): string {
  if (lang === 'en' && stationTranslations[name]) {
    return stationTranslations[name];
  }
  return name;
}

type Props = { label: string; value: string; onChange: (stationId: string) => void; accent: string };

/** Searchable dropdown for choosing a station. */
export default function StationPicker({ label, value, onChange, accent }: Props) {
  const { lang } = useLanguage();
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

  // Filter stations based on Arabic name or English translation query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => {
      const enName = getStationName(s.name, 'en').toLowerCase();
      const arName = s.name.toLowerCase();
      return arName.includes(q) || enName.includes(q);
    });
  }, [query]);

  const choose = (stationId: string) => {
    onChange(stationId);
    setOpen(false);
    setQuery('');
  };

  const selectedStation = stations.find((s) => s.id === value || s.name === value);
  const displaySelected = selectedStation
    ? getStationName(selectedStation.name, lang)
    : value
    ? getStationName(value, lang)
    : lang === 'en'
    ? 'Select a station'
    : 'اختر محطة';

  const placeholderText = lang === 'en' ? 'Search for a station...' : 'ابحث عن محطة...';
  const emptyText = lang === 'en' ? 'No station found with this name' : 'لا توجد محطة بهذا الاسم';

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
        aria-label={`${label}: ${displaySelected}`}
      >
        <span className="station-dot" style={{ borderColor: accent }}>
          <span style={{ background: accent }} />
        </span>
        <span className={value ? '' : 'muted'}>{displaySelected}</span>
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
              placeholder={placeholderText}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={placeholderText}
            />
          </div>
          <div className="station-list">
            {filtered.length ? (
              filtered.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  className={`station-option ${value === station.id || value === station.name ? 'selected' : ''}`}
                  onClick={() => choose(station.id)}
                >
                  <span>{getStationName(station.name, lang)}</span>
                  <span className="option-lines">
                    {station.lines.map((line) => (
                      <i key={line} style={{ background: lineColors[line] }} title={lineNames[line]} />
                    ))}
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-search">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
