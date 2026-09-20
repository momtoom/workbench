import { Attachment, AttachmentGroup } from './attachment';
import { Avatar, AvatarFallback } from './avatar';
import { Bubble, BubbleContent } from './bubble';
import { Button } from './button';
import { Icon } from './icon';
import {
  Message as ShadcnMessage,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from './message';
import { asOption } from './story-utils';

type Args = {
  align?: boolean | string;
};

const ALIGNS = ['start', 'end'] as const;

const DEFAULT_PROPS = {
  align: 'start',
} as const;

const DEFAULT_MESSAGE_HEADER = 'Avery';
const DEFAULT_MESSAGE_TEXT = 'Can you review this update?';
const DEFAULT_MESSAGE_FOOTER = '10:42 AM';

const meta = {
  title: 'shadcn/Base UI/Message',
  component: ShadcnMessage,
  authoring: {
    group: 'Chat',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    align: { control: 'select', options: ALIGNS },
  },
  sourceInsert: {
    imports: [
      {
        names: ['MessageContent', 'MessageHeader', 'MessageFooter'],
        sourceFile: 'src/components/ui/message.tsx',
      },
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren:
      '<MessageContent><MessageHeader>Avery</MessageHeader><Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble><MessageFooter>10:42 AM</MessageFooter></MessageContent>',
    props: {
      align: 'start',
    },
  },
};
export default meta;

export const Message = {
  name: 'Message',
  render: (args: Args) => (
    <ShadcnMessage align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}>
      <MessageAvatar>
        <Avatar className="size-8"><AvatarFallback>AV</AvatarFallback></Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>{DEFAULT_MESSAGE_HEADER}</MessageHeader>
        <Bubble variant={asOption(args.align, ALIGNS, DEFAULT_PROPS.align) === 'end' ? 'default' : 'secondary'}>
          <BubbleContent>{DEFAULT_MESSAGE_TEXT}</BubbleContent>
        </Bubble>
        <MessageFooter>{DEFAULT_MESSAGE_FOOTER}</MessageFooter>
      </MessageContent>
    </ShadcnMessage>
  ),
};

export const MessageGroupStory = {
  name: 'MessageGroup',
  sourceInsert: {
    imports: [
      {
        names: ['Message', 'MessageContent'],
        sourceFile: 'src/components/ui/message.tsx',
      },
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren:
      '<Message><MessageContent><Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble></MessageContent></Message><Message align="end"><MessageContent><Bubble><BubbleContent>Looks good to me.</BubbleContent></Bubble></MessageContent></Message>',
  },
  render: () => (
    <MessageGroup>
      <ShadcnMessage><MessageContent><Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble></MessageContent></ShadcnMessage>
      <ShadcnMessage align="end"><MessageContent><Bubble><BubbleContent>Looks good to me.</BubbleContent></Bubble></MessageContent></ShadcnMessage>
    </MessageGroup>
  ),
};

export const MessageActions = {
  name: 'Message / actions',
  sourceInsert: {
    imports: [
      {
        names: ['MessageContent', 'MessageFooter'],
        sourceFile: 'src/components/ui/message.tsx',
      },
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
      {
        names: ['Button'],
        sourceFile: 'src/components/ui/button.tsx',
      },
      {
        names: ['Icon'],
        sourceFile: 'src/components/ui/icon.tsx',
      },
    ],
    jsxChildren:
      '<MessageContent><Bubble variant="ghost"><BubbleContent>Here is the summary you asked for.</BubbleContent></Bubble><MessageFooter><Button variant="ghost" size="icon-xs" aria-label="Copy"><Icon name="copy" /></Button><Button variant="ghost" size="icon-xs" aria-label="Retry"><Icon name="refresh-cw" /></Button><Button variant="ghost" size="icon-xs" aria-label="Good response"><Icon name="thumbs-up" /></Button><Button variant="ghost" size="icon-xs" aria-label="Bad response"><Icon name="thumbs-down" /></Button></MessageFooter></MessageContent>',
    props: {
      align: 'start',
    },
  },
  render: (args: Args) => (
    <ShadcnMessage align={asOption(args.align, ALIGNS, DEFAULT_PROPS.align)}>
      <MessageContent>
        <Bubble variant="ghost"><BubbleContent>Here is the summary you asked for.</BubbleContent></Bubble>
        <MessageFooter>
          <Button variant="ghost" size="icon-xs" aria-label="Copy"><Icon name="copy" /></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Retry"><Icon name="refresh-cw" /></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Good response"><Icon name="thumbs-up" /></Button>
          <Button variant="ghost" size="icon-xs" aria-label="Bad response"><Icon name="thumbs-down" /></Button>
        </MessageFooter>
      </MessageContent>
    </ShadcnMessage>
  ),
};

export const MessageAttachment = {
  name: 'Message / attachment',
  sourceInsert: {
    imports: [
      {
        names: ['MessageContent'],
        sourceFile: 'src/components/ui/message.tsx',
      },
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
      {
        names: ['Attachment', 'AttachmentGroup'],
        sourceFile: 'src/components/ui/attachment.tsx',
      },
    ],
    jsxChildren:
      '<MessageContent><AttachmentGroup layout="wrap" gap="sm"><Attachment fileName="specimen-audit.pdf" fileMeta="PDF · 1.8 MB" iconName="file-text" state="done" /></AttachmentGroup><Bubble><BubbleContent>Here is the report.</BubbleContent></Bubble></MessageContent>',
    props: {
      align: 'end',
    },
  },
  render: (args: Args) => (
    <ShadcnMessage align={asOption(args.align, ALIGNS, 'end')}>
      <MessageContent>
        <AttachmentGroup layout="wrap" gap="sm">
          <Attachment fileName="specimen-audit.pdf" fileMeta="PDF · 1.8 MB" iconName="file-text" state="done" />
        </AttachmentGroup>
        <Bubble><BubbleContent>Here is the report.</BubbleContent></Bubble>
      </MessageContent>
    </ShadcnMessage>
  ),
};

export const MessageAvatarStory = {
  name: 'MessageAvatar',
  sourceInsert: {
    imports: [
      {
        names: ['Avatar', 'AvatarFallback'],
        sourceFile: 'src/components/ui/avatar.tsx',
      },
    ],
    jsxChildren: '<Avatar className="size-8"><AvatarFallback>AV</AvatarFallback></Avatar>',
  },
  render: () => <ShadcnMessage><MessageAvatar><Avatar className="size-8"><AvatarFallback>AV</AvatarFallback></Avatar></MessageAvatar><MessageContent /></ShadcnMessage>,
};

export const MessageContentStory = {
  name: 'MessageContent',
  sourceInsert: {
    imports: [
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren: '<Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble>',
  },
  render: () => <ShadcnMessage><MessageContent><Bubble variant="secondary"><BubbleContent>Can you review this update?</BubbleContent></Bubble></MessageContent></ShadcnMessage>,
};

export const MessageHeaderStory = {
  name: 'MessageHeader',
  sourceInsert: {
    props: {
      children: 'Avery',
    },
  },
  render: () => <ShadcnMessage><MessageContent><MessageHeader>Avery</MessageHeader></MessageContent></ShadcnMessage>,
};

export const MessageFooterStory = {
  name: 'MessageFooter',
  sourceInsert: {
    props: {
      children: '10:42 AM',
    },
  },
  render: () => <ShadcnMessage><MessageContent><MessageFooter>10:42 AM</MessageFooter></MessageContent></ShadcnMessage>,
};
