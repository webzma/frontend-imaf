"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "imaf-install-banner-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;

  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function useInstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    const onDisplayModeChange = () => setInstalled(isStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return;

    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;

    if (outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // El banner se oculta igualmente en esta sesión.
    }
  }, []);

  return {
    canInstall: Boolean(promptEvent) && !installed && !dismissed,
    install,
    dismiss,
  };
}
