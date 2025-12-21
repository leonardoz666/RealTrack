import { Skeleton } from "../ui/skeleton";

export function ChartSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 p-6">
      <div className="flex w-full items-end gap-2 h-full px-4 pb-4">
        <Skeleton className="h-[40%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[70%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[50%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[80%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[60%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[90%] w-full rounded-t-md bg-white/5" />
        <Skeleton className="h-[30%] w-full rounded-t-md bg-white/5" />
      </div>
    </div>
  );
}
