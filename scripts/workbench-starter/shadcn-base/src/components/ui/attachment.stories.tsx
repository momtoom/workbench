import {
  Attachment as ShadcnAttachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from './attachment';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  actionIconName?: boolean | number | string;
  fileMeta?: boolean | number | string;
  fileName?: boolean | number | string;
  gap?: boolean | string;
  iconName?: boolean | string;
  imageAlt?: boolean | string;
  imageSrc?: boolean | string;
  layout?: boolean | string;
  mediaVariant?: boolean | number | string;
  orientation?: boolean | string;
  progress?: boolean | number | string;
  showAction?: boolean | string;
  size?: boolean | string;
  snap?: boolean | string;
  state?: boolean | string;
  statusText?: boolean | number | string;
  variant?: boolean | string;
};

const GROUP_GAPS = ['sm', 'md', 'lg'] as const;
const GROUP_LAYOUTS = ['scroll', 'wrap', 'stack'] as const;
const MEDIA_VARIANTS = ['icon', 'image'] as const;
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const SIZES = ['default', 'sm', 'xs'] as const;
const STATES = ['idle', 'uploading', 'processing', 'error', 'done'] as const;
const DEFAULT_IMAGE_SRC = 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80';

const DEFAULT_PROPS = {
  progress: 64,
  state: 'done',
  orientation: 'horizontal',
  size: 'default',
  actionIconName: 'x',
  fileMeta: 'PDF · 2.4 MB',
  fileName: 'sales-report.pdf',
  iconName: 'file-text',
  imageAlt: 'Workspace reference',
  imageSrc: DEFAULT_IMAGE_SRC,
  mediaVariant: 'icon',
  showAction: true,
  statusText: '',
} as const;

const GROUP_PROPS = {
  layout: 'scroll',
  gap: 'md',
  snap: true,
} as const;

const meta = {
  title: 'shadcn/Base UI/Attachment',
  component: ShadcnAttachment,
  authoring: {
    group: 'Content',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    progress: {
      control: { max: 100, min: 0, step: 1, type: 'number' },
      groupId: 'state',
      groupLabel: 'State',
      groupOrder: 20,
      name: 'Upload progress',
      order: 40,
      when: { key: 'state', value: 'uploading' },
    },
    state: { control: 'select', groupId: 'state', groupLabel: 'State', groupOrder: 20, options: STATES, order: 30 },
    orientation: { control: 'select', groupId: 'layout', groupLabel: 'Layout', groupOrder: 10, options: ORIENTATIONS, order: 10 },
    size: { control: 'select', groupId: 'layout', groupLabel: 'Layout', groupOrder: 10, options: SIZES, order: 20, when: { key: 'orientation', value: 'horizontal' } },
    actionIconName: { control: 'icon', groupId: 'actions', groupLabel: 'Actions', groupOrder: 50, name: 'Action icon', order: 130, when: { key: 'showAction', value: true } },
    fileMeta: { control: 'text', groupId: 'content', groupLabel: 'Content', groupOrder: 30, name: 'File meta', order: 70 },
    fileName: { control: 'text', groupId: 'content', groupLabel: 'Content', groupOrder: 30, name: 'File name', order: 60 },
    iconName: { control: 'icon', groupId: 'media', groupLabel: 'Media', groupOrder: 40, name: 'Icon', order: 90, when: { key: 'mediaVariant', value: 'icon' } },
    imageAlt: { control: 'text', groupId: 'media', groupLabel: 'Media', groupOrder: 40, name: 'Image alt', order: 110, when: { key: 'mediaVariant', value: 'image' } },
    imageSrc: {
      assetKinds: ['image'],
      control: 'text',
      groupId: 'media',
      groupLabel: 'Media',
      groupOrder: 40,
      name: 'Image source',
      order: 100,
      picker: 'asset-token',
      tokenTypes: ['string'],
      when: { key: 'mediaVariant', value: 'image' },
    },
    mediaVariant: { control: 'select', groupId: 'media', groupLabel: 'Media', groupOrder: 40, name: 'Media type', options: MEDIA_VARIANTS, order: 80 },
    showAction: { control: 'boolean', groupId: 'actions', groupLabel: 'Actions', groupOrder: 50, name: 'Show action', order: 120 },
    statusText: {
      control: 'text',
      groupId: 'state',
      groupLabel: 'State',
      groupOrder: 20,
      name: 'Status text',
      order: 50,
      when: { key: 'state', value: ['idle', 'uploading', 'processing', 'error'] },
    },
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const Attachment = {
  name: 'Attachment',
  render: (args: Args) => {
    const state = asOption(args.state, STATES, DEFAULT_PROPS.state);
    const mediaVariant = asOption(args.mediaVariant, MEDIA_VARIANTS, DEFAULT_PROPS.mediaVariant);
    return (
      <ShadcnAttachment
        actionIconName={asText(args.actionIconName, DEFAULT_PROPS.actionIconName)}
        fileMeta={asText(args.fileMeta, DEFAULT_PROPS.fileMeta)}
        fileName={asText(args.fileName, DEFAULT_PROPS.fileName)}
        iconName={asText(args.iconName, DEFAULT_PROPS.iconName)}
        imageAlt={asText(args.imageAlt, DEFAULT_PROPS.imageAlt)}
        imageSrc={asText(args.imageSrc, DEFAULT_PROPS.imageSrc)}
        mediaVariant={mediaVariant}
        orientation={asOption(args.orientation, ORIENTATIONS, DEFAULT_PROPS.orientation)}
        progress={asNumber(args.progress, DEFAULT_PROPS.progress, { max: 100, min: 0 })}
        showAction={asBoolean(args.showAction, DEFAULT_PROPS.showAction)}
        size={asOption(args.size, SIZES, DEFAULT_PROPS.size)}
        state={state}
        statusText={asText(args.statusText, DEFAULT_PROPS.statusText)}
      />
    );
  },
};

export const AttachmentGroupStory = {
  name: 'AttachmentGroup',
  args: GROUP_PROPS,
  argTypes: {
    layout: { control: 'select', groupId: 'layout', groupLabel: 'Layout', groupOrder: 10, name: 'Layout', options: GROUP_LAYOUTS, order: 10 },
    gap: { control: 'select', groupId: 'layout', groupLabel: 'Layout', groupOrder: 10, name: 'Gap', options: GROUP_GAPS, order: 20 },
    snap: { control: 'boolean', groupId: 'layout', groupLabel: 'Layout', groupOrder: 10, name: 'Snap scrolling', order: 30, when: { key: 'layout', value: 'scroll' } },
  },
  sourceInsert: {
    props: GROUP_PROPS,
    imports: [
      {
        names: ['Attachment'],
        sourceFile: 'src/components/ui/attachment.tsx',
      },
    ],
    jsxChildren:
      '<Attachment orientation="vertical" mediaVariant="image" imageSrc="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80" imageAlt="Workspace reference" fileName="workspace.png" fileMeta="PNG · 820 KB" /><Attachment orientation="vertical" mediaVariant="image" imageSrc="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80" imageAlt="Desk reference" fileName="desk-reference.jpg" fileMeta="JPG · 1.1 MB" /><Attachment orientation="vertical" mediaVariant="image" imageSrc="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" imageAlt="Office reference" fileName="office-reference.jpg" fileMeta="JPG · 940 KB" />',
  },
  render: (args: Args) => (
    <AttachmentGroup
      gap={asOption(args.gap, GROUP_GAPS, GROUP_PROPS.gap)}
      layout={asOption(args.layout, GROUP_LAYOUTS, GROUP_PROPS.layout)}
      snap={asBoolean(args.snap, GROUP_PROPS.snap)}
    >
      <ShadcnAttachment fileMeta="PNG · 820 KB" fileName="workspace.png" imageAlt="Workspace reference" imageSrc={DEFAULT_IMAGE_SRC} mediaVariant="image" orientation="vertical" />
      <ShadcnAttachment fileMeta="JPG · 1.1 MB" fileName="desk-reference.jpg" imageAlt="Desk reference" imageSrc="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=600&q=80" mediaVariant="image" orientation="vertical" />
      <ShadcnAttachment fileMeta="PDF · 1.4 MB" fileName="briefing-notes.pdf" iconName="file-text" />
    </AttachmentGroup>
  ),
};

export const AttachmentMediaStory = {
  name: 'AttachmentMedia',
  args: {
    variant: 'icon',
    iconName: 'file-text',
    imageAlt: 'Workspace reference',
    imageSrc: DEFAULT_IMAGE_SRC,
  },
  argTypes: {
    variant: { control: 'select', options: MEDIA_VARIANTS, name: 'Media type', order: 10 },
    iconName: { control: 'icon', name: 'Icon', order: 20, when: { key: 'variant', value: 'icon' } },
    imageAlt: { control: 'text', name: 'Image alt', order: 40, when: { key: 'variant', value: 'image' } },
    imageSrc: {
      assetKinds: ['image'],
      control: 'text',
      name: 'Image source',
      order: 30,
      picker: 'asset-token',
      tokenTypes: ['string'],
      when: { key: 'variant', value: 'image' },
    },
  },
  sourceInsert: {
    props: {
      variant: 'icon',
      iconName: 'file-text',
    },
  },
  render: (args: Args) => {
    const variant = asOption(args.variant, MEDIA_VARIANTS, 'icon');
    return (
      <ShadcnAttachment orientation={variant === 'image' ? 'vertical' : 'horizontal'}>
        <AttachmentMedia
          iconName={asText(args.iconName, 'file-text')}
          imageAlt={asText(args.imageAlt, 'Workspace reference')}
          imageSrc={asText(args.imageSrc, DEFAULT_IMAGE_SRC)}
          variant={variant}
        />
      </ShadcnAttachment>
    );
  },
};

export const AttachmentContentStory = {
  name: 'AttachmentContent',
  sourceInsert: {
    imports: [
      {
        names: ['AttachmentTitle', 'AttachmentDescription'],
        sourceFile: 'src/components/ui/attachment.tsx',
      },
    ],
    jsxChildren: '<AttachmentTitle>sales-report.pdf</AttachmentTitle><AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>',
  },
  render: () => (
    <ShadcnAttachment><AttachmentContent><AttachmentTitle>sales-report.pdf</AttachmentTitle><AttachmentDescription>PDF · 2.4 MB</AttachmentDescription></AttachmentContent></ShadcnAttachment>
  ),
};

export const AttachmentTitleStory = {
  name: 'AttachmentTitle',
  sourceInsert: {
    props: {
      children: 'sales-report.pdf',
    },
  },
  render: () => <ShadcnAttachment><AttachmentTitle>sales-report.pdf</AttachmentTitle></ShadcnAttachment>,
};

export const AttachmentDescriptionStory = {
  name: 'AttachmentDescription',
  sourceInsert: {
    props: {
      children: 'PDF · 2.4 MB',
    },
  },
  render: () => <ShadcnAttachment><AttachmentDescription>PDF · 2.4 MB</AttachmentDescription></ShadcnAttachment>,
};

export const AttachmentActionsStory = {
  name: 'AttachmentActions',
  sourceInsert: {
    imports: [
      {
        names: ['AttachmentAction'],
        sourceFile: 'src/components/ui/attachment.tsx',
      },
    ],
    jsxChildren: '<AttachmentAction aria-label="Remove attachment" iconName="x" />',
  },
  render: () => <ShadcnAttachment><AttachmentActions><AttachmentAction aria-label="Remove attachment" iconName="x" /></AttachmentActions></ShadcnAttachment>,
};

export const AttachmentActionStory = {
  name: 'AttachmentAction',
  args: {
    'aria-label': 'Remove attachment',
    iconName: 'x',
  },
  argTypes: {
    'aria-label': { control: 'text' },
    iconName: { control: 'icon', name: 'Icon' },
  },
  sourceInsert: {
    props: {
      'aria-label': 'Remove attachment',
      iconName: 'x',
    },
  },
  render: (args: Args) => <AttachmentAction aria-label={asText(args['aria-label'], 'Remove attachment')} iconName={asText(args.iconName, 'x')} />,
};

export const AttachmentTriggerStory = {
  name: 'AttachmentTrigger',
  sourceInsert: {
    props: {
      'aria-label': 'Open attachment',
    },
  },
  render: () => (
    <ShadcnAttachment>
      <AttachmentTrigger aria-label="Open attachment" />
      <AttachmentMedia />
      <AttachmentContent>
        <AttachmentTitle>sales-report.pdf</AttachmentTitle>
        <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
      </AttachmentContent>
    </ShadcnAttachment>
  ),
};

export const AttachmentStates = {
  name: 'States',
  // A gallery of every state at once: there is no single instance for the
  // inherited controls to drive, so it declares none rather than showing
  // controls that do nothing.
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="grid w-[min(42rem,100%)] gap-3">
      {STATES.map((state) => (
        <ShadcnAttachment
          fileMeta="PDF · 1.8 MB"
          fileName={getAttachmentTitleForState(state)}
          key={state}
          progress={64}
          state={state}
        />
      ))}
    </div>
  ),
};

function getAttachmentTitleForState(state: (typeof STATES)[number]): string {
  if (state === 'idle') return 'selected-file.pdf';
  if (state === 'uploading') return 'design-system.zip';
  if (state === 'processing') return 'market-research.pdf';
  if (state === 'error') return 'financial-model.xlsx';
  return 'uploaded-report.pdf';
}
