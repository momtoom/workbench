import { Theme, type DefinedTheme, type ThemeMode } from '@astryxdesign/core';
import { butterTheme } from '@astryxdesign/theme-butter';
import { chocolateTheme } from '@astryxdesign/theme-chocolate';
import { gothicTheme } from '@astryxdesign/theme-gothic';
import { matchaTheme } from '@astryxdesign/theme-matcha';
import { neutralTheme } from '@astryxdesign/theme-neutral';
import { stoneTheme } from '@astryxdesign/theme-stone';
import { y2kTheme } from '@astryxdesign/theme-y2k';
import { useCallback, useEffect, useState, type ComponentPropsWithoutRef, type CSSProperties, type ReactNode } from 'react';
import { cx } from './classNames';

export type AstryxThemePresetName = 'neutral' | 'butter' | 'chocolate' | 'gothic' | 'matcha' | 'stone' | 'y2k';
export type AstryxThemeName = 'inherit' | AstryxThemePresetName;
export type AstryxThemeColorMode = 'auto' | 'light' | 'dark';
export type AstryxThemeElement = 'div' | 'main' | 'section' | 'article' | 'header' | 'footer' | 'aside';

const ASTRYX_THEMES: Record<AstryxThemePresetName, DefinedTheme> = {
  neutral: neutralTheme,
  butter: butterTheme,
  chocolate: chocolateTheme,
  gothic: gothicTheme,
  matcha: matchaTheme,
  stone: stoneTheme,
  y2k: y2kTheme,
};

type AstryxThemeRootProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'className' | 'style'> & {
  'data-wb-token-modes'?: string;
};

export interface AstryxThemeProps extends AstryxThemeRootProps {
  theme?: AstryxThemeName;
  colorMode?: AstryxThemeColorMode;
  as?: AstryxThemeElement;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function AstryxTheme({
  theme = 'neutral',
  colorMode = 'auto',
  as: Component = 'div',
  className,
  style,
  children,
  ...rootProps
}: AstryxThemeProps) {
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);
  const [autoMode, setAutoMode] = useState<'light' | 'dark'>(() => getAutoThemeMode());
  const [inheritedTheme, setInheritedTheme] = useState<AstryxThemePresetName>(() => getInheritedThemeName());
  const handleRootRef = useCallback((element: HTMLElement | null) => {
    setRootElement(element);
  }, []);
  useEffect(() => {
    if (colorMode !== 'auto') return;

    const updateAutoMode = () => setAutoMode(getAutoThemeMode(rootElement));
    updateAutoMode();

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    mediaQuery?.addEventListener?.('change', updateAutoMode);
    const observer = new MutationObserver(updateAutoMode);
    const observedElements = new Set<Element>();
    for (const element of [
      rootElement,
      rootElement?.closest('[data-wb-preview-appearance]') ?? null,
      document.documentElement,
      document.body,
    ]) {
      if (!element || observedElements.has(element)) continue;
      observedElements.add(element);
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class', 'data-preview-theme', 'data-theme', 'data-wb-preview-appearance'],
      });
    }

    return () => {
      mediaQuery?.removeEventListener?.('change', updateAutoMode);
      observer.disconnect();
    };
  }, [colorMode, rootElement]);
  const authoredTokenModes = rootProps['data-wb-token-modes'];
  useEffect(() => {
    if (theme !== 'inherit') return;

    const updateInheritedTheme = () => setInheritedTheme(getInheritedThemeName(rootElement));
    updateInheritedTheme();

    const tokenModeRoot = getInheritedTokenModeRoot(rootElement);
    if (!tokenModeRoot) return;

    const observer = new MutationObserver(updateInheritedTheme);
    observer.observe(tokenModeRoot, {
      attributes: true,
      attributeFilter: ['data-wb-token-modes'],
    });
    return () => observer.disconnect();
  }, [authoredTokenModes, rootElement, theme]);

  const resolvedStyle = {
    ...style,
    colorScheme: colorMode === 'auto' ? style?.colorScheme : colorMode,
  } satisfies CSSProperties;
  const resolvedTheme = theme === 'inherit' ? inheritedTheme : theme;
  const tokenModes = theme === 'inherit'
    ? typeof authoredTokenModes === 'string' ? authoredTokenModes : undefined
    : `astryx-theme=${theme};astryx-components=default`;
  const themeMode: ThemeMode = colorMode === 'auto' ? autoMode : colorMode;

  return (
    <Theme theme={ASTRYX_THEMES[resolvedTheme]} mode={themeMode}>
      <Component
        {...rootProps}
        ref={handleRootRef}
        className={cx('astryx-wb-theme', className)}
        data-astryx-media={colorMode === 'auto' ? undefined : colorMode}
        data-astryx-theme={theme === 'inherit' ? undefined : theme}
        data-wb-token-modes={tokenModes}
        style={resolvedStyle}
      >
        {children}
      </Component>
    </Theme>
  );
}

function getInheritedThemeName(scopeElement?: Element | null): AstryxThemePresetName {
  const tokenModes = getInheritedTokenModeRoot(scopeElement)?.getAttribute('data-wb-token-modes');
  const themeMode = tokenModes
    ?.split(';')
    .map((entry) => entry.trim().split('='))
    .find(([collectionId]) => collectionId === 'astryx-theme')?.[1];

  return themeMode && Object.prototype.hasOwnProperty.call(ASTRYX_THEMES, themeMode)
    ? (themeMode as AstryxThemePresetName)
    : 'neutral';
}

function getInheritedTokenModeRoot(scopeElement?: Element | null): HTMLElement | null {
  if (scopeElement) {
    const closestRoot = scopeElement.closest<HTMLElement>('[data-wb-token-modes]');
    if (closestRoot) return closestRoot;
  }
  if (typeof document === 'undefined') return null;
  return document.querySelector<HTMLElement>('[data-workbench-preview-root][data-wb-token-modes]')
    ?? document.querySelector<HTMLElement>('[data-wb-token-modes]');
}

function getAutoThemeMode(scopeElement?: Element | null): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    const previewRoot = scopeElement?.closest<HTMLElement>('[data-wb-preview-appearance]') ?? null;
    const previewMode = getThemeModeValue(previewRoot?.getAttribute('data-wb-preview-appearance'));
    if (previewMode) return previewMode;
    if (previewRoot) return getSystemThemeMode();

    const documentMode = getThemeModeValue(document.documentElement.getAttribute('data-theme'));
    const bodyMode = getThemeModeValue(document.body?.getAttribute('data-theme'));
    if (documentMode) return documentMode;
    if (bodyMode) return bodyMode;
    if (document.documentElement.classList.contains('dark') || document.body?.classList.contains('dark')) {
      return 'dark';
    }
  }
  return getSystemThemeMode();
}

function getThemeModeValue(value: string | null | undefined): 'light' | 'dark' | null {
  return value === 'light' || value === 'dark' ? value : null;
}

function getSystemThemeMode(): 'light' | 'dark' {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
