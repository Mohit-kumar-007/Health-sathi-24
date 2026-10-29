export type TopicArtKind = 'prevention' | 'body' | 'mind' | 'daily'

const LEAF = 'M0 0C0-14 10-26 24-30C26-14 16-2 0 0Z'

function Sprig({ x, y, rotate, fill = '#52A447' }: { x: number; y: number; rotate: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`} opacity="0.85">
      <path d={LEAF} fill={fill} />
      <path d="M0 0C8-6 14-12 22-26" stroke="#EAF7EE" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Scene({ kind }: { kind: TopicArtKind }) {
  switch (kind) {
    case 'prevention':
      return (
        <>
          <path d="M160 36l46 16v40c0 30-20 48-46 58-26-10-46-28-46-58V52z" fill="#1F7A4D" />
          <path d="M160 46l36 13v33c0 24-16 39-36 47-20-8-36-23-36-47V59z" fill="#2E9A63" />
          <rect x="152" y="68" width="16" height="48" rx="5" fill="#fff" />
          <rect x="136" y="84" width="48" height="16" rx="5" fill="#fff" />
        </>
      )
    case 'body':
      return (
        <>
          <path d="M120 40c-14 24-26 38-26 56a26 26 0 0052 0c0-18-12-32-26-56z" fill="#12918F" />
          <path d="M108 100a16 16 0 0010 15" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M214 58c-9 15-16 24-16 35a16 16 0 0032 0c0-11-7-20-16-35z" fill="#43B97F" />
          <rect x="170" y="118" width="64" height="8" rx="4" fill="#16284B" opacity="0.15" />
        </>
      )
    case 'mind':
      return (
        <>
          <circle cx="160" cy="92" r="46" fill="#16284B" />
          <circle cx="178" cy="80" r="40" fill="#CFE9DD" />
          <circle cx="104" cy="52" r="3.5" fill="#12918F" />
          <circle cx="226" cy="116" r="3" fill="#12918F" />
          <circle cx="228" cy="48" r="4.5" fill="#43B97F" />
          <path d="M92 128c20-10 40-10 60 0s40 10 60 0" stroke="#12918F" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
        </>
      )
    case 'daily':
      return (
        <>
          <path d="M112 92h96a48 40 0 01-96 0z" fill="#1F7A4D" />
          <circle cx="136" cy="84" r="14" fill="#52A447" />
          <circle cx="164" cy="78" r="16" fill="#43B97F" />
          <circle cx="190" cy="86" r="13" fill="#12918F" />
          <rect x="106" y="132" width="108" height="7" rx="3.5" fill="#16284B" opacity="0.15" />
          <circle cx="238" cy="50" r="16" fill="#F4C95D" />
        </>
      )
  }
}

export function TopicArt({ kind, label }: { kind: TopicArtKind; label: string }) {
  return (
    <svg viewBox="0 0 320 180" role="img" aria-label={label} className="h-full w-full">
      <rect width="320" height="180" fill="#E5EBE3" />
      <circle cx="270" cy="30" r="70" fill="#D4EFE2" />
      <circle cx="40" cy="170" r="60" fill="#D4EFE2" />
      <Scene kind={kind} />
      <Sprig x={34} y={150} rotate={-20} />
      <Sprig x={50} y={158} rotate={25} fill="#728D78" />
      <Sprig x={292} y={158} rotate={200} />
    </svg>
  )
}
