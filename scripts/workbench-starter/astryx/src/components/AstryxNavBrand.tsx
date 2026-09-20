import type { CSSProperties, ReactNode } from 'react';
import { AstryxIcon, type AstryxIconValue } from './AstryxIcon';
import { cx } from './classNames';

export const ASTRYX_NAV_BRAND_DISPLAYS = ['symbol', 'logo', 'signature', 'none'] as const;
export const ASTRYX_NAV_COLLAPSED_BRAND_DISPLAYS = ['symbol', 'menu'] as const;

export type AstryxNavBrandDisplay = typeof ASTRYX_NAV_BRAND_DISPLAYS[number];
export type AstryxNavCollapsedBrandDisplay = typeof ASTRYX_NAV_COLLAPSED_BRAND_DISPLAYS[number];
export type AstryxNavCollapsedBrandDisplayInput = AstryxNavCollapsedBrandDisplay | 'logo' | 'none';
export type AstryxNavBrandIcon = AstryxIconValue | 'none';

export interface AstryxNavBrandProps {
  display?: AstryxNavBrandDisplay;
  collapsedDisplay?: AstryxNavCollapsedBrandDisplayInput;
  symbolIcon?: AstryxNavBrandIcon;
  symbolSrc?: string;
  symbolAlt?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoText?: string;
  className?: string;
}

export type AstryxNavHeadingStyle = CSSProperties & {
  '--astryx-wb-nav-logo-image'?: string;
};

export function showsAstryxNavSymbol(display: AstryxNavBrandDisplay): boolean {
  return display === 'symbol' || display === 'signature';
}

export function showsAstryxNavLogo(display: AstryxNavBrandDisplay): boolean {
  return display === 'logo' || display === 'signature';
}

export function normalizeAstryxNavCollapsedBrandDisplay(
  display: AstryxNavCollapsedBrandDisplayInput | undefined,
): AstryxNavCollapsedBrandDisplay | undefined {
  if (!display) return undefined;
  return display === 'menu' ? 'menu' : 'symbol';
}

export function withAstryxNavLogoImageStyle(
  style: CSSProperties | undefined,
  logoSrc: string | undefined,
): CSSProperties | undefined {
  if (!logoSrc) return style;

  return {
    ...style,
    '--astryx-wb-nav-logo-image': `url(${JSON.stringify(logoSrc)})`,
  } as AstryxNavHeadingStyle;
}

export function AstryxNavBrand({
  display = 'symbol',
  collapsedDisplay,
  symbolIcon = 'component',
  symbolSrc,
  symbolAlt = '',
  logoSrc,
  logoAlt = '',
  logoText = '',
  className,
}: AstryxNavBrandProps) {
  const effectiveCollapsedDisplay = normalizeAstryxNavCollapsedBrandDisplay(collapsedDisplay);
  const expandedContent = renderBrandContent({
    display,
    logoAlt,
    logoSrc,
    logoText,
    symbolAlt,
    symbolIcon,
    symbolSrc,
  });
  const collapsedContent = effectiveCollapsedDisplay
    ? renderCollapsedBrandContent({
        display: effectiveCollapsedDisplay,
        logoAlt,
        logoSrc,
        logoText,
        symbolAlt,
        symbolIcon,
        symbolSrc,
      })
    : null;

  if (!expandedContent && !collapsedContent) return null;

  return (
    <span
      className={cx('astryx-navicon', 'astryx-wb-nav-brand', className)}
      data-astryx-wb-brand-collapsed-empty={collapsedContent ? 'false' : 'true'}
      data-astryx-wb-brand-display={display}
      data-astryx-wb-brand-expanded-empty={expandedContent ? 'false' : 'true'}
      data-astryx-wb-collapsed-brand-display={effectiveCollapsedDisplay}
    >
      {expandedContent ? <span className="astryx-wb-nav-brand-expanded">{expandedContent}</span> : null}
      {collapsedContent ? <span className="astryx-wb-nav-brand-collapsed">{collapsedContent}</span> : null}
    </span>
  );
}

export function hasAstryxNavBrandContent({
  display = 'symbol',
  collapsedDisplay,
  symbolIcon = 'component',
  symbolSrc,
  logoSrc,
  logoText = '',
}: AstryxNavBrandProps): boolean {
  const effectiveCollapsedDisplay = normalizeAstryxNavCollapsedBrandDisplay(collapsedDisplay);
  const hasSymbol = Boolean(symbolSrc) || symbolIcon !== 'none';
  const hasLogo = Boolean(logoSrc) || Boolean(logoText);
  return hasDisplayContent(display, hasSymbol, hasLogo) || hasCollapsedDisplayContent(effectiveCollapsedDisplay, hasSymbol);
}

interface BrandContentInput {
  display: AstryxNavBrandDisplay;
  symbolIcon: AstryxNavBrandIcon;
  symbolSrc?: string;
  symbolAlt: string;
  logoSrc?: string;
  logoAlt: string;
  logoText: string;
}

interface CollapsedBrandContentInput extends Omit<BrandContentInput, 'display'> {
  display: AstryxNavCollapsedBrandDisplay;
}

function renderBrandContent(input: BrandContentInput): ReactNode {
  if (input.display === 'none') return null;
  if (input.display === 'symbol') return renderSymbol(input);
  if (input.display === 'logo') return renderLogo(input);
  return (
    <>
      {renderSymbol(input)}
      {renderLogo(input)}
    </>
  );
}

function renderCollapsedBrandContent(input: CollapsedBrandContentInput): ReactNode {
  if (input.display === 'menu') {
    return (
      <span className="astryx-wb-nav-brand-menu" aria-hidden="true">
        <AstryxIcon icon="menu" size="sm" />
      </span>
    );
  }
  return renderSymbol(input);
}

function hasDisplayContent(display: AstryxNavBrandDisplay, hasSymbol: boolean, hasLogo: boolean): boolean {
  if (display === 'none') return false;
  if (display === 'symbol') return hasSymbol;
  if (display === 'logo') return hasLogo;
  return hasSymbol || hasLogo;
}

function hasCollapsedDisplayContent(
  display: AstryxNavCollapsedBrandDisplay | undefined,
  hasSymbol: boolean,
): boolean {
  if (!display) return false;
  if (display === 'menu') return true;
  return hasSymbol;
}

function renderSymbol({
  symbolAlt,
  symbolIcon,
  symbolSrc,
}: Pick<BrandContentInput, 'symbolAlt' | 'symbolIcon' | 'symbolSrc'>): ReactNode {
  if (symbolSrc) {
    return (
      <span className="astryx-wb-nav-brand-symbol">
        <img alt={symbolAlt} src={symbolSrc} />
      </span>
    );
  }

  if (symbolIcon === 'none') return null;

  return (
    <span className="astryx-wb-nav-brand-symbol" aria-hidden="true">
      <AstryxIcon icon={symbolIcon} size="sm" />
    </span>
  );
}

function renderLogo({
  logoAlt,
  logoSrc,
  logoText,
}: Pick<BrandContentInput, 'logoAlt' | 'logoSrc' | 'logoText'>): ReactNode {
  if (logoSrc) {
    return (
      <span className="astryx-wb-nav-brand-logo">
        <img alt={logoAlt} src={logoSrc} />
      </span>
    );
  }

  if (!logoText) return null;

  return <span className="astryx-wb-nav-brand-logo">{logoText}</span>;
}
