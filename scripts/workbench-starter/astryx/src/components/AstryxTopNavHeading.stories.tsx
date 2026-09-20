import { AstryxBadge } from './AstryxBadge';
import { ASTRYX_NAV_BRAND_DISPLAYS } from './AstryxNavBrand';
import { AstryxTopNavHeading as AstryxTopNavHeadingComponent } from './AstryxTopNavHeading';

type Args = Record<string, string>;

const ICONS = ['none', 'component', 'menu', 'settings', 'sparkles'] as const;

const DEFAULT_PROPS = {
  icon: 'component',
  brandDisplay: 'signature',
  heading: 'Astryx',
  headingHref: '#',
  logoAlt: '',
  logoSrc: '',
  logoText: 'Astryx',
  subheading: 'Component library',
  subheadingHref: '',
  superheading: 'Workbench',
  superheadingHref: '',
  symbolAlt: '',
  symbolSrc: '',
} as const;

const meta = {
  title: 'Astryx/TopNavHeading',
  component: AstryxTopNavHeadingComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    icon: { control: 'icon', name: 'Symbol icon', options: ICONS },
    brandDisplay: { control: 'select', options: ASTRYX_NAV_BRAND_DISPLAYS },
    heading: { control: 'text' },
    headingHref: { control: 'text' },
    logoAlt: { control: 'text' },
    logoSrc: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Logo image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
    logoText: { control: 'text' },
    subheading: { control: 'text' },
    subheadingHref: { control: 'text' },
    superheading: { control: 'text' },
    superheadingHref: { control: 'text' },
    symbolAlt: { control: 'text' },
    symbolSrc: {
      assetKinds: ['image', 'icon'],
      control: 'text',
      name: 'Symbol image',
      picker: 'asset-token',
      tokenTypes: ['string'],
    },
  },
  authoring: {
    group: 'Navigation',
    hiddenFromInsert: true,
  },
  sourceInsert: {
    imports: [{ names: ['AstryxBadge'], sourceFile: 'src/components/AstryxBadge.tsx' }],
    props: DEFAULT_PROPS,
    jsxChildren: '<AstryxBadge label="Beta" variant="info" />',
  },
};
export default meta;

export const AstryxTopNavHeading = {
  name: 'AstryxTopNavHeading',
  render: (args: Args) => (
    <AstryxTopNavHeadingComponent
      heading={asText(args.heading, DEFAULT_PROPS.heading)}
      headingHref={asText(args.headingHref, DEFAULT_PROPS.headingHref)}
      brandDisplay={asOption(args.brandDisplay, ASTRYX_NAV_BRAND_DISPLAYS, DEFAULT_PROPS.brandDisplay)}
      icon={asOption(args.icon, ICONS, DEFAULT_PROPS.icon)}
      logoAlt={asText(args.logoAlt)}
      logoSrc={asText(args.logoSrc)}
      logoText={asText(args.logoText, DEFAULT_PROPS.logoText)}
      subheading={asText(args.subheading, DEFAULT_PROPS.subheading)}
      subheadingHref={asText(args.subheadingHref)}
      symbolAlt={asText(args.symbolAlt)}
      symbolSrc={asText(args.symbolSrc)}
      superheading={asText(args.superheading, DEFAULT_PROPS.superheading)}
      superheadingHref={asText(args.superheadingHref)}
    >
      <AstryxBadge label="Beta" variant="info" />
    </AstryxTopNavHeadingComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
