import { SideNavHeading } from '@astryxdesign/core/SideNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { AstryxIconValue } from './AstryxIcon';
import {
  AstryxNavBrand,
  hasAstryxNavBrandContent,
  showsAstryxNavLogo,
  showsAstryxNavSymbol,
  type AstryxNavBrandDisplay,
  type AstryxNavCollapsedBrandDisplay,
  type AstryxNavCollapsedBrandDisplayInput,
  withAstryxNavLogoImageStyle,
} from './AstryxNavBrand';
import { cx } from './classNames';

export type AstryxSideNavHeadingIcon = AstryxIconValue | 'none';

type AstryxSideNavHeadingRootProps = Omit<
  ComponentPropsWithoutRef<typeof SideNavHeading>,
  | 'className'
  | 'headerEndContent'
  | 'heading'
  | 'headingHref'
  | 'icon'
  | 'menu'
  | 'subheading'
  | 'subheadingHref'
  | 'superheading'
  | 'superheadingHref'
>;

export interface AstryxSideNavHeadingProps extends AstryxSideNavHeadingRootProps {
  heading?: string;
  headingHref?: string;
  superheading?: string;
  superheadingHref?: string;
  subheading?: string;
  subheadingHref?: string;
  icon?: AstryxSideNavHeadingIcon;
  brandDisplay?: AstryxNavBrandDisplay;
  collapsedBrandDisplay?: AstryxNavCollapsedBrandDisplayInput;
  symbolIcon?: AstryxSideNavHeadingIcon;
  symbolSrc?: string;
  symbolAlt?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoText?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxSideNavHeading({
  heading = 'Astryx',
  headingHref = '#',
  superheading,
  superheadingHref,
  subheading,
  subheadingHref,
  icon = 'component',
  brandDisplay = 'signature',
  collapsedBrandDisplay = 'symbol',
  symbolIcon,
  symbolSrc,
  symbolAlt = '',
  logoSrc,
  logoAlt = '',
  logoText = '',
  className,
  children,
  style,
  ...rootProps
}: AstryxSideNavHeadingProps) {
  const showSymbol = showsAstryxNavSymbol(brandDisplay);
  const showLogo = showsAstryxNavLogo(brandDisplay);
  const visibleHeading = showLogo ? logoText || heading : heading;
  const hasLogoImage = showLogo && Boolean(logoSrc);
  const brandProps = {
    collapsedDisplay: collapsedBrandDisplay,
    display: showSymbol ? 'symbol' : 'none',
    logoAlt,
    logoSrc,
    logoText,
    symbolAlt,
    symbolIcon: symbolIcon ?? icon,
    symbolSrc,
  } satisfies Parameters<typeof hasAstryxNavBrandContent>[0];
  const brand = hasAstryxNavBrandContent(brandProps) ? <AstryxNavBrand {...brandProps} /> : undefined;
  const rootStyle = withAstryxNavLogoImageStyle(style, hasLogoImage ? logoSrc : undefined);

  return (
    <SideNavHeading
      {...rootProps}
      className={cx('astryx-wb-side-nav-heading', className)}
      data-astryx-wb-nav-heading-logo={showLogo ? 'true' : 'false'}
      data-astryx-wb-nav-heading-logo-image={hasLogoImage ? 'true' : 'false'}
      data-astryx-wb-nav-heading-symbol={showSymbol ? 'true' : 'false'}
      heading={visibleHeading}
      headingHref={headingHref || undefined}
      headerEndContent={children}
      icon={brand}
      style={rootStyle}
      subheading={!hasLogoImage && showLogo ? subheading || undefined : undefined}
      subheadingHref={subheadingHref || undefined}
      superheading={!hasLogoImage && showLogo ? superheading || undefined : undefined}
      superheadingHref={superheadingHref || undefined}
    />
  );
}

AstryxSideNavHeading.displayName = 'AstryxSideNavHeading';
