import { AstryxBreadcrumbs as AstryxBreadcrumbsComponent } from './AstryxBreadcrumbs';
import { AstryxBreadcrumbItem } from './AstryxBreadcrumbItem';

type Args = Record<string, boolean | number | string>;

const VARIANTS = ['default', 'supporting'] as const;

const DEFAULT_PROPS = {
  label: 'Breadcrumb',
  variant: 'default',
  separator: '/',
} as const;

const meta = {
  title: 'Astryx/Breadcrumbs',
  component: AstryxBreadcrumbsComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    separator: { control: 'text' },
  },
  authoring: {
    allowedChildren: ['AstryxBreadcrumbItem'],
    group: 'Navigation',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxBreadcrumbItem'],
        sourceFile: 'src/components/AstryxBreadcrumbItem.tsx',
      },
    ],
    jsxChildren:
      '<AstryxBreadcrumbItem href="#" icon="wrench" label="Projects" />\n<AstryxBreadcrumbItem href="#" label="Astryx" />\n<AstryxBreadcrumbItem isCurrent label="Component library" />',
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxBreadcrumbs = {
  name: 'AstryxBreadcrumbs',
  render: (args: Args) => (
    <AstryxBreadcrumbsComponent
      label={asText(args.label, DEFAULT_PROPS.label)}
      separator={asText(args.separator, DEFAULT_PROPS.separator)}
      variant={asOption(args.variant, VARIANTS, DEFAULT_PROPS.variant)}
    >
      <AstryxBreadcrumbItem href="#" icon="wrench" label="Projects" />
      <AstryxBreadcrumbItem href="#" label="Astryx" />
      <AstryxBreadcrumbItem isCurrent label="Component library" />
    </AstryxBreadcrumbsComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
