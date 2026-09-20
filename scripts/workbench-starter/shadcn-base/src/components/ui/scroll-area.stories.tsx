import { ScrollArea, ScrollBar } from './scroll-area';
import { asOption } from './story-utils';

type Args = {
  orientation?: boolean | string;
};

const ORIENTATIONS = ['horizontal', 'vertical'] as const;

const NOTES = [
  'Scrollable content stays editable.',
  'Longer rows remain available inside the viewport.',
  'The container keeps its authored size.',
  'Nested children can be selected from the layer tree.',
  'Additional content extends the scroll range.',
];

const meta = {
  title: 'shadcn/Base UI/ScrollArea',
  component: ScrollArea,
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    props: {
      className: 'h-40 w-72 rounded-lg border p-4',
    },
    jsxChildren:
      '<div className="space-y-3"><h3 className="text-sm font-medium">Release notes</h3><p className="text-sm text-muted-foreground">Scrollable content stays editable.</p></div>',
  },
};
export default meta;

export const ScrollAreaStory = {
  name: 'ScrollArea',
  render: () => (
    <ScrollArea className="h-40 w-[min(22rem,100%)] rounded-lg border p-4">
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Release notes</h3>
        {NOTES.map((note) => (
          <p className="text-sm leading-6 text-muted-foreground" key={note}>
            {note}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const ScrollBarStory = {
  name: 'ScrollBar',
  args: {
    orientation: 'vertical',
  },
  argTypes: {
    orientation: { control: 'select', options: ORIENTATIONS },
  },
  sourceInsert: {
    props: {
      orientation: 'vertical',
    },
  },
  render: (args: Args) => (
    <ScrollArea className="h-32 w-56 rounded-lg border p-4">
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Scrollable content</p>
        <p>Additional content</p>
        <p>More content</p>
      </div>
      <ScrollBar orientation={asOption(args.orientation, ORIENTATIONS, 'vertical')} />
    </ScrollArea>
  ),
};
