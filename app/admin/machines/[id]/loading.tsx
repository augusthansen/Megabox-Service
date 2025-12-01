import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

export default function MachineDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="animate-pulse h-6 w-6 bg-gray-200 rounded" />
        <div className="animate-pulse h-8 w-36 bg-gray-200 rounded" />
        <div className="animate-pulse h-6 w-16 bg-gray-200 rounded-full" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton />
          <TableSkeleton rows={4} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
