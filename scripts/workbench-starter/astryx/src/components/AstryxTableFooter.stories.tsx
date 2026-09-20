import { AstryxTable } from './AstryxTable';
import { AstryxTableCell } from './AstryxTableCell';
import { AstryxTableFooter as AstryxTableFooterComponent } from './AstryxTableFooter';
import { AstryxTableRow } from './AstryxTableRow';

const meta = {
  title: 'Astryx/TableFooter',
  component: AstryxTableFooterComponent,
  authoring: {
    allowedChildren: ['AstryxTableRow'],
    group: 'Data',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxTableCell'],
        sourceFile: 'src/components/AstryxTableCell.tsx',
      },
      {
        names: ['AstryxTableRow'],
        sourceFile: 'src/components/AstryxTableRow.tsx',
      },
    ],
    props: {},
    jsxChildren:
      '<AstryxTableRow>\n' +
      '  <AstryxTableCell colSpan={2}>Total</AstryxTableCell>\n' +
      '  <AstryxTableCell>49 wrappers</AstryxTableCell>\n' +
      '</AstryxTableRow>',
  },
};
export default meta;

export const AstryxTableFooter = {
  name: 'AstryxTableFooter',
  render: () => (
    <AstryxTable>
      <AstryxTableFooterComponent>
        <AstryxTableRow>
          <AstryxTableCell colSpan={2}>Total</AstryxTableCell>
          <AstryxTableCell>49 wrappers</AstryxTableCell>
        </AstryxTableRow>
      </AstryxTableFooterComponent>
    </AstryxTable>
  ),
};
