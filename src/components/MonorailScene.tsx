/**
 * Hero illustration: a monorail gliding along an elevated beam over a skyline.
 * Pure SVG + CSS (see styles/scene.css), so it needs no photo and no external request.
 */
const buildings = [
  { x: 10, w: 46, h: 96 },
  { x: 62, w: 34, h: 140 },
  { x: 102, w: 52, h: 74 },
  { x: 160, w: 38, h: 118 },
  { x: 206, w: 60, h: 90 },
  { x: 274, w: 36, h: 150 },
  { x: 318, w: 48, h: 82 },
  { x: 374, w: 40, h: 126 },
  { x: 422, w: 56, h: 100 },
  { x: 486, w: 36, h: 70 },
  { x: 530, w: 54, h: 112 },
];

const BEAM_Y = 214;
const GROUND_Y = 300;
const CAR_WIDTH = 120;
const CAR_GAP = 5;
const cars = [0, 1, 2];

export default function MonorailScene() {
  return (
    <svg viewBox="0 0 600 300" preserveAspectRatio="xMidYMax slice" role="img" aria-label="مونوريل يعدّي فوق المدينة">
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1432" />
          <stop offset="0.65" stopColor="#1f3f7a" />
          <stop offset="1" stopColor="#4c86c8" />
        </linearGradient>
      </defs>

      <rect width="600" height="300" fill="url(#scene-sky)" />
      <circle className="scene-sun" cx="470" cy="120" r="46" />

      {buildings.map((b) => (
        <rect key={b.x} className="scene-building" x={b.x} y={GROUND_Y - b.h} width={b.w} height={b.h} rx="3" />
      ))}

      {[40, 160, 280, 400, 520].map((x) => (
        <rect key={x} className="scene-pillar" x={x} y={BEAM_Y} width="12" height={GROUND_Y - BEAM_Y} />
      ))}
      <rect className="scene-beam" x="-20" y={BEAM_Y - 6} width="660" height="14" rx="5" />

      <g className="scene-train">
        {cars.map((i) => {
          const x = i * (CAR_WIDTH + CAR_GAP);
          return (
            <g key={i} transform={`translate(${x} 0)`}>
              <rect
                className="scene-car"
                x="0"
                y={BEAM_Y - 52}
                width={CAR_WIDTH}
                height="50"
                rx={i === cars.length - 1 ? 22 : 10}
              />
              <rect className="scene-stripe" x="0" y={BEAM_Y - 18} width={CAR_WIDTH} height="6" />
              <rect className="scene-skirt" x="6" y={BEAM_Y - 6} width={CAR_WIDTH - 12} height="18" rx="4" />
              {[0, 1, 2, 3, 4].map((w) => (
                <rect key={w} className="scene-window" x={10 + w * 21} y={BEAM_Y - 42} width="15" height="14" rx="3" />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
