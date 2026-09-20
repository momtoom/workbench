import { AstryxTable } from './AstryxTable';
import { AstryxTableBody as AstryxTableBodyComponent } from './AstryxTableBody';
import { AstryxTableCell } from './AstryxTableCell';
import { AstryxTableRow } from './AstryxTableRow';

const meta = {
  title: 'Astryx/TableBody',
  component: AstryxTableBodyComponent,
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
      '  <AstryxTableCell>Primitive wrappers</AstryxTableCell>\n' +
      '  <AstryxTableCell>Registered</AstryxTableCell>\n' +
      '</AstryxTableRow>',
  },
};
export default meta;

export const AstryxTableBody = {
  name: 'AstryxTableBody',
  render: () => (
    <AstryxTable>
      <AstryxTableBodyComponent>
        <AstryxTableRow>
          <AstryxTableCell>Primitive wrappers</AstryxTableCell>
          <AstryxTableCell>Registered</AstryxTableCell>
        </AstryxTableRow>
      </AstryxTableBodyComponent>
    </AstryxTable>
  ),
};
