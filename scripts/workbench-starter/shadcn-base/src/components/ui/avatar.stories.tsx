import {
  Avatar as ShadcnAvatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from './avatar';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  alt?: boolean | string;
  avatar1Alt?: boolean | string;
  avatar1Badge?: boolean | string;
  avatar1BadgeIcon?: boolean | string;
  avatar1BadgeText?: boolean | string;
  avatar1Fallback?: boolean | string;
  avatar1Src?: boolean | string;
  avatar2Alt?: boolean | string;
  avatar2Badge?: boolean | string;
  avatar2BadgeIcon?: boolean | string;
  avatar2BadgeText?: boolean | string;
  avatar2Fallback?: boolean | string;
  avatar2Src?: boolean | string;
  avatar3Alt?: boolean | string;
  avatar3Badge?: boolean | string;
  avatar3BadgeIcon?: boolean | string;
  avatar3BadgeText?: boolean | string;
  avatar3Fallback?: boolean | string;
  avatar3Src?: boolean | string;
  badge?: boolean | string;
  badgeIcon?: boolean | string;
  badgeText?: boolean | string;
  children?: boolean | string;
  className?: boolean | string;
  count?: boolean | number | string;
  fallback?: boolean | string;
  showCount?: boolean | string;
  size?: boolean | string;
  src?: boolean | string;
};

const SIZES = ['default', 'sm', 'lg'] as const;
const BADGES = ['none', 'dot', 'number', 'icon'] as const;

const DEFAULT_IMAGE_SRC = 'https://github.com/shadcn.png';
const DEFAULT_IMAGE_ALT = '@shadcn';
const DEFAULT_FALLBACK = 'CN';

const DEFAULT_PROPS = {
  src: DEFAULT_IMAGE_SRC,
  alt: DEFAULT_IMAGE_ALT,
  badge: 'none',
  badgeText: '1',
  size: 'default',
  badgeIcon: 'check',
  fallback: DEFAULT_FALLBACK,
} as const;

const DEFAULT_GROUP_PROPS = {
  count: 3,
  size: 'default',
  avatar1Alt: '@shadcn',
  avatar1Badge: 'none',
  avatar1BadgeIcon: 'check',
  avatar1BadgeText: '1',
  avatar1Fallback: 'CN',
  avatar1Src: DEFAULT_IMAGE_SRC,
  avatar2Alt: '@leerob',
  avatar2Badge: 'none',
  avatar2BadgeIcon: 'check',
  avatar2BadgeText: '1',
  avatar2Fallback: 'LR',
  avatar2Src: 'https://github.com/leerob.png',
  avatar3Alt: '',
  avatar3Badge: 'none',
  avatar3BadgeIcon: 'check',
  avatar3BadgeText: '1',
  avatar3Fallback: 'ER',
  avatar3Src: '',
  showCount: true,
} as const;

const AVATAR_ARG_TYPES = {
  src: { control: 'text' },
  alt: { control: 'text' },
  badge: { control: 'select', options: BADGES },
  badgeText: { control: 'text' },
  size: { control: 'select', options: SIZES },
  badgeIcon: { control: 'icon' },
  className: { control: 'text' },
  fallback: { control: 'text' },
};

const AVATAR_GROUP_ARG_TYPES = {
  count: { control: { type: 'number', min: 0, max: 99, step: 1 } },
  size: { control: 'select', options: SIZES },
  avatar1Alt: { control: 'text' },
  avatar1Badge: { control: 'select', options: BADGES },
  avatar1BadgeIcon: { control: 'icon' },
  avatar1BadgeText: { control: 'text' },
  avatar1Fallback: { control: 'text' },
  avatar1Src: { control: 'text' },
  avatar2Alt: { control: 'text' },
  avatar2Badge: { control: 'select', options: BADGES },
  avatar2BadgeIcon: { control: 'icon' },
  avatar2BadgeText: { control: 'text' },
  avatar2Fallback: { control: 'text' },
  avatar2Src: { control: 'text' },
  avatar3Alt: { control: 'text' },
  avatar3Badge: { control: 'select', options: BADGES },
  avatar3BadgeIcon: { control: 'icon' },
  avatar3BadgeText: { control: 'text' },
  avatar3Fallback: { control: 'text' },
  avatar3Src: { control: 'text' },
  className: { control: 'text' },
  showCount: { control: 'boolean' },
};

const meta = {
  title: 'shadcn/Base UI/Avatar',
  component: ShadcnAvatar,
  authoring: {
    group: 'Media',
  },
  args: DEFAULT_PROPS,
  argTypes: AVATAR_ARG_TYPES,
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
    },
  },
};
export default meta;

export const Avatar = {
  name: 'Avatar',
  render: (args: Args) => renderAvatar(args),
};

export const AvatarWithBadge = {
  name: 'Avatar + badge',
  args: {
    ...DEFAULT_PROPS,
    badge: 'dot',
  },
  argTypes: AVATAR_ARG_TYPES,
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
      badge: 'dot',
    },
  },
  render: (args: Args) => renderAvatar(args, { ...DEFAULT_PROPS, badge: 'dot' }),
};

export const AvatarNumberBadge = {
  name: 'Avatar + number badge',
  args: {
    ...DEFAULT_PROPS,
    badge: 'number',
    badgeText: '3',
  },
  argTypes: AVATAR_ARG_TYPES,
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
      badge: 'number',
      badgeText: '3',
    },
  },
  render: (args: Args) => renderAvatar(args, { ...DEFAULT_PROPS, badge: 'number', badgeText: '3' }),
};

export const AvatarIconBadge = {
  name: 'Avatar + icon badge',
  args: {
    ...DEFAULT_PROPS,
    badge: 'icon',
    badgeIcon: 'check',
  },
  argTypes: AVATAR_ARG_TYPES,
  sourceInsert: {
    props: {
      ...DEFAULT_PROPS,
      badge: 'icon',
      badgeIcon: 'check',
    },
  },
  render: (args: Args) => renderAvatar(args, { ...DEFAULT_PROPS, badge: 'icon', badgeIcon: 'check' }),
};

export const AvatarImageStory = {
  name: 'AvatarImage',
  args: {
    src: DEFAULT_IMAGE_SRC,
    alt: DEFAULT_IMAGE_ALT,
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
  },
  sourceInsert: {
    props: {
      src: DEFAULT_IMAGE_SRC,
      alt: DEFAULT_IMAGE_ALT,
    },
  },
  render: (args: Args) => (
    <ShadcnAvatar>
      <AvatarImage alt={asText(args.alt, DEFAULT_IMAGE_ALT)} src={asText(args.src, DEFAULT_IMAGE_SRC)} />
      <AvatarFallback>{DEFAULT_FALLBACK}</AvatarFallback>
    </ShadcnAvatar>
  ),
};

export const AvatarFallbackStory = {
  name: 'AvatarFallback',
  sourceInsert: {
    props: {
      children: DEFAULT_FALLBACK,
    },
  },
  render: () => (
    <ShadcnAvatar>
      <AvatarFallback>{DEFAULT_FALLBACK}</AvatarFallback>
    </ShadcnAvatar>
  ),
};

export const AvatarBadgeStory = {
  name: 'AvatarBadge',
  args: {
    badge: 'dot',
  },
  argTypes: {
    badge: { control: 'select', options: ['dot', 'number', 'icon'] },
  },
  sourceInsert: {
    props: {
      badge: 'dot',
    },
  },
  render: (args: Args) => (
    <ShadcnAvatar src={DEFAULT_IMAGE_SRC} fallback={DEFAULT_FALLBACK}>
      <AvatarBadge badge={asOption(args.badge, ['dot', 'number', 'icon'] as const, 'dot')} />
    </ShadcnAvatar>
  ),
};

export const AvatarGroupStory = {
  name: 'AvatarGroup',
  args: DEFAULT_GROUP_PROPS,
  argTypes: AVATAR_GROUP_ARG_TYPES,
  sourceInsert: {
    props: {
      ...DEFAULT_GROUP_PROPS,
    },
  },
  render: (args: Args) => renderAvatarGroup(args),
};

export const AvatarGroupCountStory = {
  name: 'AvatarGroupCount',
  args: {
    children: '+3',
  },
  argTypes: {
    children: { control: 'text' },
  },
  sourceInsert: {
    props: {
      children: '+3',
    },
  },
  render: (args: Args) => (
    <AvatarGroup>
      <ShadcnAvatar src={DEFAULT_IMAGE_SRC} fallback={DEFAULT_FALLBACK} />
      <ShadcnAvatar fallback="LR" />
      <AvatarGroupCount>{asText(args.children, '+3')}</AvatarGroupCount>
    </AvatarGroup>
  ),
};

function renderAvatar(args: Args, defaults = DEFAULT_PROPS) {
  return (
    <ShadcnAvatar
      alt={asText(args.alt, defaults.alt)}
      badge={asOption(args.badge, BADGES, defaults.badge)}
      badgeIcon={asText(args.badgeIcon, defaults.badgeIcon)}
      badgeText={asText(args.badgeText, defaults.badgeText)}
      className={asText(args.className)}
      fallback={asText(args.fallback, defaults.fallback)}
      size={asOption(args.size, SIZES, defaults.size)}
      src={asText(args.src, defaults.src)}
    />
  );
}

function renderAvatarGroup(args: Args) {
  return (
    <AvatarGroup
      avatar1Alt={asText(args.avatar1Alt, DEFAULT_GROUP_PROPS.avatar1Alt)}
      avatar1Badge={asOption(args.avatar1Badge, BADGES, DEFAULT_GROUP_PROPS.avatar1Badge)}
      avatar1BadgeIcon={asText(args.avatar1BadgeIcon, DEFAULT_GROUP_PROPS.avatar1BadgeIcon)}
      avatar1BadgeText={asText(args.avatar1BadgeText, DEFAULT_GROUP_PROPS.avatar1BadgeText)}
      avatar1Fallback={asText(args.avatar1Fallback, DEFAULT_GROUP_PROPS.avatar1Fallback)}
      avatar1Src={asText(args.avatar1Src, DEFAULT_GROUP_PROPS.avatar1Src)}
      avatar2Alt={asText(args.avatar2Alt, DEFAULT_GROUP_PROPS.avatar2Alt)}
      avatar2Badge={asOption(args.avatar2Badge, BADGES, DEFAULT_GROUP_PROPS.avatar2Badge)}
      avatar2BadgeIcon={asText(args.avatar2BadgeIcon, DEFAULT_GROUP_PROPS.avatar2BadgeIcon)}
      avatar2BadgeText={asText(args.avatar2BadgeText, DEFAULT_GROUP_PROPS.avatar2BadgeText)}
      avatar2Fallback={asText(args.avatar2Fallback, DEFAULT_GROUP_PROPS.avatar2Fallback)}
      avatar2Src={asText(args.avatar2Src, DEFAULT_GROUP_PROPS.avatar2Src)}
      avatar3Alt={asText(args.avatar3Alt, DEFAULT_GROUP_PROPS.avatar3Alt)}
      avatar3Badge={asOption(args.avatar3Badge, BADGES, DEFAULT_GROUP_PROPS.avatar3Badge)}
      avatar3BadgeIcon={asText(args.avatar3BadgeIcon, DEFAULT_GROUP_PROPS.avatar3BadgeIcon)}
      avatar3BadgeText={asText(args.avatar3BadgeText, DEFAULT_GROUP_PROPS.avatar3BadgeText)}
      avatar3Fallback={asText(args.avatar3Fallback, DEFAULT_GROUP_PROPS.avatar3Fallback)}
      avatar3Src={asText(args.avatar3Src, DEFAULT_GROUP_PROPS.avatar3Src)}
      className={asText(args.className)}
      count={asNumber(args.count, DEFAULT_GROUP_PROPS.count, { min: 0, max: 99 })}
      showCount={asBoolean(args.showCount, DEFAULT_GROUP_PROPS.showCount)}
      size={asOption(args.size, SIZES, DEFAULT_GROUP_PROPS.size)}
    />
  );
}
