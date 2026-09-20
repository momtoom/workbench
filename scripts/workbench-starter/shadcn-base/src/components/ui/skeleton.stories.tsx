import { Skeleton as ShadcnSkeleton } from './skeleton';

const meta = {
  title: 'shadcn/Base UI/Skeleton',
  component: ShadcnSkeleton,
  authoring: {
    group: 'Feedback',
  },
  sourceInsert: {
    props: {
      className: 'h-4 w-full',
    },
  },
};
export default meta;

export const Skeleton = {
  name: 'Skeleton',
  render: () => <ShadcnSkeleton className="h-4 w-[min(24rem,100%)]" />,
};
