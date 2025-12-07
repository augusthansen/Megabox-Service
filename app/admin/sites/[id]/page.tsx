"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Redirect from /admin/sites/[id] to /admin/facilities/[id]
 */
export default function SiteDetailRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    router.replace(`/admin/facilities/${params.id}`);
  }, [router, params.id]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Redirecting to Facility...</p>
    </div>
  );
}
