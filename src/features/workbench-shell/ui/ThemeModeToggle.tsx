import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@shared/ui/primitives';

export type WorkbenchThemeMode = 'dark' | 'light';

export function ThemeModeToggle({
  mode,
  onToggle,
}: {
  mode: WorkbenchThemeMode;
  onToggle: () => void;
}) {
  const nextMode = mode === 'dark' ? 'light' : 'dark';

  return (
    <IconButton
      aria-pressed={mode === 'dark'}
      className="wb-theme-toggle"
      label={`Switch to ${nextMode} theme`}
      title={`Switch to ${nextMode} theme`}
      onClick={onToggle}
    >
      {mode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
    </IconButton>
  );
}
