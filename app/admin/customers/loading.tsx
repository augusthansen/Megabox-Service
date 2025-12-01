import { TableSkeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="animate-pulse">
          <div className="h-8 w-40 bg-gray-200 rounded" />
        </div>
        <div className="animate-pulse">
          <div className="h-10 w-36 bg-gray-200 rounded" />
        </div>
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}
