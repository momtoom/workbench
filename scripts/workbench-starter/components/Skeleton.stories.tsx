import { Skeleton as WorkbenchSkeleton } from './Skeleton';

type Args = Record<string, string>;

const DEFAULT_PROPS = {
  width: '280px',
  height: '20px',
} as const;

const meta = {
  title: 'Local/Skeleton',
  component: WorkbenchSkeleton,
  args: DEFAULT_PROPS,
  argTypes: {
    width: { control: 'text' },
    height: { control: 'text' },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Skeleton = {
  name: 'Skeleton',
  render: (args: Args) => (
    <div className="wb-stack">
      <WorkbenchSkeleton width={asText(args.width, '280px')} height={asText(args.height, '20px')} />
      <WorkbenchSkeleton width="220px" height="20px" />
    </div>
  ),
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
