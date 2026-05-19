"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Fire-and-forget analytics tracker — never throws
export function track(type: string, data: Record<string, any> = {}) {
  try {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
      keepalive: true,
    }).catch(() => {}); // completely silent
  } catch (_) {}
}

// Auto page-view tracker component — add to layout
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    track("page_view", {
      path: pathname,
      referrer: document.referrer || null,
    });
  }, [pathname]);

  return null; // invisible component
}
