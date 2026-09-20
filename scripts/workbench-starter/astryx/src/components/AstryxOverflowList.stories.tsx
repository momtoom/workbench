import { AstryxOverflowList as Component } from './AstryxOverflowList';
import { AstryxButton } from './AstryxButton';
type Args = Record<string, number | string>;
const DEFAULT_PROPS = {
  gap: 2,
  behavior: 'observeSelf',
  collapseFrom: 'end',
  minVisibleItems: 1,
  overflowLabel: 'more',
} as const;
const meta = {
  title: 'Astryx/OverflowList', component: Component, args: DEFAULT_PROPS,
  argTypes: {
    gap: { control: 'select', options: [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] },
    behavior: { control: 'select', options: ['observeParent', 'observeSelf'] },
    collapseFrom: { control: 'select', options: ['start', 'end'] },
    minVisibleItems: { control: 'number' },
    overflowLabel: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxButton'],
    group: 'Actions',
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxButton label="Save" variant="secondary" />\n<AstryxButton label="Edit" variant="secondary" />\n<AstryxButton label="Share" variant="secondary" />\n<AstryxButton label="Archive" variant="secondary" />\n<AstryxButton label="Duplicate" variant="secondary" />',
    imports: [{ names: ['AstryxButton'], sourceFile: 'src/components/AstryxButton.tsx' }],
  },
};
export default meta;
export const AstryxOverflowList = {
  name: 'AstryxOverflowList',
  render: (args: Args) => (
    <div className="astryx-wb-story-frame astryx-wb-story-frame--overflow-list">
      <Component {...(args as typeof DEFAULT_PROPS)}>
        <AstryxButton label="Save" variant="secondary" />
        <AstryxButton label="Edit" variant="secondary" />
        <AstryxButton label="Share" variant="secondary" />
        <AstryxButton label="Archive" variant="secondary" />
        <AstryxButton label="Duplicate" variant="secondary" />
      </Component>
    </div>
  ),
};
