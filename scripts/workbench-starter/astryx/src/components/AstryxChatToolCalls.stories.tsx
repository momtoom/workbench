import { AstryxChatToolCalls as Component } from './AstryxChatToolCalls';
import { AstryxChatToolCall } from './AstryxChatToolCall';
import { AstryxCodeBlock } from './AstryxCodeBlock';

const BASH_RESULT =
  '$ yarn test\n PASS  src/utils/formatDate.test.ts\n PASS  src/components/DatePicker.test.tsx\n\nTest Suites: 2 passed, 2 total\nTests:       14 passed, 14 total\nTime:        1.8s';
const TYPESCRIPT_DIFF =
  "--- a/src/utils/formatDate.ts\n+++ b/src/utils/formatDate.ts\n@@ -8,7 +8,11 @@\n-export function formatDate(date: Date): string {\n-  return date.toLocaleDateString();\n-}\n+export function formatDate(\n+  date: Date,\n+  locale = 'en-US',\n+  options?: Intl.DateTimeFormatOptions,\n+): string {\n+  return new Intl.DateTimeFormat(locale, options).format(date);\n+}";

const DEFAULT_PROPS = {
  label: '',
  isDefaultExpanded: true,
} as const;

const meta = {
  title: 'Astryx/ChatToolCalls',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    isDefaultExpanded: { control: 'boolean' },
  },
  authoring: {
    allowedChildren: ['AstryxChatToolCall'],
    group: 'Chat',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxChatToolCall duration="340ms" status="pending" target="git diff --stat" toolName="bash" />\n' +
      '<AstryxChatToolCall duration="1.8s" node="cli:remote-server" status="running" target="yarn test" toolName="bash"><AstryxCodeBlock code={"$ yarn test\\n PASS  src/utils/formatDate.test.ts\\n PASS  src/components/DatePicker.test.tsx\\n\\nTest Suites: 2 passed, 2 total\\nTests:       14 passed, 14 total\\nTime:        1.8s"} container="card" hasCopyButton language="bash" size="sm" title="bash" /></AstryxChatToolCall>\n' +
      '<AstryxChatToolCall additions={12} deletions={3} duration="120ms" node="cli:remote-server" status="complete" target="src/utils/formatDate.ts" toolName="edit"><AstryxCodeBlock code={"--- a/src/utils/formatDate.ts\\n+++ b/src/utils/formatDate.ts\\n@@ -8,7 +8,11 @@\\n-export function formatDate(date: Date): string {\\n-  return date.toLocaleDateString();\\n-}\\n+export function formatDate(\\n+  date: Date,\\n+  locale = \'en-US\',\\n+  options?: Intl.DateTimeFormatOptions,\\n+): string {\\n+  return new Intl.DateTimeFormat(locale, options).format(date);\\n+}"} container="card" hasCopyButton language="typescript" size="sm" title="typescript" /></AstryxChatToolCall>',
    imports: [
      {
        names: ['AstryxChatToolCall'],
        sourceFile: 'src/components/AstryxChatToolCall.tsx',
      },
      {
        names: ['AstryxCodeBlock'],
        sourceFile: 'src/components/AstryxCodeBlock.tsx',
      },
    ],
  },
};

export default meta;
export const AstryxChatToolCalls = {
  name: 'AstryxChatToolCalls',
  render: (args: typeof DEFAULT_PROPS) => (
    <Component {...args}>
      <AstryxChatToolCall
        duration="340ms"
        status="pending"
        target="git diff --stat"
        toolName="bash"
      />
      <AstryxChatToolCall
        duration="1.8s"
        node="cli:remote-server"
        status="running"
        target="yarn test"
        toolName="bash"
      >
        <AstryxCodeBlock
          code={BASH_RESULT}
          container="card"
          hasCopyButton
          language="bash"
          size="sm"
          title="bash"
        />
      </AstryxChatToolCall>
      <AstryxChatToolCall
        additions={12}
        deletions={3}
        duration="120ms"
        node="cli:remote-server"
        status="complete"
        target="src/utils/formatDate.ts"
        toolName="edit"
      >
        <AstryxCodeBlock
          code={TYPESCRIPT_DIFF}
          container="card"
          hasCopyButton
          language="typescript"
          size="sm"
          title="typescript"
        />
      </AstryxChatToolCall>
    </Component>
  ),
};
