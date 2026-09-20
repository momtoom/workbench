import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import type { ComponentPropsWithoutRef } from 'react';

export type AstryxBannerStatus = 'info' | 'warning' | 'error' | 'success';
export type AstryxBannerContainer = 'card' | 'section';

type AstryxBannerRootProps = Omit<
  ComponentPropsWithoutRef<typeof Banner>,
  | 'children'
  | 'className'
  | 'container'
  | 'defaultIsExpanded'
  | 'description'
  | 'endContent'
  | 'isDismissable'
  | 'status'
  | 'title'
>;

export interface AstryxBannerProps extends AstryxBannerRootProps {
  status?: AstryxBannerStatus;
  title?: string;
  description?: string;
  details?: string;
  actionLabel?: string;
  container?: AstryxBannerContainer;
  isDismissable?: boolean;
  defaultIsExpanded?: boolean;
  className?: string;
}

export function AstryxBanner({
  status = 'info',
  title = 'Astryx banner',
  description,
  details,
  actionLabel,
  container = 'card',
  isDismissable = false,
  defaultIsExpanded = false,
  className,
  ...rootProps
}: AstryxBannerProps) {
  return (
    <Banner
      {...rootProps}
      className={className}
      container={container}
      defaultIsExpanded={defaultIsExpanded}
      description={description}
      endContent={actionLabel ? <Button label={actionLabel} size="sm" variant="ghost" /> : undefined}
      isDismissable={isDismissable}
      status={status}
      title={title}
    >
      {details ? <p className="astryx-banner-detail">{details}</p> : undefined}
    </Banner>
  );
}
