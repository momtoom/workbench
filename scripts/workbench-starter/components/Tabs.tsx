import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import './local.css';

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'> & {
  children?: ReactNode;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

export type TabsListProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  activateOnFocus?: boolean;
  children?: ReactNode;
  className?: string;
};

export type TabsTriggerProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'value'> & {
  children?: ReactNode;
  className?: string;
  value?: string;
};

export type TabsContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  children?: ReactNode;
  className?: string;
  value?: string;
};

export function Tabs({
  children,
  className = '',
  defaultValue = 'account',
  onValueChange,
  value,
  ...props
}: TabsProps) {
  return (
    <BaseTabs.Root
      {...props}
      className={['wb-tabs', className].filter(Boolean).join(' ')}
      defaultValue={defaultValue}
      onValueChange={(nextValue) => onValueChange?.(String(nextValue))}
      value={value}
    >
      {children}
    </BaseTabs.Root>
  );
}

export function TabsList({ children, className = '', ...props }: TabsListProps) {
  return (
    <BaseTabs.List {...props} className={['wb-tabs__list', className].filter(Boolean).join(' ')}>
      {children}
    </BaseTabs.List>
  );
}

export function TabsTrigger({
  children,
  className = '',
  value,
  ...props
}: TabsTriggerProps) {
  return (
    <BaseTabs.Tab
      {...props}
      className={['wb-tabs__trigger', className].filter(Boolean).join(' ')}
      value={value ?? ''}
    >
      {children}
    </BaseTabs.Tab>
  );
}

export function TabsContent({
  children,
  className = '',
  value,
  ...props
}: TabsContentProps) {
  return (
    <BaseTabs.Panel
      {...props}
      className={['wb-tabs__content', className].filter(Boolean).join(' ')}
      keepMounted
      value={value ?? ''}
    >
      {children}
    </BaseTabs.Panel>
  );
}
