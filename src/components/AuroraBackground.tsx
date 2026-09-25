import React from 'react';

interface AuroraBackgroundProps {
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export function AuroraBackground({ children, theme = 'dark' }: AuroraBackgroundProps) {
  const isLight = theme === 'light';

  return (
    <div
      className={`relative min-h-screen w-full transition-colors duration-500 overflow-hidden ${
        isLight ? 'bg-slate-100 text-slate-900 theme-light' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Ambient Aurora Glow Orbs */}
      {isLight ? (
        <>
          <div className="fixed -top-40 -left-40 w-[550px] h-[550px] bg-sky-400/25 rounded-full blur-[140px] pointer-events-none animate-float-slow" />
          <div className="fixed top-1/3 -right-32 w-[450px] h-[450px] bg-indigo-400/20 rounded-full blur-[140px] pointer-events-none animate-float-medium" />
          <div className="fixed -bottom-32 left-1/4 w-[550px] h-[550px] bg-teal-300/25 rounded-full blur-[150px] pointer-events-none" />
          <div className="fixed top-10 right-1/3 w-[350px] h-[350px] bg-violet-400/15 rounded-full blur-[130px] pointer-events-none" />
          
          {/* Subtle gradient overlay for cool depth */}
          <div className="fixed inset-0 bg-gradient-to-b from-transparent via-slate-100/40 to-slate-100 pointer-events-none" />
          
          {/* Subtle grid texture */}
          <div className="fixed inset-0 tech-grid-bg pointer-events-none opacity-40" />
        </>
      ) : (
        <>
          <div className="fixed -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-float-slow" />
          <div className="fixed top-1/3 -right-32 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none animate-float-medium" />
          <div className="fixed -bottom-32 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none" />
          
          {/* Subtle gradient overlay for depth */}
          <div className="fixed inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950 pointer-events-none" />
          
          {/* Subtle grid texture */}
          <div className="fixed inset-0 tech-grid-bg pointer-events-none opacity-50" />
        </>
      )}

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
