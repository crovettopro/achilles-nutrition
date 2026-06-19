import { useId } from 'react'

/**
 * A fine, elegant line chart. Higher values sit higher on the chart, so a
 * descending weight reads as a line sloping down. Stroke stays crisp at any
 * width (non-scaling) and a soft area fades beneath it.
 */
export default function Sparkline({
  values,
  height = 72,
  color = 'var(--gold)',
}: {
  values: number[]
  height?: number
  color?: string
}) {
  const id = useId().replace(/:/g, '')
  if (values.length < 2) return null

  const W = 320
  const H = height
  const padX = 6
  const padY = 12
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = (W - padX * 2) / (values.length - 1)

  const pts = values.map((v, i) => {
    const x = padX + i * stepX
    const y = padY + ((max - v) / span) * (H - padY * 2)
    return [x, y] as const
  })

  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${H} L${pts[0][0].toFixed(1)} ${H} Z`
  const [lx, ly] = pts[pts.length - 1]
  const [fx, fy] = pts[0]

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#fill-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* start point — faint */}
      <circle cx={fx} cy={fy} r="2.5" fill="var(--bg)" stroke={color} strokeWidth="1" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
      {/* current point — gold with halo */}
      <circle cx={lx} cy={ly} r="6" fill={color} fillOpacity="0.15" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  )
}
