import React from 'react'

export function Logo({ size = 'md' }) {
  const dimensions = {
    sm: 32,
    md: 44,
    lg: 64,
  }

  const d = dimensions[size]

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <img
          src="/icon-192.png"
          alt="Casa de Labada Logo"
          width={d}
          height={d}
          className="rounded-xl shadow-sm border border-zinc-800"
          style={{ width: `${d}px`, height: `${d}px` }}
        />
      </div>
      <div className="flex flex-col">
        <span
          className={`font-mono font-bold tracking-widest text-white ${
            size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
          }`}
        >
          CASA DE LABADA
        </span>
        {size !== 'sm' && (
          <span className="font-mono text-[10px] tracking-[0.3em] text-cyan-400 uppercase">
            Laundry Management System
          </span>
        )}
      </div>
    </div>
  )
}
