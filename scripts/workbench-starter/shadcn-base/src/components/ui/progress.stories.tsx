import {
  Progress as ShadcnProgress,
  ProgressLabel,
  ProgressValue,
} from './progress';
import { asNumber, asText } from './story-utils';

type Args = {
  className?: boolean | string;
  value?: boolean | number | string;
};

const DEFAULT_PROPS = {
  value: 64,
  className: 'w-[min(22rem,100%)]',
} as const;

const meta = {
  title: 'shadcn/Base UI/Progress',
  component: ShadcnProgress,
  authoring: {
    group: 'Feedback',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    value: { control: { max: 100, min: 0, step: 1, type: 'number' } },
    className: { control: 'text' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['ProgressLabel', 'ProgressValue'],
        sourceFile: 'src/components/ui/progress.tsx',
      },
    ],
    jsxChildren: '<ProgressLabel>Progress</ProgressLabel><ProgressValue />',
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Progress = {
  name: 'Progress',
  render: (args: Args) => {
    const value = asNumber(args.value, 64, { max: 100, min: 0 });
    return (
      <ShadcnProgress className={asText(args.className, DEFAULT_PROPS.className)} value={value}>
        <ProgressLabel>Progress</ProgressLabel>
        <ProgressValue />
      </ShadcnProgress>
    );
  },
};

export const ProgressLabelStory = {
  name: 'ProgressLabel',
  sourceInsert: {
    props: {
      children: 'Progress',
    },
  },
  render: () => (
    <ShadcnProgress className="w-[min(22rem,100%)]" value={64}>
      <ProgressLabel>Progress</ProgressLabel>
      <ProgressValue />
    </ShadcnProgress>
  ),
};

export const ProgressValueStory = {
  name: 'ProgressValue',
  sourceInsert: {
    componentName: 'ProgressValue',
  },
  render: () => (
    <ShadcnProgress className="w-[min(22rem,100%)]" value={64}>
      <ProgressLabel>Progress</ProgressLabel>
      <ProgressValue />
    </ShadcnProgress>
  ),
};
