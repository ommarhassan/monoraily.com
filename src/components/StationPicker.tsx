import { useEffect, useMemo, useRef, useState } from 'react';
import { lineColors, lineNames, stations } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';
import Icon from './Icon';

const stationTranslations: Record<string, string> = {
  // East Nile
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
  'المشير أحمد إسماعيل': 'El Mushir Ahmed Ismail',
  'جيهان السادات': 'Gehan El-Sadat',
  'وان نايتي': 'One Ninety',
  'وان ناينتي': 'One Ninety',
  'وان تاينتي': 'One Ninety',
  'وان تان': 'One Ninety',
  'المستشفى الجوي': 'Air Force Hospital',
  'النرجس': 'El Narges',
  'المستثمرين': 'Investors District',
  'اللوتس': 'El Lotus',
  'جولدن سكوير': 'Golden Square',
  'بيت الوطن': 'Beit El Watan',
  'مسجد الفتاح العليم': 'Al-Fattah Al-Aleem Mosque',
  'الحي R1': 'R1 District',
  'الحي R2': 'R2 District',
  'حي المال والأعمال': 'Financial & Business District',
  'مدينة الفنون والثقافة': 'Arts & Culture City',
  'الحي الحكومي': 'Government District',
  'مسجد مصر': 'Misr Mosque',
  'مدينة العدالة': 'Justice City',
  'أرض المعارض': 'Exhibition Center',
  'استاد القاهرة': 'Cairo Stadium',
  'سيتي سنتر': 'City Centre',
  'مستشفى التجمع': 'Tagamoa Hospital',
  'نادي القاهرة الجديدة': 'New Cairo Club',
  'مساجد': 'Mosques',
  'مركز المؤتمرات': 'Conference Center',
  'التجمع الخامس': '5th Settlement',
  'الجامعة الأمريكية': 'AUC',
  'الشويفات': 'Choueifat',

  // West Nile
  'أكتوبر الجديدة': 'New October',
  'جامعة الأهرام الكندية': 'Ahram Canadian University',
  'السادات': 'Sadat',
  'جامعة 6 أكتوبر': '6th of October University',
  'نقابة المهندسين': 'Engineers Syndicate',
  'مول مصر': 'Mall of Egypt',
  'مدينة الشيخ زايد': 'Sheikh Zayed City',
  'طريق الإسكندرية': 'Alexandria Road',
  'المنصورية': 'Mansouriya',
  'المريوطية': 'Marioutiya',
  'بشتيل': 'Bashtil',
  'وادي النيل': 'Wadi El Nil',

  // Areas
  'مدينة نصر': 'Nasr City',
  'القاهرة الجديدة': 'New Cairo',
  'العاصمة الإدارية': 'New Administrative Capital',
  '6 أكتوبر': '6th of October',
  'الشيخ زايد': 'Sheikh Zayed',

  // Interchanges & Future Lines
  'القطار الكهربائي الخفيف LRT': 'LRT Light Rail',
  'مترو الخط الثالث': 'Metro Line 3',
  'مترو الخط الرابع (مستقبلاً)': 'Metro Line 4 (Future)',
  'مترو الخط الرابع': 'Metro Line 4',
  'مترو الخط السادس (مستقبلاً)': 'Metro Line 6 (Future)',
  'مترو الخط السادس': 'Metro Line 6',
  'القطار الكهربائي السريع (مستقبلاً)': 'High-Speed Rail (Future)',
  'القطار الكهربائي السريع': 'High-Speed Rail',
  'محطة سكك حديد الصعيد': 'Upper Egypt Railway Station',
  'الأتوبيس الترددي BRT': 'BRT Bus Rapid Transit',
  'خط شرق النيل': 'East Nile Line',
  'خط غرب النيل': 'West Nile Line',
};

export function getStationName(name: string, lang: string): string {
  if (lang === 'en' && stationTranslations[name]) {
    return stationTranslations[name];
  }
  return name;
}

type Props = { label: string; value: string; onChange: (stationId: string) => void; accent: string };

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
