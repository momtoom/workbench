import type { ISODateString } from '@astryxdesign/core/Calendar';
import type { DateRangeInput } from '@astryxdesign/core/DateRangeInput';
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AstryxItem } from './AstryxItem';
import { cx } from './classNames';

type DateRangePreset = NonNullable<
  ComponentPropsWithoutRef<typeof DateRangeInput>['presets']
>[number];

type AstryxDateRangePresetRootProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'className'
>;

export interface AstryxDateRangePresetProps extends AstryxDateRangePresetRootProps {
  label?: string;
  start?: string;
  end?: string;
  className?: string;
}

export function AstryxDateRangePreset({
  label = 'Date range preset',
  start = '2026-07-27',
  end = '2026-08-02',
  className,
  ...rootProps
}: AstryxDateRangePresetProps) {
  return (
    <button
      {...rootProps}
      className={cx('astryx-wb-date-range-preset', className)}
      data-astryx-wb-date-range-preset
      data-end={end}
      data-start={start}
      type="button"
    >
      <AstryxItem description={`${start} – ${end}`} label={label} />
    </button>
  );
}

AstryxDateRangePreset.displayName = 'AstryxDateRangePreset';

export function collectAstryxDateRangePresets(children: ReactNode): DateRangePreset[] {
  return collectPresetElements(children)
    .map((child) => {
      const start = iso(child.props.start);
      const end = iso(child.props.end);
      if (!start || !end) return null;
      return {
        label: child.props.label?.trim() || 'Date range preset',
        getRange: () => ({ start, end }),
      };
    })
    .filter((preset): preset is DateRangePreset => preset !== null);
}

function collectPresetElements(children: ReactNode): ReactElement<AstryxDateRangePresetProps>[] {
  return Children.toArray(children)
    .map(findPresetElement)
    .filter((child): child is ReactElement<AstryxDateRangePresetProps> => child !== null);
}

function findPresetElement(node: ReactNode): ReactElement<AstryxDateRangePresetProps> | null {
  if (!isValidElement<{ children?: ReactNode }>(node)) return null;
  if (isNamedComponent(node.type, AstryxDateRangePreset, 'AstryxDateRangePreset')) {
    return node as ReactElement<AstryxDateRangePresetProps>;
  }
  for (const child of Children.toArray(node.props.children)) {
    const match = findPresetElement(child);
    if (match) return match;
  }
  return null;
}

function isNamedComponent(type: unknown, component: unknown, name: string): boolean {
  if (type === component) return true;
  const namedType = type as { displayName?: string; name?: string } | null;
  return namedType?.displayName === name || namedType?.name === name;
}

function iso(value: string | undefined): ISODateString | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? (value as ISODateString)
    : undefined;
}
