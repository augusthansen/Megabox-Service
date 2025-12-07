"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect from /admin/sites to /admin/facilities
 */
export default function SitesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/facilities");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">Redirecting to Facilities...</p>
    </div>
  );
}
