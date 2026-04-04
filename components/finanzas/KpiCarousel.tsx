'use client';

import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { InfoTip } from '@/components/info-tip';
import { cn } from '@/lib/utils';

export interface KpiItem {
  label: string;
  value: string;
  subValue?: string;
  tooltip?: string;
}

function FitText({ value }: { value: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const span = spanRef.current;
    if (!container || !span) return;

    const resize = () => {
      span.style.fontSize = '';
      if (span.scrollWidth > container.clientWidth) {
        const ratio = container.clientWidth / span.scrollWidth;
        const current = parseFloat(getComputedStyle(span).fontSize);
        span.style.fontSize = `${Math.floor(current * ratio)}px`;
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [value]);

  return (
    <div ref={containerRef} className="min-w-0">
      <span ref={spanRef} className="text-3xl font-bold text-white whitespace-nowrap block">
        {value}
      </span>
    </div>
  );
}

function KpiCard({ label, value, subValue, tooltip }: KpiItem) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl border border-slate-700/50 bg-slate-800/40 p-6 shadow-sm transition-all hover:bg-slate-800/60">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </span>
        {tooltip && <InfoTip text={tooltip} />}
      </div>
      <div className="flex flex-col gap-1">
        <FitText value={value} />
        {subValue && <span className="text-sm text-slate-500">{subValue}</span>}
      </div>
    </div>
  );
}

export function KpiCarousel({ items }: { items: KpiItem[] }) {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resetear scroll al montar en mobile
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    containerRef.current.scrollLeft = 0;
    setActiveIndex(0);
  }, [isMobile]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      const cardEl = container.firstElementChild as HTMLElement | null;
      if (!cardEl) return;
      const cardWidth = cardEl.getBoundingClientRect().width;
      const gap = 12; // gap-3
      setActiveIndex(Math.round(container.scrollLeft / (cardWidth + gap)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Desktop: grid normal
  if (!isMobile) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>
    );
  }

  // Mobile: carrusel con snap + dots
  return (
    <section className="space-y-3">
      {/* Hint de deslizamiento */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right pr-1">
        deslizá →
      </p>

      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.label} className="min-w-[calc(100%-1.5rem)] shrink-0 snap-start">
            <KpiCard {...item} />
          </div>
        ))}
      </div>

      {/* Dots indicadores */}
      <div className="flex justify-center gap-2 pt-1">
        {items.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === activeIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
            )}
          />
        ))}
      </div>
    </section>
  );
}
