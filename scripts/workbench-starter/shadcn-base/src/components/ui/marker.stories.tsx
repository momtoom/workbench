import { RiInformationLine } from '@remixicon/react';
import {
  Marker as ShadcnMarker,
  MarkerContent,
  MarkerIcon,
} from './marker';
import { Spinner } from './spinner';
import { asOption } from './story-utils';

type Args = {
  variant?: boolean | string;
};

const VARIANTS = ['default', 'separator', 'border'] as const;

const DEFAULT_PROPS = {
  variant: 'separator',
} as const;

const DEFAULT_MARKER_TEXT = 'Today';

const meta = {
  title: 'shadcn/Base UI/Marker',
  component: ShadcnMarker,
  authoring: {
    group: 'Content',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['MarkerContent'],
        sourceFile: 'src/components/ui/marker.tsx',
      },
    ],
    jsxChildren: '<MarkerContent>Today</MarkerContent>',
    props: {
      variant: 'separator',
    },
  },
};
export default meta;

export const Marker = {
  name: 'Marker',
  render: (args: Args) => (
    <ShadcnMarker variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}>
      <MarkerContent>{DEFAULT_MARKER_TEXT}</MarkerContent>
    </ShadcnMarker>
  ),
};

export const MarkerWithIcon = {
  name: 'Marker + icon',
  sourceInsert: {
    imports: [
      {
        names: ['MarkerIcon', 'MarkerContent'],
        sourceFile: 'src/components/ui/marker.tsx',
      },
      {
        importSource: '@remixicon/react',
        names: ['RiInformationLine'],
      },
    ],
    jsxChildren: '<MarkerIcon><RiInformationLine /></MarkerIcon><MarkerContent>Messages are encrypted.</MarkerContent>',
    props: {
      variant: 'border',
    },
  },
  render: (args: Args) => (
    <ShadcnMarker variant={asOption(args.variant, VARIANTS, 'border')}>
      <MarkerIcon><RiInformationLine /></MarkerIcon>
      <MarkerContent>Messages are encrypted.</MarkerContent>
    </ShadcnMarker>
  ),
};

export const MarkerStatus = {
  name: 'Marker / status',
  sourceInsert: {
    imports: [
      {
        names: ['MarkerIcon', 'MarkerContent'],
        sourceFile: 'src/components/ui/marker.tsx',
      },
      {
        names: ['Spinner'],
        sourceFile: 'src/components/ui/spinner.tsx',
      },
    ],
    jsxChildren:
      '<MarkerIcon><Spinner /></MarkerIcon><MarkerContent className="shimmer">Thinking…</MarkerContent>',
    props: {
      role: 'status',
      variant: 'default',
    },
  },
  render: (args: Args) => (
    <ShadcnMarker role="status" variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}>
      <MarkerIcon><Spinner /></MarkerIcon>
      <MarkerContent className="shimmer">Thinking…</MarkerContent>
    </ShadcnMarker>
  ),
};

export const MarkerLink = {
  name: 'Marker / link',
  sourceInsert: {
    imports: [
      {
        names: ['MarkerIcon', 'MarkerContent'],
        sourceFile: 'src/components/ui/marker.tsx',
      },
      {
        importSource: '@remixicon/react',
        names: ['RiInformationLine'],
      },
    ],
    jsxChildren:
      '<a href="#"><MarkerIcon><RiInformationLine /></MarkerIcon><MarkerContent>View the pull request</MarkerContent></a>',
    props: {
      variant: 'default',
      asChild: true,
    },
  },
  render: (args: Args) => (
    <ShadcnMarker asChild variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}>
      <a href="#">
        <MarkerIcon><RiInformationLine /></MarkerIcon>
        <MarkerContent>View the pull request</MarkerContent>
      </a>
    </ShadcnMarker>
  ),
};

export const MarkerIconStory = {
  name: 'MarkerIcon',
  sourceInsert: {
    imports: [
      {
        importSource: '@remixicon/react',
        names: ['RiInformationLine'],
      },
    ],
    jsxChildren: '<RiInformationLine />',
  },
  render: () => <ShadcnMarker><MarkerIcon><RiInformationLine /></MarkerIcon><MarkerContent>Messages are encrypted.</MarkerContent></ShadcnMarker>,
};

export const MarkerContentStory = {
  name: 'MarkerContent',
  sourceInsert: {
    props: {
      children: 'Today',
    },
  },
  render: () => <ShadcnMarker><MarkerContent>Today</MarkerContent></ShadcnMarker>,
};
