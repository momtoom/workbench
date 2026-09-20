import { AstryxText } from './AstryxText';
import { AstryxSideNavCollapseWrapper as AstryxSideNavCollapseWrapperComponent } from './AstryxSideNavCollapseWrapper';

type Args = Record<string, string>;

const BEHAVIORS = ['hide', 'show'] as const;

const DEFAULT_PROPS = {
  behavior: 'hide',
} as const;

const meta = {
  title: 'Astryx/SideNavCollapseWrapper',
  component: AstryxSideNavCollapseWrapperComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    behavior: { control: 'select', options: BEHAVIORS },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxText'], sourceFile: 'src/components/AstryxText.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxText as="p" color="secondary" type="supporting">Hidden when the side nav collapses.</AstryxText>',
  },
};
export default meta;

export const AstryxSideNavCollapseWrapper = {
  name: 'AstryxSideNavCollapseWrapper',
  render: (args: Args) => (
    <AstryxSideNavCollapseWrapperComponent behavior={asOption(args.behavior, BEHAVIORS, DEFAULT_PROPS.behavior)}>
      <AstryxText as="p" color="secondary" type="supporting">
        Hidden when the side nav collapses.
      </AstryxText>
    </AstryxSideNavCollapseWrapperComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
