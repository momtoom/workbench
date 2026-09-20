import { AstryxChatToolCall as Component } from './AstryxChatToolCall';
import { AstryxCodeBlock } from './AstryxCodeBlock';

const DEFAULT_PROPS = {
  duration: '1.8s',
  status: 'complete',
  additions: 14,
  deletions: 0,
  errorMessage: '',
  node: 'cli:remote-server',
  target: 'yarn test',
  toolName: 'bash',
} as const;

const meta = {
  title: 'Astryx/ChatToolCall',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    duration: { control: 'text' },
    status: { control: 'select', options: ['pending', 'running', 'complete', 'error'] },
    additions: { control: 'number' },
    deletions: { control: 'number' },
    errorMessage: { control: 'text' },
    node: { control: 'text' },
    target: { control: 'text' },
    toolName: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxCodeBlock', 'AstryxCode', 'AstryxMarkdown', 'AstryxText', 'AstryxBadge'],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxCodeBlock code={"$ yarn test\\n PASS  src/utils/formatDate.test.ts\\n PASS  src/components/DatePicker.test.tsx\\n\\nTest Suites: 2 passed, 2 total\\nTests:       14 passed, 14 total\\nTime:        1.8s"} container="card" hasCopyButton language="bash" maxHeight="50vh" title="bash" />',
    imports: [
      {
        names: ['AstryxCodeBlock'],
        sourceFile: 'src/components/AstryxCodeBlock.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatToolCall = {
  name: 'AstryxChatToolCall',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxCodeBlock
        code={'$ yarn test\n PASS  src/utils/formatDate.test.ts\n PASS  src/components/DatePicker.test.tsx\n\nTest Suites: 2 passed, 2 total\nTests:       14 passed, 14 total\nTime:        1.8s'}
        container="card"
        hasCopyButton
        language="bash"
        maxHeight="50vh"
        title="bash"
      />
    </Component>
  ),
};
