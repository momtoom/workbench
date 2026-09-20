import { AstryxPagination } from './AstryxPagination';
import { AstryxPaginationButton as Component } from './AstryxPaginationButton';

const DEFAULT_PROPS = {
  label: 'Next page',
  direction: 'next',
  size: 'md',
  isDisabled: false,
} as const;

const meta = {
  title: 'Astryx/PaginationButton',
  component: Component,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    direction: { control: 'select', options: ['previous', 'next'] },
    size: { control: 'select', options: ['sm', 'md'] },
    isDisabled: { control: 'boolean' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: { props: DEFAULT_PROPS },
};
export default meta;

export const AstryxPaginationButton = {
  name: 'AstryxPaginationButton',
  render: (args: typeof DEFAULT_PROPS) => (
    <AstryxPagination page={2} totalPages={8} variant="compact">
      <Component {...args} />
    </AstryxPagination>
  ),
};
