"use client";

import { useServerInsertedHTML } from "next/navigation";
import { useRef } from "react";
import { PWA_LOGIN_REDIRECT_SCRIPT } from "@/lib/pwa";

export function PwaLoginRedirect() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    return (
      <script dangerouslySetInnerHTML={{ __html: PWA_LOGIN_REDIRECT_SCRIPT }} />
    );
  });

  return null;
}
