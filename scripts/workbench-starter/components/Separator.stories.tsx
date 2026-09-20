import { Separator as WorkbenchSeparator } from './Separator';

type Args = Record<string, string>;

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  orientation: 'horizontal',
} as const;

const meta = {
  title: 'Local/Separator',
  component: WorkbenchSeparator,
  args: DEFAULT_PROPS,
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Separator = {
  name: 'Separator',
  render: (args: Args) => (
    <div className="wb-separator-demo">
      <span>Section A</span>
      <WorkbenchSeparator orientation={asOption(args.orientation, ORIENTATIONS, 'horizontal')} />
      <span>Section B</span>
    </div>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
