import type { CSSProperties } from 'react';
import { lineColors, lineNames, type LineId } from '../data/network';
import { useLanguage } from '../i18n/LanguageContext';

type Props = { line: LineId };

const lineNamesEn: Record<string, string> = {
  'east-nile': 'East Nile Line',
  'west-nile': 'West Nile Line',
};

export default function LineBadge({ line }: Props) {
  const { lang } = useLanguage();
  const color = lineColors[line];
  const name = lang === 'en' ? lineNamesEn[line] || lineNames[line] : lineNames[line];

  return (
    <span className="line-badge" style={{ '--line-color': color } as CSSProperties}>
      <span className="line-dot" />
      {name}
    </span>
  );
}
