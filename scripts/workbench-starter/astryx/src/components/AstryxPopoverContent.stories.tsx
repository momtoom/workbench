import { AstryxPopoverContent as AstryxPopoverContentComponent } from './AstryxPopoverContent';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

const meta = {
  title: 'Astryx/PopoverContent',
  component: AstryxPopoverContentComponent,
  authoring: {
    group: 'Overlays',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      { names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' },
      { names: ['AstryxVStack'], sourceFile: 'src/components/AstryxVStack.tsx' },
    ],
    props: {},
    jsxChildren:
      '<AstryxVStack gap="xs"><AstryxText as="span" type="label">Popover content</AstryxText><AstryxText as="p" color="secondary" type="supporting">Editable content slot.</AstryxText></AstryxVStack>',
  },
};
export default meta;

export const AstryxPopoverContent = {
  name: 'AstryxPopoverContent',
  render: () => (
    <AstryxPopoverContentComponent>
      <AstryxVStack gap="xs">
        <AstryxText as="span" type="label">
          Popover content
        </AstryxText>
        <AstryxText as="p" color="secondary" type="supporting">
          Editable content slot.
        </AstryxText>
      </AstryxVStack>
    </AstryxPopoverContentComponent>
  ),
};
