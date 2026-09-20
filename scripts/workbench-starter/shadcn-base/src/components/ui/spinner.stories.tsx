import { Spinner as ShadcnSpinner } from './spinner';
import { asText } from './story-utils';

type Args = {
  className?: boolean | string;
};

const DEFAULT_PROPS = {
  className: 'size-4',
} as const;

const meta = {
  title: 'shadcn/Base UI/Spinner',
  component: ShadcnSpinner,
  authoring: {
    group: 'Feedback',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    className: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Spinner = {
  name: 'Spinner',
  render: (args: Args) => <ShadcnSpinner className={asText(args.className, DEFAULT_PROPS.className)} />,
};
