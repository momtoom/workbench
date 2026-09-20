import { Avatar as WorkbenchAvatar } from './Avatar';

const SIZES = ['sm', 'md', 'lg'] as const;

const DEFAULT_PROPS = {
  fallback: 'WB',
  imageAlt: '',
  imageSrc: '',
  size: 'md',
} as const;

const meta = {
  title: 'Local/Avatar',
  component: WorkbenchAvatar,
  args: DEFAULT_PROPS,
  argTypes: {
    fallback: { control: 'text' },
    imageAlt: { control: 'text' },
    imageSrc: { control: 'text' },
    size: { control: 'select', options: SIZES },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Avatar = {
  name: 'Avatar',
  render: (args: typeof DEFAULT_PROPS) => <WorkbenchAvatar {...args} />,
};
