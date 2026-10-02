import { lineColors, lineNames, type LineId } from '../data/network';

export default function LineBadge({ line }: { line: LineId }) {
  return (
    <span className="line-badge" style={{ color: lineColors[line], backgroundColor: `${lineColors[line]}18` }}>
      <span style={{ backgroundColor: lineColors[line] }} />
      {lineNames[line]}
    </span>
  );
}
