import { Button } from './button';
import {
  ButtonGroup as ShadcnButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from './button-group';
import { asOption } from './story-utils';

type Args = {
  orientation?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const DEFAULT_PROPS = {
  orientation: 'horizontal',
} as const;

const meta = {
  title: 'shadcn/Base UI/Button Group',
  component: ShadcnButtonGroup,
  authoring: {
    group: 'Actions',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
    ],
    jsxChildren: '<Button variant="outline">Action 1</Button><Button variant="outline">Action 2</Button>',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const ButtonGroup = {
  name: 'ButtonGroup',
  render: (args: Args) => (
    <ShadcnButtonGroup
      orientation={asOption(args.orientation, ORIENTATIONS, 'horizontal')}
    >
      <Button variant="outline">Action 1</Button>
      <Button variant="outline">Action 2</Button>
    </ShadcnButtonGroup>
  ),
};

export const ButtonGroupTextStory = {
  name: 'ButtonGroupText',
  sourceInsert: {
    props: {
      children: 'Status',
    },
  },
  render: () => (
    <ShadcnButtonGroup>
      <ButtonGroupText>Status</ButtonGroupText>
    </ShadcnButtonGroup>
  ),
};

export const ButtonGroupSeparatorStory = {
  name: 'ButtonGroupSeparator',
  args: {
    orientation: 'vertical',
  },
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  sourceInsert: {
    props: {
      orientation: 'vertical',
    },
  },
  render: (args: Args) => (
    <ShadcnButtonGroup>
      <Button>Left</Button>
      <ButtonGroupSeparator orientation={asOption(args.orientation, ORIENTATIONS, 'vertical')} />
      <Button>Right</Button>
    </ShadcnButtonGroup>
  ),
};
