import { RiBold } from '@remixicon/react';
import { Toggle as ShadcnToggle } from './toggle';
import { asBoolean, asOption } from './story-utils';

type Args = {
  defaultPressed?: boolean | string;
  size?: boolean | string;
  variant?: boolean | string;
};

const SIZES = ['default', 'sm', 'lg'] as const;
const VARIANTS = ['default', 'outline'] as const;

const DEFAULT_PROPS = {
  variant: 'outline',
  size: 'default',
  defaultPressed: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Toggle',
  component: ShadcnToggle,
  authoring: {
    group: 'Actions',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    defaultPressed: { control: 'boolean' },
  },
  sourceInsert: {
    imports: [{ importSource: '@remixicon/react', names: ['RiBold'] }],
    jsxChildren: '<><RiBold aria-hidden="true" data-icon="inline-start" />Bold</>',
    props: {
      variant: 'outline',
      size: 'default',
      defaultPressed: true,
    },
  },
};
export default meta;

export const Toggle = {
  name: 'Toggle',
  render: (args: Args) => (
    <ShadcnToggle
      key={String(asBoolean(args.defaultPressed, true))}
      defaultPressed={asBoolean(args.defaultPressed, true)}
      size={asOption(args.size, SIZES, 'default')}
      variant={asOption(args.variant, VARIANTS, 'outline')}
    >
      <RiBold />
      Bold
    </ShadcnToggle>
  ),
};
