import { Bubble, BubbleContent } from './bubble';
import { Marker, MarkerContent } from './marker';
import {
  Message,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from './message';
import {
  MessageScroller as ShadcnMessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from './message-scroller';
import { asBoolean, asNumber, asOption, asText } from './story-utils';

type Args = {
  animation?: boolean | string;
  autoScroll?: boolean | string;
  defaultScrollPosition?: boolean | string;
  direction?: boolean | string;
  scrollPreviousItemPeek?: boolean | number | string;
};

const ANIMATIONS = ['none', 'fade', 'slide-up', 'slide-side', 'pop', 'spring-bounce', 'blur-fade', 'scale-fade'] as const;
const DIRECTIONS = ['start', 'end'] as const;
const SCROLL_POSITIONS = ['start', 'end', 'last-anchor'] as const;

const meta = {
  title: 'shadcn/Base UI/MessageScroller',
  component: ShadcnMessageScroller,
  authoring: {
    group: 'Chat',
  },
  args: {
    autoScroll: false,
    defaultScrollPosition: 'last-anchor',
    scrollPreviousItemPeek: 48,
  },
  argTypes: {
    autoScroll: { control: 'boolean' },
    defaultScrollPosition: { control: 'select', options: SCROLL_POSITIONS },
    scrollPreviousItemPeek: { control: 'number' },
  },
  sourceInsert: {
    imports: [
      {
        names: ['MessageScrollerViewport', 'MessageScrollerContent', 'MessageScrollerItem', 'MessageScrollerButton'],
        sourceFile: 'src/components/ui/message-scroller.tsx',
      },
      {
        names: ['Message', 'MessageContent', 'MessageFooter'],
        sourceFile: 'src/components/ui/message.tsx',
      },
      {
        names: ['Bubble', 'BubbleContent'],
        sourceFile: 'src/components/ui/bubble.tsx',
      },
    ],
    jsxChildren:
      '<MessageScrollerViewport className="px-4 py-5"><MessageScrollerContent className="gap-5 pb-8"><MessageScrollerItem messageId="question" scrollAnchor><Message align="end"><MessageContent><Bubble><BubbleContent>Can you review the onboarding drop-off?</BubbleContent></Bubble><MessageFooter>10:42 AM</MessageFooter></MessageContent></Message></MessageScrollerItem><MessageScrollerItem messageId="answer"><Message><MessageContent><Bubble variant="secondary"><BubbleContent>Start with the invite step and compare template users with blank-workspace users.</BubbleContent></Bubble><MessageFooter>10:43 AM</MessageFooter></MessageContent></Message></MessageScrollerItem><MessageScrollerItem messageId="follow-up" scrollAnchor><Message align="end"><MessageContent><Bubble><BubbleContent>Turn that into an experiment.</BubbleContent></Bubble></MessageContent></Message></MessageScrollerItem></MessageScrollerContent></MessageScrollerViewport><MessageScrollerButton direction="start" variant="outline" /><MessageScrollerButton direction="end" />',
    props: {
      autoScroll: false,
      className: 'h-80 w-[min(34rem,100%)] overflow-hidden rounded-xl border bg-background',
      defaultScrollPosition: 'last-anchor',
      scrollPreviousItemPeek: 48,
    },
  },
};
export default meta;

export const MessageScroller = {
  name: 'MessageScroller',
  render: (args: Args) => (
    <ShadcnMessageScroller
      autoScroll={asBoolean(args.autoScroll, false)}
      defaultScrollPosition={asOption(args.defaultScrollPosition, SCROLL_POSITIONS, 'last-anchor')}
      scrollPreviousItemPeek={asNumber(args.scrollPreviousItemPeek, 48, { min: 0 })}
      className="h-80 w-[min(34rem,100%)] overflow-hidden rounded-xl border bg-background"
    >
      <MessageScrollerViewport className="px-4 py-5">
        <MessageScrollerContent className="gap-5 pb-8">
          <MessageScrollerItem messageId="context">
            <Message>
              <MessageContent>
                <MessageHeader>Research assistant</MessageHeader>
                <Bubble variant="secondary"><BubbleContent>Workspace creation is healthy, but first-invite completion is lagging.</BubbleContent></Bubble>
                <MessageFooter>10:38 AM</MessageFooter>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="question" scrollAnchor>
            <Message align="end">
              <MessageContent>
                <Bubble><BubbleContent>What should I compare before changing onboarding?</BubbleContent></Bubble>
                <MessageFooter>10:42 AM</MessageFooter>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="answer">
            <Message>
              <MessageContent>
                <Bubble variant="secondary"><BubbleContent>Compare template users, blank-workspace users, and teams that skip invites but return within 24 hours.</BubbleContent></Bubble>
                <MessageFooter>10:43 AM</MessageFooter>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="follow-up" scrollAnchor>
            <Message align="end">
              <MessageContent>
                <Bubble><BubbleContent>Turn that into a small experiment.</BubbleContent></Bubble>
                <MessageFooter>10:45 AM</MessageFooter>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="experiment">
            <Message>
              <MessageContent>
                <Bubble variant="tinted"><BubbleContent>Show a three-step checklist after workspace creation, keep Invite visible in the header, and measure first invite plus 24-hour return.</BubbleContent></Bubble>
                <MessageFooter>10:46 AM</MessageFooter>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton direction="start" variant="outline" />
      <MessageScrollerButton direction="end" />
    </ShadcnMessageScroller>
  ),
};

export const AnchoredTurns = {
  name: 'Anchored turns',
  render: (args: Args) => (
    <ShadcnMessageScroller
      autoScroll={asBoolean(args.autoScroll, false)}
      defaultScrollPosition={asOption(args.defaultScrollPosition, SCROLL_POSITIONS, 'last-anchor')}
      scrollPreviousItemPeek={asNumber(args.scrollPreviousItemPeek, 64)}
      className="h-72 w-[min(32rem,100%)] overflow-hidden rounded-xl border bg-background"
    >
      <MessageScrollerViewport className="px-4 py-5">
        <MessageScrollerContent className="gap-5 pb-8">
          <MessageScrollerItem messageId="previous-answer">
            <Message><MessageContent><Bubble variant="secondary"><BubbleContent>The previous answer remains partly visible for context.</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="anchored-question" scrollAnchor>
            <Message align="end"><MessageContent><Bubble><BubbleContent>Can the new turn settle near the top?</BubbleContent></Bubble><MessageFooter>11:02 AM</MessageFooter></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="anchored-answer">
            <Message><MessageContent><Bubble variant="secondary"><BubbleContent>Yes. The question is the anchor and 64 pixels of the previous row stay in view.</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="anchored-detail">
            <Message><MessageContent><Bubble variant="ghost"><BubbleContent>The reply can keep growing below without pulling the reader away.</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton direction="start" variant="outline" />
      <MessageScrollerButton direction="end" />
    </ShadcnMessageScroller>
  ),
};

export const LiveEdge = {
  name: 'Following the live edge',
  render: (args: Args) => (
    <ShadcnMessageScroller
      autoScroll={asBoolean(args.autoScroll, true)}
      defaultScrollPosition={asOption(args.defaultScrollPosition, SCROLL_POSITIONS, 'end')}
      scrollPreviousItemPeek={asNumber(args.scrollPreviousItemPeek, 64)}
      className="h-72 w-[min(32rem,100%)] overflow-hidden rounded-xl border bg-background"
    >
      <MessageScrollerViewport className="px-4 py-5">
        <MessageScrollerContent aria-busy className="gap-5 pb-8">
          <MessageScrollerItem messageId="stream-question" scrollAnchor>
            <Message align="end"><MessageContent><Bubble><BubbleContent>Summarize today&apos;s launch readiness.</BubbleContent></Bubble><MessageFooter>12:10 PM</MessageFooter></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="stream-answer">
            <Message>
              <MessageContent>
                <MessageHeader>Assistant · streaming</MessageHeader>
                <Bubble variant="secondary"><BubbleContent>Core checks are green. The remaining work is a final accessibility pass and one mobile viewport review…</BubbleContent></Bubble>
              </MessageContent>
            </Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="stream-status">
            <Marker><MarkerContent>New output follows only while the reader stays at the live edge.</MarkerContent></Marker>
          </MessageScrollerItem>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </ShadcnMessageScroller>
  ),
};

export const GroupHandoff = {
  name: 'Group handoff marker',
  render: (args: Args) => (
    <ShadcnMessageScroller
      autoScroll={asBoolean(args.autoScroll, false)}
      defaultScrollPosition={asOption(args.defaultScrollPosition, SCROLL_POSITIONS, 'last-anchor')}
      scrollPreviousItemPeek={asNumber(args.scrollPreviousItemPeek, 40)}
      className="h-72 w-[min(32rem,100%)] overflow-hidden rounded-xl border bg-background"
    >
      <MessageScrollerViewport className="px-4 py-5">
        <MessageScrollerContent className="gap-5 pb-8">
          <MessageScrollerItem messageId="group-question">
            <Message align="end"><MessageContent><Bubble><BubbleContent>@Mina, can you verify the release window?</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="group-answer">
            <Message><MessageContent><MessageHeader>Mina</MessageHeader><Bubble variant="secondary"><BubbleContent>The window is clear after 14:00 UTC.</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="handoff" scrollAnchor>
            <Marker variant="separator"><MarkerContent>Sam joined and took the release handoff</MarkerContent></Marker>
          </MessageScrollerItem>
          <MessageScrollerItem messageId="handoff-answer">
            <Message><MessageContent><MessageHeader>Sam</MessageHeader><Bubble variant="tinted"><BubbleContent>I have the checklist and will post the deploy status here.</BubbleContent></Bubble></MessageContent></Message>
          </MessageScrollerItem>
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton direction="start" variant="outline" />
      <MessageScrollerButton direction="end" />
    </ShadcnMessageScroller>
  ),
};

export const MessageScrollerViewportStory = {
  name: 'MessageScrollerViewport',
  sourceInsert: {
    imports: [
      {
        names: ['MessageScrollerContent'],
        sourceFile: 'src/components/ui/message-scroller.tsx',
      },
    ],
    jsxChildren: '<MessageScrollerContent />',
  },
  render: () => <ShadcnMessageScroller className="h-32 w-80 border"><MessageScrollerViewport><MessageScrollerContent /></MessageScrollerViewport></ShadcnMessageScroller>,
};

export const MessageScrollerContentStory = {
  name: 'MessageScrollerContent',
  sourceInsert: {
    imports: [
      {
        names: ['MessageScrollerItem'],
        sourceFile: 'src/components/ui/message-scroller.tsx',
      },
    ],
    jsxChildren: '<MessageScrollerItem messageId="message-1">Message item</MessageScrollerItem>',
  },
  render: () => <ShadcnMessageScroller className="h-32 w-80 border"><MessageScrollerViewport><MessageScrollerContent><MessageScrollerItem messageId="message-1">Message item</MessageScrollerItem></MessageScrollerContent></MessageScrollerViewport></ShadcnMessageScroller>,
};

export const MessageScrollerItemStory = {
  name: 'MessageScrollerItem',
  args: {
    animation: 'fade',
    messageId: 'message-1',
    scrollAnchor: false,
  },
  argTypes: {
    animation: { control: 'select', options: ANIMATIONS },
    messageId: { control: 'text' },
    scrollAnchor: { control: 'boolean' },
  },
  sourceInsert: {
    props: {
      children: 'Message item',
      animation: 'fade',
      messageId: 'message-1',
      scrollAnchor: false,
    },
  },
  render: (args: Args) => <ShadcnMessageScroller className="h-32 w-80 border"><MessageScrollerViewport><MessageScrollerContent><MessageScrollerItem animation={asOption(args.animation, ANIMATIONS, 'fade')} messageId={asText(args.messageId, 'message-1')} scrollAnchor={asBoolean(args.scrollAnchor, false)}>Message item</MessageScrollerItem></MessageScrollerContent></MessageScrollerViewport></ShadcnMessageScroller>,
};

export const MessageScrollerButtonStory = {
  name: 'MessageScrollerButton',
  args: {
    direction: 'end',
  },
  argTypes: {
    direction: { control: 'select', options: DIRECTIONS },
  },
  sourceInsert: {
    props: {
      direction: 'end',
    },
  },
  render: (args: Args) => (
    <ShadcnMessageScroller className="h-32 w-80 border">
      <MessageScrollerViewport><MessageScrollerContent><MessageScrollerItem messageId="message-1">Message item</MessageScrollerItem></MessageScrollerContent></MessageScrollerViewport>
      <MessageScrollerButton direction={asOption(args.direction, DIRECTIONS, 'end')} />
    </ShadcnMessageScroller>
  ),
};
