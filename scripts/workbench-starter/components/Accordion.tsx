import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import './local.css';

export type AccordionItemData = {
  content: ReactNode;
  title: ReactNode;
  value: string;
};

export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'> & {
  children?: ReactNode;
  className?: string;
  defaultValue?: readonly string[] | string;
  disabled?: boolean;
  items?: AccordionItemData[];
  onValueChange?: (value: string[]) => void;
};

export type AccordionItemRootProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'value'> & {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  value?: string;
};

export type AccordionHeaderRootProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  children?: ReactNode;
  className?: string;
};

export type AccordionTriggerRootProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  children?: ReactNode;
  className?: string;
};

export type AccordionContentProps = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & {
  children?: ReactNode;
  className?: string;
};

export function Accordion({
  children,
  className = '',
  defaultValue = ['item-1'],
  items = DEFAULT_ACCORDION_ITEMS,
  onValueChange,
  ...props
}: AccordionProps) {
  return (
    <BaseAccordion.Root
      {...props}
      className={['wb-accordion', className].filter(Boolean).join(' ')}
      defaultValue={normalizeAccordionDefaultValue(defaultValue)}
      multiple
      onValueChange={(value) => onValueChange?.(value.map(String))}
    >
      {children ?? items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </BaseAccordion.Root>
  );
}

export function AccordionItem({ children, className = '', value, ...props }: AccordionItemRootProps) {
  return (
    <BaseAccordion.Item
      {...props}
      className={['wb-accordion__item', className].filter(Boolean).join(' ')}
      value={value}
    >
      {children}
    </BaseAccordion.Item>
  );
}

export function AccordionHeader({ children, className = '', ...props }: AccordionHeaderRootProps) {
  return (
    <BaseAccordion.Header {...props} className={['wb-accordion__title', className].filter(Boolean).join(' ')}>
      {children}
    </BaseAccordion.Header>
  );
}

export function AccordionTrigger({ children, className = '', type = 'button', ...props }: AccordionTriggerRootProps) {
  return (
    <BaseAccordion.Trigger
      {...props}
      className={['wb-accordion__trigger', className].filter(Boolean).join(' ')}
      type={type}
    >
      <span>{children}</span>
      <Icon className="wb-accordion__icon" name="chevron-down" size={16} />
    </BaseAccordion.Trigger>
  );
}

export function AccordionContent({ children, className = '', ...props }: AccordionContentProps) {
  return (
    <BaseAccordion.Panel
      {...props}
      className={['wb-accordion__content', className].filter(Boolean).join(' ')}
      keepMounted
    >
      <div className="wb-accordion__content-inner">{children}</div>
    </BaseAccordion.Panel>
  );
}

const DEFAULT_ACCORDION_ITEMS: AccordionItemData[] = [
  {
    value: 'item-1',
    title: 'Component contract',
    content: 'Expose semantic props and keep visual styling in token-backed CSS.',
  },
  {
    value: 'item-2',
    title: 'Preview behavior',
    content: 'Render Base UI primitives inside Workbench-owned wrapper components.',
  },
];

function normalizeAccordionDefaultValue(value: readonly string[] | string): string[] {
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [...value];
}
