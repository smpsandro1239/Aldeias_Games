"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function RouteAnnouncer() {
  const pathname = usePathname();
  const announcementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcementRef.current) {
      announcementRef.current.textContent = `Página atual: ${document.title || pathname}`;
    }
  }, [pathname]);

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
