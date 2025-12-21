import { Skeleton } from "../ui/skeleton";
import { cn } from "../ui/utils";

export function DashboardSkeleton() {
  const sectionCardClass = "rounded-lg border border-white/5 bg-app-dark p-6 shadow-[0_25px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm";
  const evolutionCardClass = "rounded-lg border border-white/5 bg-app-darker p-6 sm:p-8";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 bg-white/10" />
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-48 bg-white/10" />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Skeleton className="h-10 w-32 bg-emerald-600/20" />
            <Skeleton className="h-10 w-32 bg-emerald-600/20" />
            <Skeleton className="h-10 w-24 bg-emerald-600/20" />
          </div>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-5">
        {/* Bank Roll Card */}
        <div className="col-span-1 space-y-6 rounded-lg border border-border/30 p-6 shadow-card lg:col-span-2 bg-bank-hero">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-10 w-40 bg-white/20" />
            </div>
            <Skeleton className="h-8 w-20 rounded-2xl bg-emerald-400/10" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-8 w-32 bg-white/20" />
            </div>
            <div className="flex items-end justify-end">
              <Skeleton className="h-10 w-32 rounded-2xl bg-white/10" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`space-y-2 ${i > 1 ? (i === 3 ? 'text-right flex flex-col items-end' : 'text-center flex flex-col items-center') : ''}`}>
                <Skeleton className="h-2 w-20 bg-white/10" />
                <Skeleton className="h-6 w-24 bg-white/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Depósitos e Saques */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {[1, 2].map((i) => (
            <div key={i} className={cn(sectionCardClass, "flex items-center gap-3 p-4 h-full")}>
              <Skeleton className="h-10 w-10 rounded-xl bg-emerald-500/10" />
              <div className="space-y-1">
                <Skeleton className="h-2 w-16 bg-white/10" />
                <Skeleton className="h-6 w-24 bg-white/10" />
              </div>
            </div>
          ))}
        </div>

        {/* Win Rate Card */}
        <div className={cn(sectionCardClass, "space-y-4 lg:col-span-2")}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl bg-brand-emerald/15" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-3 w-16 bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 bg-white/10" />
          </div>
          <div className="grid gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2 w-16 bg-white/10" />
                <Skeleton className="h-6 w-12 bg-white/10" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-full rounded-full bg-white/5" />
          <Skeleton className="h-3 w-32 bg-white/10" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        {/* Evolution Chart */}
        <div className={cn(evolutionCardClass, "space-y-6")}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48 bg-white/10" />
                <Skeleton className="h-4 w-64 bg-white/10" />
              </div>
            </div>
            <Skeleton className="h-8 w-48 rounded-full bg-white/10" />
          </div>

          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/10 p-4 sm:p-6">
            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-40 bg-white/10" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
            <Skeleton className="h-72 w-full bg-white/5 rounded-xl" />
          </div>
        </div>

        {/* Recent Performance */}
        <div className={cn(sectionCardClass, "space-y-5")}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-40 bg-white/10" />
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
            <Skeleton className="h-5 w-5 bg-white/10" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/10" />
                  <Skeleton className="h-3 w-24 bg-white/10" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16 rounded-full bg-white/10" />
                  <Skeleton className="h-5 w-16 bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown Lists */}
      <section className="grid gap-6 xl:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className={cn(sectionCardClass, "space-y-5")}>
            <div className="space-y-1">
              <Skeleton className="h-6 w-48 bg-white/10" />
              <Skeleton className="h-4 w-40 bg-white/10" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-16 rounded-lg bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
