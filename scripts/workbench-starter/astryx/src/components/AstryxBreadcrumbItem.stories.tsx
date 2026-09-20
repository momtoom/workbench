import { AstryxBreadcrumbItem as AstryxBreadcrumbItemComponent } from './AstryxBreadcrumbItem';
import { AstryxBreadcrumbs } from './AstryxBreadcrumbs';

type Args = Record<string, boolean | string>;

const DEFAULT_PROPS = {
  label: 'Projects',
  href: '#',
  icon: 'wrench',
  isClickable: false,
  isCurrent: false,
} as const;

const meta = {
  title: 'Astryx/BreadcrumbItem',
  component: AstryxBreadcrumbItemComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    label: { control: 'text' },
    href: { control: 'text' },
    icon: { control: 'icon' },
    isClickable: { control: 'boolean' },
    isCurrent: { control: 'boolean' },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    props: DEFAULT_PROPS,
  },
};
export default meta;

export const AstryxBreadcrumbItem = {
  name: 'AstryxBreadcrumbItem',
  render: (args: Args) => (
    <AstryxBreadcrumbs>
      <AstryxBreadcrumbItemComponent
        href={asText(args.href, DEFAULT_PROPS.href)}
        icon={asText(args.icon, DEFAULT_PROPS.icon)}
        isClickable={asBoolean(args.isClickable)}
        isCurrent={asBoolean(args.isCurrent)}
        label={asText(args.label, DEFAULT_PROPS.label)}
      />
      <AstryxBreadcrumbItemComponent isCurrent label="Current page" />
    </AstryxBreadcrumbs>
  ),
};

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : value === 'true';
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
