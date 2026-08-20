"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function StatsRefresh({ needed }: { needed: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!needed) return;
    let active = true;
    void fetch("/api/public/stats-refresh", { method: "POST", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ refreshed: boolean }> : null)
      .then((result) => {
        if (!active || !result?.refreshed) return;
        router.refresh();
      })
      .catch(() => {
        // A background refresh must never interrupt the public page.
      });
    return () => { active = false; };
  }, [needed, router]);

  return null;
}
