type Props = { label: string; value: string | number; unit?: string };

export default function Stat({ label, value, unit }: Props) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>
        {value}
        {unit && <small> {unit}</small>}
      </strong>
    </div>
  );
}
