import { Separator as ShadcnSeparator } from './separator';
import { asOption } from './story-utils';

type Args = {
  orientation?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  orientation: 'horizontal',
} as const;

const meta = {
  title: 'shadcn/Base UI/Separator',
  component: ShadcnSeparator,
  authoring: {
    group: 'Layout',
  },
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
  render: (args: Args) => {
    const orientation = asOption(args.orientation, ORIENTATIONS, 'horizontal');
    return (
      <div className={orientation === 'vertical' ? 'flex h-20 items-stretch' : 'w-[min(22rem,100%)]'}>
        <ShadcnSeparator orientation={orientation} />
      </div>
    );
  },
};
