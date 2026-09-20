import {
  createPowerSearchConfig,
  type PowerSearchConfig,
  type PowerSearchFilter,
} from '@astryxdesign/core/PowerSearch';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type RefObject,
  type ReactNode,
} from 'react';
import { collectAstryxPowerSearchFields } from './AstryxPowerSearchField';
import { cx } from './classNames';
import { useStableAstryxChildren } from './stableChildren';

export type AstryxPowerSearchSize = 'sm' | 'md' | 'lg';
export type AstryxPowerSearchStatus = 'none' | 'success' | 'warning' | 'error';
export type AstryxPowerSearchOverflow = 'none' | 'unfocusedInline' | 'unfocusedLayer';

type RootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className'>;

export interface AstryxPowerSearchProps extends RootProps {
  children?: ReactNode;
  size?: AstryxPowerSearchSize;
  status?: AstryxPowerSearchStatus;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  className?: string;
}

interface PowerSearchSurfaceContextValue {
  config: PowerSearchConfig;
  filters: ReadonlyArray<PowerSearchFilter>;
  query: string;
  activeFieldKey: string | null;
  isMenuOpen: boolean;
  isDisabled: boolean;
  isReadOnly: boolean;
  rootRef: RefObject<HTMLDivElement | null>;
  surfaceId: string;
  setQuery: (query: string) => void;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
  selectField: (fieldKey: string) => void;
  saveFilter: (filter: PowerSearchFilter | null) => void;
}

const PowerSearchSurfaceContext =
  createContext<PowerSearchSurfaceContextValue | null>(null);

export function AstryxPowerSearch({
  children,
  size = 'md',
  status = 'none',
  isDisabled = false,
  isReadOnly = false,
  className,
  ...rootProps
}: AstryxPowerSearchProps) {
  const stableChildren = useStableAstryxChildren(children);
  const authoredFields = useMemo(
    () => collectAstryxPowerSearchFields(stableChildren),
    [stableChildren],
  );
  const config = useMemo(() => {
    const { config: baseConfig } = createPowerSearchConfig(
      authoredFields.map((field) => field.definition),
      'WorkbenchSearch',
    );
    const metadata = new Map(
      authoredFields.map((field) => [field.definition.key, field]),
    );
    return {
      ...baseConfig,
      fields: baseConfig.fields.map((field) => {
        const authored = metadata.get(field.key);
        return {
          ...field,
          description: authored?.description,
          group: authored?.group,
          icon: authored?.icon,
        };
      }),
    };
  }, [authoredFields]);
  const [filters, setFilters] = useState<ReadonlyArray<PowerSearchFilter>>([]);
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const surfaceId = useId();

  useEffect(() => {
    if (!isMenuOpen) return;
    const root = rootRef.current;
    const ownerDocument = root?.ownerDocument;
    if (!root || !ownerDocument) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target instanceof ownerDocument.defaultView!.Element
        ? event.target
        : null;
      if (isPowerSearchOwnedTarget(target, root, surfaceId)) return;
      setIsMenuOpen(false);
      setActiveFieldKey(null);
    };

    ownerDocument.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () => {
      ownerDocument.removeEventListener('pointerdown', handleOutsidePointerDown, true);
    };
  }, [isMenuOpen, surfaceId]);

  const context = useMemo<PowerSearchSurfaceContextValue>(
    () => ({
      config,
      filters,
      query,
      activeFieldKey,
      isMenuOpen,
      isDisabled,
      isReadOnly,
      rootRef,
      surfaceId,
      setQuery,
      openMenu: () => {
        if (!isDisabled) setIsMenuOpen(true);
      },
      closeMenu: () => {
        setIsMenuOpen(false);
        setActiveFieldKey(null);
      },
      toggleMenu: () => {
        if (isDisabled) return;
        setIsMenuOpen((current) => {
          const nextOpen = !current;
          if (!nextOpen) setActiveFieldKey(null);
          return nextOpen;
        });
      },
      selectField: (fieldKey) => {
        if (isDisabled || isReadOnly) return;
        setActiveFieldKey(fieldKey);
        setIsMenuOpen(true);
      },
      saveFilter: (filter) => {
        if (filter) {
          setFilters((current) => [...current, filter]);
        }
        setActiveFieldKey(null);
        setIsMenuOpen(false);
        setQuery('');
      },
    }),
    [
      activeFieldKey,
      config,
      filters,
      isDisabled,
      isMenuOpen,
      isReadOnly,
      query,
      rootRef,
      surfaceId,
    ],
  );

  return (
    <PowerSearchSurfaceContext.Provider value={context}>
      <div
        {...rootProps}
        ref={rootRef}
        className={cx(
          'astryx-wb-power-search',
          `astryx-wb-power-search--${size}`,
          status !== 'none' && `astryx-wb-power-search--${status}`,
          className,
        )}
        data-astryx-wb-power-search="true"
        data-astryx-wb-power-search-id={surfaceId}
        onBlurCapture={(event) => {
          rootProps.onBlurCapture?.(event);
        }}
        onKeyDownCapture={(event) => {
          rootProps.onKeyDownCapture?.(event);
          if (event.key !== 'Escape' || !isMenuOpen) return;
          event.preventDefault();
          setIsMenuOpen(false);
          setActiveFieldKey(null);
        }}
      >
        {stableChildren}
      </div>
    </PowerSearchSurfaceContext.Provider>
  );
}

AstryxPowerSearch.displayName = 'AstryxPowerSearch';

export function useAstryxPowerSearchSurface() {
  return useContext(PowerSearchSurfaceContext);
}

function isPowerSearchOwnedTarget(
  target: Element | null,
  root: HTMLElement,
  surfaceId: string,
): boolean {
  if (!target) return false;
  if (root.contains(target)) return true;

  const explicitOwner = target.closest<HTMLElement>(
    '[data-astryx-wb-power-search-owner]',
  );
  if (
    explicitOwner?.getAttribute('data-astryx-wb-power-search-owner') ===
    surfaceId
  ) {
    return true;
  }

  let controlledSurface: Element | null = target;
  while (controlledSurface) {
    const controlledId = controlledSurface.id;
    if (controlledId) {
      const controllingTrigger = Array.from(
        root.ownerDocument.querySelectorAll<HTMLElement>('[aria-controls]'),
      ).find((candidate) => (
        (candidate.getAttribute('aria-controls') ?? '')
          .split(/\s+/)
          .includes(controlledId) &&
        (
          root.contains(candidate) ||
          candidate.closest<HTMLElement>(
            `[data-astryx-wb-power-search-owner="${surfaceId}"]`,
          )
        )
      ));
      if (controllingTrigger) return true;
    }
    controlledSurface = controlledSurface.parentElement;
  }

  return false;
}
