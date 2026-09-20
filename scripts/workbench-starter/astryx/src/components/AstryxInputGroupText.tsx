import { InputGroupText } from '@astryxdesign/core/InputGroup';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cx } from './classNames';

type AstryxInputGroupTextRootProps = Omit<ComponentPropsWithoutRef<typeof InputGroupText>, 'children' | 'className'>;

export interface AstryxInputGroupTextProps extends AstryxInputGroupTextRootProps {
  children?: ReactNode;
  className?: string;
}

export function AstryxInputGroupText({
  children = 'https://',
  className,
  ...rootProps
}: AstryxInputGroupTextProps) {
  return (
    <InputGroupText {...rootProps} className={cx('astryx-wb-input-group-text', className)}>
      {children}
    </InputGroupText>
  );
}
