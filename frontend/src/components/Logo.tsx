interface LogoProps {
  showTagline?: boolean
  light?: boolean
}

export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="22" y="4" width="20" height="56" rx="10" fill="#43B97F" />
      <rect x="4" y="22" width="56" height="20" rx="10" fill="#43B97F" />
      <rect x="32" y="22" width="28" height="20" rx="10" fill="#12918F" />
      <rect x="32" y="22" width="14" height="20" fill="#12918F" />
      <path d="M24 44C24 30 34 22 42 20C44 30 38 42 24 44Z" fill="#EAF7EE" />
      <path d="M26 41C31 33 36 27 41 23" stroke="#43B97F" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export function Logo({ showTagline = false, light = false }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-3">
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>
          HealthSathi<span className="text-leaf">24</span>
        </span>
        {showTagline && (
          <span className={`mt-1 text-[11px] tracking-wide ${light ? 'text-white/70' : 'text-ink-soft'}`}>
            Trusted Health Companion
          </span>
        )}
      </span>
    </span>
  )
}
