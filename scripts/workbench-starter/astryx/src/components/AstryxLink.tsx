import { Link } from '@astryxdesign/core/Link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type AstryxLinkType = 'body' | 'large' | 'label' | 'supporting' | 'code' | 'inherit';
export type AstryxLinkColor = 'primary' | 'secondary' | 'disabled' | 'placeholder' | 'accent' | 'inherit';
export type AstryxLinkWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type AstryxLinkDisplay = 'inline' | 'block';

type AstryxLinkRootProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  | 'children'
  | 'className'
  | 'color'
  | 'display'
  | 'hasUnderline'
  | 'href'
  | 'isDisabled'
  | 'isExternalLink'
  | 'isStandalone'
  | 'label'
  | 'maxLines'
  | 'tooltip'
  | 'type'
  | 'weight'
>;

export interface AstryxLinkProps extends AstryxLinkRootProps {
  children?: ReactNode;
  href?: string;
  label?: string;
  type?: AstryxLinkType;
  color?: AstryxLinkColor;
  weight?: AstryxLinkWeight;
  display?: AstryxLinkDisplay;
  maxLines?: number;
  hasUnderline?: boolean;
  isExternalLink?: boolean;
  isStandalone?: boolean;
  isDisabled?: boolean;
  tooltip?: string;
  className?: string;
}

export function AstryxLink({
  children = 'Astryx documentation',
  href = 'https://astryx.atmeta.com',
  label,
  type = 'body',
  color = 'accent',
  weight,
  display = 'inline',
  maxLines = 0,
  hasUnderline = false,
  isExternalLink = true,
  isStandalone = false,
  isDisabled = false,
  tooltip,
  className,
  ...rootProps
}: AstryxLinkProps) {
  return (
    <Link
      {...rootProps}
      className={className}
      color={color}
      display={display}
      hasUnderline={hasUnderline}
      href={href}
      isDisabled={isDisabled}
      isExternalLink={isExternalLink}
      isStandalone={isStandalone}
      label={label || undefined}
      maxLines={maxLines}
      tooltip={tooltip || undefined}
      type={type}
      weight={weight}
    >
      {children}
    </Link>
  );
}
