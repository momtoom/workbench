import { AstryxAvatar } from './AstryxAvatar';
import { AstryxAvatarGroup as AstryxAvatarGroupComponent } from './AstryxAvatarGroup';

type Args = Record<string, string>;

const SIZES = ['xsm', 'sm', 'md', 'lg', 'xl'] as const;

const DEFAULT_PROPS = {
  size: 'md',
} as const;

const meta = {
  title: 'Astryx/AvatarGroup',
  component: AstryxAvatarGroupComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    size: { control: 'select', options: SIZES },
  },
  authoring: {
    allowedChildren: ['AstryxAvatar'],
    group: 'Media',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxAvatar'],
        sourceFile: 'src/components/AstryxAvatar.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxAvatar name="Ada Lovelace" status="success" />\n<AstryxAvatar name="Grace Hopper" status="neutral" />\n<AstryxAvatar name="Katherine Johnson" status="error" />',
  },
};
export default meta;

export const AstryxAvatarGroup = {
  name: 'AstryxAvatarGroup',
  render: (args: Args) => (
    <AstryxAvatarGroupComponent size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}>
      <AstryxAvatar name="Ada Lovelace" status="success" />
      <AstryxAvatar name="Grace Hopper" status="neutral" />
      <AstryxAvatar name="Katherine Johnson" status="error" />
    </AstryxAvatarGroupComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
