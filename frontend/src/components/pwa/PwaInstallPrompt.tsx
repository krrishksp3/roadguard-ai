import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] RoadGuard AI installed successfully.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted installation prompt');
      setIsInstalled(true);
    } else {
      console.log('[PWA] User dismissed installation prompt');
      setIsDismissed(true);
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isInstalled || isDismissed) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      title="Install RoadGuard AI on this device for offline access"
      className="flex items-center space-x-1.5 bg-gradient-to-r from-sky-600 to-gov-600 hover:from-sky-500 hover:to-gov-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-sm border border-sky-400/30 transition hover:shadow-md"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Install App</span>
    </button>
  );
};
