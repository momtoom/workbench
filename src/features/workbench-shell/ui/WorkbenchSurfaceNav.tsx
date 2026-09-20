import { BookOpen, Braces, Images, Palette } from 'lucide-react';
import type { WorkbenchSurface } from '@domain/project/workbenchProject';

export type { WorkbenchSurface } from '@domain/project/workbenchProject';

export function WorkbenchSurfaceNav({
  activeSurface,
  onChange,
}: {
  activeSurface: WorkbenchSurface;
  onChange: (surface: WorkbenchSurface) => void;
}) {
  return (
    <nav className="wb-surface-nav" aria-label="Workbench surfaces">
      <button
        type="button"
        className={activeSurface === 'assets' ? 'wb-surface-tab wb-surface-tab--active' : 'wb-surface-tab'}
        aria-current={activeSurface === 'assets' ? 'page' : undefined}
        aria-label="Asset Manager"
        title="Asset Manager"
        onClick={() => onChange('assets')}
      >
        <Images size={13} />
      </button>
      <button
        type="button"
        className={activeSurface === 'tokens' ? 'wb-surface-tab wb-surface-tab--active' : 'wb-surface-tab'}
        aria-current={activeSurface === 'tokens' ? 'page' : undefined}
        aria-label="Token Editor"
        title="Token Editor"
        onClick={() => onChange('tokens')}
      >
        <Palette size={13} />
      </button>
      <button
        type="button"
        className={activeSurface === 'storybook' ? 'wb-surface-tab wb-surface-tab--active' : 'wb-surface-tab'}
        aria-current={activeSurface === 'storybook' ? 'page' : undefined}
        aria-label="Storybook"
        title="Storybook"
        onClick={() => onChange('storybook')}
      >
        <BookOpen size={13} />
      </button>
      <button
        type="button"
        className={activeSurface === 'design' ? 'wb-surface-tab wb-surface-tab--active' : 'wb-surface-tab'}
        aria-current={activeSurface === 'design' ? 'page' : undefined}
        aria-label="Design Editor"
        title="Design Editor"
        onClick={() => onChange('design')}
      >
        <Braces size={13} />
      </button>
    </nav>
  );
}
