import { AstryxSelectorDivider as AstryxSelectorDividerComponent } from './AstryxSelectorDivider';

const meta = {
  title: 'Astryx/SelectorDivider',
  component: AstryxSelectorDividerComponent,
  authoring: {
    group: 'Inputs',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: {},
  },
};
export default meta;

export const AstryxSelectorDivider = {
  name: 'AstryxSelectorDivider',
  render: () => <AstryxSelectorDividerComponent />,
};
