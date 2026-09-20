import { AstryxButton } from './AstryxButton';
import { AstryxText } from './AstryxText';
import { AstryxTheme as AstryxThemeComponent } from './AstryxTheme';
import { AstryxVStack } from './AstryxVStack';

type Args = Record<string, string>;

const THEMES = ['inherit', 'neutral', 'butter', 'chocolate', 'gothic', 'matcha', 'stone', 'y2k'] as const;
const COLOR_MODES = ['auto', 'light', 'dark'] as const;
const ELEMENTS = ['div', 'main', 'section', 'article', 'header', 'footer', 'aside'] as const;

const DEFAULT_PROPS = {
  as: 'section',
  colorMode: 'auto',
  theme: 'inherit',
} as const;

const meta = {
  title: 'Astryx/Theme',
  component: AstryxThemeComponent,
  args: DEFAULT_PROPS,
  argTypes: {
    as: { control: 'select', options: ELEMENTS },
    colorMode: { control: 'select', options: COLOR_MODES },
    theme: { control: 'select', options: THEMES },
  },
  authoring: {
    group: 'Layout',
  },
  sourceInsert: {
    imports: [
      {
        names: ['AstryxButton'],
        sourceFile: 'src/components/AstryxButton.tsx',
      },
      {
        names: ['AstryxText'],
        sourceFile: 'src/components/AstryxText.tsx',
      },
      {
        names: ['AstryxVStack'],
        sourceFile: 'src/components/AstryxVStack.tsx',
      },
    ],
    props: DEFAULT_PROPS,
    jsxChildren:
      '<AstryxVStack gap="md">\n<AstryxText as="h2" display="block" type="display-3">Theme scope</AstryxText>\n<AstryxText as="p" color="secondary" display="block" type="body">Inherit the Workbench binding, or wrap a region when it needs its own Astryx theme.</AstryxText>\n<AstryxButton label="Use scoped theme" variant="primary" />\n</AstryxVStack>',
  },
};
export default meta;

export const AstryxTheme = {
  name: 'AstryxTheme',
  render: (args: Args) => (
    <AstryxThemeComponent
      as={asOption(args.as, ELEMENTS, DEFAULT_PROPS.as)}
      colorMode={asOption(args.colorMode, COLOR_MODES, DEFAULT_PROPS.colorMode)}
      theme={asOption(args.theme, THEMES, DEFAULT_PROPS.theme)}
    >
      <AstryxVStack gap="md">
        <AstryxText as="h2" display="block" type="display-3">
          Theme scope
        </AstryxText>
        <AstryxText as="p" color="secondary" display="block" type="body">
          Inherit the Workbench binding, or wrap a region when it needs its own Astryx theme.
        </AstryxText>
        <AstryxButton label="Use scoped theme" variant="primary" />
      </AstryxVStack>
    </AstryxThemeComponent>
  ),
};

function asOption<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? (value as T) : fallback;
}
