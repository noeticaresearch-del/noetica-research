export default function BeatProgressRing({
  progress, // 0..1
  beatsPerBar,
  currentBeat,
  size = 240,
  strokeWidth = 14,
  padding = 18,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) - padding - strokeWidth / 2;

  const circumference = 2 * Math.PI * r;

  const p = Math.min(1, Math.max(0, progress));
  const dashArray = circumference;
  const dashOffset = circumference * (1 - p);

  return (
    <svg width={size} height={size} role="img" aria-label="beat progress ring">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        opacity="0.18"
        strokeWidth={strokeWidth}
      />

      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="currentColor"
        opacity="0.9"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />

      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fontSize="52"
        fill="currentColor"
        opacity="0.92"
      >
        {currentBeat}
      </text>
      <text
        x={cx}
        y={cy + 40}
        textAnchor="middle"
        fontSize="14"
        fill="currentColor"
        opacity="0.6"
      >
        / {beatsPerBar}
      </text>
    </svg>
  );
}
