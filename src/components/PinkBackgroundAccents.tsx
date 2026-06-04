/** Soft rose/pink blooms behind page content — fixed, non-interactive */
export function PinkBackgroundAccents() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -right-20 top-[18%] h-80 w-80 rounded-full bg-[oklch(0.84_0.11_350/0.20)] blur-3xl" />
      <div className="absolute -left-24 top-[38%] h-72 w-72 rounded-full bg-[oklch(0.88_0.09_10/0.16)] blur-3xl" />
      <div className="absolute right-[12%] bottom-[8%] h-64 w-64 rounded-full bg-[oklch(0.90_0.07_355/0.18)] blur-3xl" />
      <div className="absolute left-[35%] top-[72%] h-48 w-48 rounded-full bg-[oklch(0.92_0.05_340/0.14)] blur-2xl" />
    </div>
  );
}
