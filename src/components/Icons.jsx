// Minimal line icons. Inherit color via currentColor; consistent 1.75 stroke.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 20, children, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} {...p}>
      {children}
    </svg>
  )
}

export const Plus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const Minus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)
export const ChevronRight = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)
export const ChevronLeft = (p) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
)
export const ChevronDown = (p) => (
  <Svg {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
)
export const ArrowUp = (p) => (
  <Svg {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
)
export const ArrowDown = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Svg>
)
export const Dash = (p) => (
  <Svg {...p}>
    <path d="M6 12h12" />
  </Svg>
)
export const Trophy = (p) => (
  <Svg {...p}>
    <path d="M7 4h10v4a5 5 0 01-10 0V4z" />
    <path d="M7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 18h6M10 14.5V18M14 14.5V18M8 21h8" />
  </Svg>
)
export const Timer = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2M9 2h6" />
  </Svg>
)
export const Settings = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.05.05a2 2 0 11-2.83 2.83l-.05-.05a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1 1.56V21a2 2 0 11-4 0v-.07A1.7 1.7 0 008.5 19.4a1.7 1.7 0 00-1.88.34l-.05.05a2 2 0 11-2.83-2.83l.05-.05A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.56-1H3a2 2 0 110-4h.07A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.05-.05a2 2 0 112.83-2.83l.05.05A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.56V3a2 2 0 114 0v.07a1.7 1.7 0 001 1.56 1.7 1.7 0 001.88-.34l.05-.05a2 2 0 112.83 2.83l-.05.05A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.56 1H21a2 2 0 110 4h-.07a1.7 1.7 0 00-1.53 1z" />
  </Svg>
)
export const Trash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a1 1 0 01-1 1H8a1 1 0 01-1-1V7" />
  </Svg>
)
export const Download = (p) => (
  <Svg {...p}>
    <path d="M12 4v11m-4-4l4 4 4-4M5 20h14" />
  </Svg>
)
export const Upload = (p) => (
  <Svg {...p}>
    <path d="M12 16V5m-4 4l4-4 4 4M5 20h14" />
  </Svg>
)
export const X = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)
export const Check = (p) => (
  <Svg {...p}>
    <path d="M5 12l4.5 4.5L19 6" />
  </Svg>
)
export const Edit = (p) => (
  <Svg {...p}>
    <path d="M4 20h4l10-10a2.83 2.83 0 10-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
)
export const Chart = (p) => (
  <Svg {...p}>
    <path d="M4 19V5M4 19h16M8 16l3.5-4 3 2.5L20 8" />
  </Svg>
)
export const Note = (p) => (
  <Svg {...p}>
    <path d="M5 4h14v16l-3-2-3 2-3-2-2 2V4z" />
    <path d="M9 9h6M9 12h4" />
  </Svg>
)
export const Play = (p) => (
  <Svg {...p}>
    <path d="M7 5l11 7-11 7V5z" />
  </Svg>
)
export const Pause = (p) => (
  <Svg {...p}>
    <path d="M8 5v14M16 5v14" />
  </Svg>
)
export const Drag = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </Svg>
)
export const Dumbbell = (p) => (
  <Svg {...p}>
    <path d="M6.5 6.5l11 11M4 9l-1 1a1.5 1.5 0 000 2l8 8a1.5 1.5 0 002 0l1-1M20 15l1-1a1.5 1.5 0 000-2l-8-8a1.5 1.5 0 00-2 0l-1 1" />
  </Svg>
)
