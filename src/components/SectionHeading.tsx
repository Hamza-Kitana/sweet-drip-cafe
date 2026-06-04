export function SectionHeading({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="w-full text-center mb-8 md:mb-12 px-1">
      {eyebrow && <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] sm:tracking-[0.3em] text-secondary mb-2 sm:mb-3">{eyebrow}</p>}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-primary leading-tight">{title}</h2>
      {sub && <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">{sub}</p>}
    </div>
  );
}