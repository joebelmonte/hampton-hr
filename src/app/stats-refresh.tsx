"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function StatsRefresh({ needed }: { needed: boolean }) {
  const router = useRouter();
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!needed) return;
    let active = true;
    void fetch("/api/public/stats-refresh", { method: "POST", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ refreshed: boolean; statsUpdated: boolean }> : null)
      .then((result) => {
        if (!active || !result?.refreshed) return;
        if (result.statsUpdated) setUpdated(true);
        router.refresh();
      })
      .catch(() => {
        // A background refresh must never interrupt the public page.
      });
    return () => { active = false; };
  }, [needed, router]);

  return updated ? <p className="stats-updated" role="status">Stats updated</p> : null;
}
