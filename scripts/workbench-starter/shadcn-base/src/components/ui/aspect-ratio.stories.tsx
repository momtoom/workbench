import { AspectRatio as ShadcnAspectRatio } from './aspect-ratio';
import { asText } from './story-utils';

type Args = {
  ratio?: boolean | string;
};

const DEFAULT_PROPS = {
  ratio: '16/9',
} as const;

const PREVIEW_CLASS_NAME =
  'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm text-muted-foreground';

const meta = {
  title: 'shadcn/Base UI/Aspect Ratio',
  component: ShadcnAspectRatio,
  authoring: {
    group: 'Layout',
  },
  args: DEFAULT_PROPS,
  argTypes: {
    ratio: { control: 'text' },
  },
  sourceInsert: {
    jsxChildren:
      '<div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-muted text-sm text-muted-foreground">16:9 preview</div>',
    props: {
      ratio: '16/9',
    },
  },
};
export default meta;

export const AspectRatio = {
  name: 'AspectRatio',
  render: (args: Args) => (
    <div className="w-[min(24rem,100%)]">
      <ShadcnAspectRatio ratio={asText(args.ratio, DEFAULT_PROPS.ratio)}>
        <div className={PREVIEW_CLASS_NAME}>
          16:9 preview
        </div>
      </ShadcnAspectRatio>
    </div>
  ),
};
