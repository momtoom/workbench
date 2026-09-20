import { useEffect, useState } from 'react';

export function useTokenRowSettings() {
  const [openSettingsTokenId, setOpenSettingsTokenId] = useState<string | null>(null);

  useEffect(() => {
    function closeTokenSettings(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest('.wb-row-more')) return;
      setOpenSettingsTokenId(null);
    }

    function closeTokenSettingsOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenSettingsTokenId(null);
    }

    document.addEventListener('pointerdown', closeTokenSettings);
    document.addEventListener('keydown', closeTokenSettingsOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeTokenSettings);
      document.removeEventListener('keydown', closeTokenSettingsOnEscape);
    };
  }, []);

  function setTokenSettingsOpen(tokenId: string, open: boolean) {
    setOpenSettingsTokenId(open ? tokenId : null);
  }

  return {
    openSettingsTokenId,
    setTokenSettingsOpen,
  };
}
