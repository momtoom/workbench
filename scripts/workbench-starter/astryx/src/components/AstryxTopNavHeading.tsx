import { TopNavHeading } from '@astryxdesign/core/TopNav';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import type { AstryxIconValue } from './AstryxIcon';
import {
  AstryxNavBrand,
  hasAstryxNavBrandContent,
  showsAstryxNavLogo,
  showsAstryxNavSymbol,
  type AstryxNavBrandDisplay,
  withAstryxNavLogoImageStyle,
} from './AstryxNavBrand';
import { cx } from './classNames';

export type AstryxTopNavHeadingIcon = AstryxIconValue | 'none';

type AstryxTopNavHeadingRootProps = Omit<
  ComponentPropsWithoutRef<typeof TopNavHeading>,
  | 'className'
  | 'headerEndContent'
  | 'heading'
  | 'headingHref'
  | 'href'
  | 'logo'
  | 'menu'
  | 'subheading'
  | 'subheadingHref'
  | 'superheading'
  | 'superheadingHref'
>;

export interface AstryxTopNavHeadingProps extends AstryxTopNavHeadingRootProps {
  heading?: string;
  headingHref?: string;
  superheading?: string;
  superheadingHref?: string;
  subheading?: string;
  subheadingHref?: string;
  icon?: AstryxTopNavHeadingIcon;
  brandDisplay?: AstryxNavBrandDisplay;
  symbolIcon?: AstryxTopNavHeadingIcon;
  symbolSrc?: string;
  symbolAlt?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoText?: string;
  className?: string;
  children?: ReactNode;
}

export function AstryxTopNavHeading({
  heading = 'Astryx',
  headingHref = '#',
  superheading,
  superheadingHref,
  subheading,
  subheadingHref,
  icon = 'component',
  brandDisplay = 'signature',
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
}: AstryxTopNavHeadingProps) {
  const showSymbol = showsAstryxNavSymbol(brandDisplay);
  const showLogo = showsAstryxNavLogo(brandDisplay);
  const visibleHeading = showLogo ? logoText || heading : heading;
  const hasLogoImage = showLogo && Boolean(logoSrc);
  const brandProps = {
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
    <TopNavHeading
      {...rootProps}
      className={cx('astryx-wb-top-nav-heading', className)}
      data-astryx-wb-nav-heading-logo={showLogo ? 'true' : 'false'}
      data-astryx-wb-nav-heading-logo-image={hasLogoImage ? 'true' : 'false'}
      data-astryx-wb-nav-heading-symbol={showSymbol ? 'true' : 'false'}
      heading={visibleHeading}
      headingHref={headingHref || undefined}
      headerEndContent={children}
      logo={brand}
      style={rootStyle}
      subheading={!hasLogoImage && showLogo ? subheading || undefined : undefined}
      subheadingHref={subheadingHref || undefined}
      superheading={!hasLogoImage && showLogo ? superheading || undefined : undefined}
      superheadingHref={superheadingHref || undefined}
    />
  );
}

AstryxTopNavHeading.displayName = 'AstryxTopNavHeading';
