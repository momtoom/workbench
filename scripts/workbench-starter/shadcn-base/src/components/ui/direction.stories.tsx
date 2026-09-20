import { DirectionProvider as ShadcnDirectionProvider } from './direction';
import { asOption } from './story-utils';

type Args = {
  direction?: boolean | string;
};

const DIRECTIONS = ['ltr', 'rtl'] as const;

const DEFAULT_PROPS = {
  direction: 'rtl',
} as const;

const meta = {
  title: 'shadcn/Base UI/Direction',
  component: ShadcnDirectionProvider,
  authoring: {
    group: 'Foundation',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    direction: { control: 'select', options: DIRECTIONS },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<div className="rounded-lg border p-4">Direction-aware content</div>',
  },
};
export default meta;

export const DirectionProvider = {
  name: 'DirectionProvider',
  render: (args: Args) => (
    <ShadcnDirectionProvider direction={asOption(args.direction, DIRECTIONS, 'rtl')}>
      <div className="w-72 rounded-lg border p-4 text-sm">
        <div className="font-medium">Direction-aware content</div>
        <p className="text-muted-foreground">Layout and keyboard behavior follow the provider direction.</p>
      </div>
    </ShadcnDirectionProvider>
  ),
};
