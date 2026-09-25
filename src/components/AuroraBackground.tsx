import React from 'react';

export function AuroraBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Ambient Aurora Glow Orbs */}
      <div
        className="fixed -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-float-slow"
      />
      <div
        className="fixed top-1/3 -right-32 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none animate-float-medium"
      />
      <div
        className="fixed -bottom-32 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none"
      />

      {/* Subtle gradient overlay for depth */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950 pointer-events-none" />

      {/* Subtle grid texture */}
      <div className="fixed inset-0 tech-grid-bg pointer-events-none opacity-50" />

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
