import { AstryxChatComposerDrawer as Component } from './AstryxChatComposerDrawer';
import { AstryxChatComposer } from './AstryxChatComposer';
import { AstryxChatComposerFeedback } from './AstryxChatComposerFeedback';
import { AstryxChatComposerFeedbackOption } from './AstryxChatComposerFeedbackOption';
import { AstryxChatComposerInput } from './AstryxChatComposerInput';
import { AstryxChatComposerSuggestion } from './AstryxChatComposerSuggestion';
import { AstryxChatSendButton } from './AstryxChatSendButton';
import { AstryxCarousel } from './AstryxCarousel';
import { AstryxStack } from './AstryxStack';
import { AstryxThumbnail } from './AstryxThumbnail';
import { AstryxToken } from './AstryxToken';

const DEFAULT_PROPS = {
  label: 'Attachments',
  count: 4,
  isDefaultCollapsed: false,
} as const;

const meta = {
  title: 'Astryx/ChatComposerDrawer',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    count: { control: 'number' },
    isDefaultCollapsed: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: [
      'AstryxChatComposerFeedback',
      'AstryxChatComposerTokenElement',
      'AstryxStack',
      'AstryxVStack',
      'AstryxHStack',
      'AstryxCarousel',
      'AstryxList',
      'AstryxToken',
      'AstryxBadge',
      'AstryxThumbnail',
      'AstryxText',
    ],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxStack gap={2} width="full"><AstryxCarousel gap={1} hasButtons={false} hasEdgeFade={false} itemsPerView={5} label="Image attachments"><AstryxThumbnail alt="Bright sphere artwork" isRemovable label="bright-sphere.png" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" /><AstryxThumbnail alt="Capsule grid artwork" isRemovable label="capsule-grid.png" src="/workbench-assets/images/album-samples/capsule-grid.png" /><AstryxThumbnail alt="Concentric iris artwork" isRemovable label="concentric-iris.png" src="/workbench-assets/images/album-samples/concentric-iris.png" /><AstryxThumbnail alt="Geometric cube artwork" isRemovable label="geometric-cube.png" src="/workbench-assets/images/album-samples/geometric-cube.png" /><AstryxThumbnail alt="Cylinder grid artwork" isRemovable label="cylinder-grid.png" src="/workbench-assets/images/album-samples/cylinder-grid.png" /></AstryxCarousel><AstryxStack direction="horizontal" gap={1} wrap="wrap"><AstryxToken isRemovable label="quarterly-report.pdf" size="sm" /><AstryxToken isRemovable label="budget-forecast.xlsx" size="sm" /></AstryxStack></AstryxStack>',
    imports: [
      {
        names: ['AstryxCarousel'],
        sourceFile: 'src/components/AstryxCarousel.tsx',
      },
      {
        names: ['AstryxStack'],
        sourceFile: 'src/components/AstryxStack.tsx',
      },
      {
        names: ['AstryxThumbnail'],
        sourceFile: 'src/components/AstryxThumbnail.tsx',
      },
      {
        names: ['AstryxToken'],
        sourceFile: 'src/components/AstryxToken.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatComposerDrawer = {
  name: 'AstryxChatComposerDrawer',
  render: (args: typeof DEFAULT_PROPS) => (
    <AstryxChatComposer density="balanced" placeholder="Type a message...">
      <Component {...args}>
        <AstryxStack gap={2} width="full">
          <AstryxCarousel gap={1} hasButtons={false} hasEdgeFade={false} itemsPerView={5} label="Image attachments">
            <AstryxThumbnail alt="Bright sphere artwork" isRemovable label="bright-sphere.png" src="/workbench-assets/images/album-samples/bright-sphere-arch.png" />
            <AstryxThumbnail alt="Capsule grid artwork" isRemovable label="capsule-grid.png" src="/workbench-assets/images/album-samples/capsule-grid.png" />
            <AstryxThumbnail alt="Concentric iris artwork" isRemovable label="concentric-iris.png" src="/workbench-assets/images/album-samples/concentric-iris.png" />
            <AstryxThumbnail alt="Geometric cube artwork" isRemovable label="geometric-cube.png" src="/workbench-assets/images/album-samples/geometric-cube.png" />
            <AstryxThumbnail alt="Cylinder grid artwork" isRemovable label="cylinder-grid.png" src="/workbench-assets/images/album-samples/cylinder-grid.png" />
          </AstryxCarousel>
          <AstryxStack direction="horizontal" gap={1} wrap="wrap">
            <AstryxToken isRemovable label="quarterly-report.pdf" size="sm" />
            <AstryxToken isRemovable label="budget-forecast.xlsx" size="sm" />
          </AstryxStack>
        </AstryxStack>
      </Component>
      <AstryxChatComposerInput label="Message input" maxRows={8}>
        <AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" />
        <AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" />
      </AstryxChatComposerInput>
      <AstryxChatSendButton size="md" />
    </AstryxChatComposer>
  ),
};

export const Feedback = {
  name: 'Feedback',
  args: {
    label: 'User feedback requested',
    count: 1,
  },
  render: (args: typeof DEFAULT_PROPS) => (
    <AstryxChatComposer density="balanced" placeholder="Type a message...">
      <Component {...args}>
        <AstryxChatComposerFeedback question="Do you want to proceed?">
          <AstryxChatComposerFeedbackOption optionKey="A" label="Yes" />
          <AstryxChatComposerFeedbackOption optionKey="B" label="Yes, and don’t ask again for `git add` commands" />
          <AstryxChatComposerFeedbackOption optionKey="C" label="No, and tell me what to do differently" />
        </AstryxChatComposerFeedback>
      </Component>
      <AstryxChatComposerInput label="Message input" maxRows={8}>
        <AstryxChatComposerSuggestion trigger="@" value="cindy" label="Cindy Zhang" description="Design Systems" tokenLabel="Cindy Zhang" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="alex" label="Alex Johnson" description="Frontend" tokenLabel="Alex Johnson" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="sam" label="Sam Rivera" description="Backend" tokenLabel="Sam Rivera" variant="blue" />
        <AstryxChatComposerSuggestion trigger="@" value="jordan" label="Jordan Lee" description="Product" tokenLabel="Jordan Lee" variant="blue" />
        <AstryxChatComposerSuggestion trigger="/" value="summarize" label="summarize" description="Summarize the conversation" tokenLabel="/summarize" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="translate" label="translate" description="Translate text to another language" tokenLabel="/translate" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="search" label="search" description="Search the web or documents" tokenLabel="/search" variant="yellow" />
        <AstryxChatComposerSuggestion trigger="/" value="code" label="code" description="Generate or explain code" tokenLabel="/code" variant="yellow" />
      </AstryxChatComposerInput>
      <AstryxChatSendButton size="md" />
    </AstryxChatComposer>
  ),
};
