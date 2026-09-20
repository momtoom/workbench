import { AstryxHoverCardContent as AstryxHoverCardContentComponent } from './AstryxHoverCardContent';
import { AstryxText } from './AstryxText';
import { AstryxVStack } from './AstryxVStack';

const meta = {
  title: 'Astryx/HoverCardContent',
  component: AstryxHoverCardContentComponent,
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
      '<AstryxVStack gap="xs"><AstryxText as="span" type="label">Hover card</AstryxText><AstryxText as="p" color="secondary" type="supporting">Editable preview slot.</AstryxText></AstryxVStack>',
  },
};
export default meta;

export const AstryxHoverCardContent = {
  name: 'AstryxHoverCardContent',
  render: () => (
    <AstryxHoverCardContentComponent>
      <AstryxVStack gap="xs">
        <AstryxText as="span" type="label">
          Hover card
        </AstryxText>
        <AstryxText as="p" color="secondary" type="supporting">
          Editable preview slot.
        </AstryxText>
      </AstryxVStack>
    </AstryxHoverCardContentComponent>
  ),
};
