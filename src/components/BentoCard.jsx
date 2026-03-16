import React from 'react'

export function BentoCard({
  title,
  value,
  icon,
  accent = 'default',
  subtitle,
  animationDelay = '0ms',
}) {
  const accentStyles = {
    ocean: {
      value: 'text-cyan-400',
      icon: 'text-cyan-500',
      glow: 'shadow-sm',
      border: 'border-zinc-800',
      bg: 'bg-zinc-900',
    },
    default: {
      value: 'text-white',
      icon: 'text-zinc-400',
      glow: 'shadow-sm',
      border: 'border-zinc-800',
      bg: 'bg-zinc-900',
    },
    seafoam: {
      value: 'text-amber-400',
      icon: 'text-amber-500',
      glow: 'shadow-sm',
      border: 'border-zinc-800',
      bg: 'bg-zinc-900',
    },
  }
  const s = accentStyles[accent]
  return (
    <div
      className={`${s.bg} rounded-xl p-5 ${s.glow} ${s.border} border animate-slide-up`}
      style={{
        animationDelay,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-medium">
          {title}
        </span>
        <div className={`${s.icon}`} aria-hidden="true">
          {icon}
        </div>
      </div>
      <div className={`font-mono text-3xl font-bold ${s.value} tracking-tight`}>
        {value}
      </div>
      {subtitle && (
        <p className="font-mono text-[10px] text-zinc-500 mt-1.5">{subtitle}</p>
      )}
    </div>
  )
}
