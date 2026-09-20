import type { InspectorField } from '@domain/design-system/tokens/types';
import type { SourceAttributeName, SourceStyleProperty } from '@domain/document/editableTreeSourceWriteback';
import type { HtmlInspectorCategory, HtmlInspectorModel, HtmlInspectorSectionId } from './htmlInspectorSchema';
import type { InspectorTokenBindingField } from './inspectorEditService';

export type InspectorFieldEditKind =
  | 'read'
  | 'source-attribute'
  | 'source-element-tag'
  | 'source-style'
  | 'text-content'
  | 'token-binding';

export type InspectorFieldControl =
  | {
      kind: 'segmented';
      options: InspectorFieldControlOption[];
    }
  | {
      kind: 'select';
      options: InspectorFieldControlOption[];
      placeholder?: string;
    }
  | {
      kind: 'text';
      placeholder?: string;
    }
  | {
      kind: 'size';
      placeholder?: string;
    };

export type InspectorFieldControlOption = {
  label: string;
  value: string;
};

export type InspectorFieldDescriptor = {
  attributeName?: SourceAttributeName;
  control?: InspectorFieldControl;
  editKind: InspectorFieldEditKind;
  id: string;
  label: string;
  section: HtmlInspectorSectionId;
  styleProperty?: SourceStyleProperty;
  tokenField?: InspectorField;
  tokenBindingField?: InspectorTokenBindingField;
};

type FieldContext = {
  category: HtmlInspectorCategory;
  elementName: string;
};

export function resolveInspectorFieldDescriptors(model: HtmlInspectorModel): InspectorFieldDescriptor[] {
  const context: FieldContext = {
    category: model.category,
    elementName: model.elementName.toLowerCase(),
  };

  return [
    ...(model.sections.includes('content') ? resolveContentFields(context) : []),
    ...model.tokenBindingFields.map(resolveTokenBindingField),
    ...resolveLayoutFields(context),
    ...resolveFlexItemFields(context),
    ...resolveSpacingFields(context),
    ...resolveSizeFields(context),
    ...resolveAppearanceFields(context),
    ...resolveTypographyFields(context),
    ...resolveBackgroundFields(context),
    ...resolveBorderFields(context),
    ...resolveFillFields(context),
    ...resolveStrokeFields(context),
    ...resolveOutlineFields(context),
    ...resolveAccessibilityFields(context),
  ];
}

export function getInspectorSectionFields(
  descriptors: InspectorFieldDescriptor[],
  section: HtmlInspectorSectionId,
): InspectorFieldDescriptor[] {
  return descriptors.filter((descriptor) => descriptor.section === section);
}

/**
 * Token picker field for a raw style declaration. The section resolvers above
 * only cover properties they choose to surface; an inline `style` prop can
 * carry any editable property, and those rows deserve the same picker rather
 * than a bare text input.
 */
const SOURCE_STYLE_TOKEN_FIELD: Partial<Record<SourceStyleProperty, InspectorField>> = {
  'background-color': 'bgColor',
  'border-bottom-color': 'borderColor',
  'border-color': 'borderColor',
  'border-left-color': 'borderColor',
  'border-radius': 'borderRadius',
  'border-right-color': 'borderColor',
  'border-top-color': 'borderColor',
  'border-width': 'borderWidth',
  'color': 'textColor',
  'column-gap': 'gap',
  'fill': 'bgColor',
  'fill-opacity': 'opacity',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'gap': 'gap',
  'height': 'height',
  'letter-spacing': 'letterSpacing',
  'line-height': 'lineHeight',
  'margin': 'margin',
  'max-height': 'maxHeight',
  'max-width': 'maxWidth',
  'min-height': 'minHeight',
  'min-width': 'minWidth',
  'opacity': 'opacity',
  'outline-color': 'borderColor',
  'outline-width': 'borderWidth',
  'padding': 'padding',
  'stroke': 'borderColor',
  'stroke-opacity': 'opacity',
  'stroke-width': 'borderWidth',
  'width': 'width',
};

export function getTokenFieldForSourceStyleProperty(property: SourceStyleProperty): InspectorField | null {
  return SOURCE_STYLE_TOKEN_FIELD[property] ?? null;
}

function resolveContentFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (context.category === 'text') {
    const fields: InspectorFieldDescriptor[] = [];
    if (isHeadingElement(context.elementName)) {
      fields.push({
        control: selectControl([
          ['H1', 'h1'],
          ['H2', 'h2'],
          ['H3', 'h3'],
          ['H4', 'h4'],
          ['H5', 'h5'],
          ['H6', 'h6'],
        ]),
        editKind: 'source-element-tag',
        id: 'content.headingLevel',
        label: 'Level',
        section: 'content',
      });
    }
    fields.push({
      editKind: 'text-content',
      id: 'content.text',
      label: 'Text',
      section: 'content',
    });
    return fields;
  }

  if (context.category === 'interactive') {
    if (context.elementName === 'input') {
      return [
        {
          attributeName: 'value',
          editKind: 'source-attribute',
          id: 'content.value',
          label: 'Value',
          section: 'content',
        },
        {
          attributeName: 'placeholder',
          editKind: 'source-attribute',
          id: 'content.placeholder',
          label: 'Placeholder',
          section: 'content',
        },
        {
          attributeName: 'type',
          editKind: 'source-attribute',
          id: 'content.type',
          label: 'Type',
          section: 'content',
        },
        {
          attributeName: 'name',
          editKind: 'source-attribute',
          id: 'content.name',
          label: 'Name',
          section: 'content',
        },
      ];
    }

    if (context.elementName === 'textarea') {
      return [
        {
          attributeName: 'placeholder',
          editKind: 'source-attribute',
          id: 'content.placeholder',
          label: 'Placeholder',
          section: 'content',
        },
        {
          attributeName: 'name',
          editKind: 'source-attribute',
          id: 'content.name',
          label: 'Name',
          section: 'content',
        },
      ];
    }

    if (context.elementName === 'a') {
      return [{
        attributeName: 'href',
        editKind: 'source-attribute',
        id: 'content.href',
        label: 'Href',
        section: 'content',
      }];
    }

    // For interactive elements that wrap visible text (e.g. <button>, <a>),
    // expose BOTH the visible text content (children) and the a11y label
    // (aria-label). Editing only aria-label is surprising when the user
    // expects to change the visible button text.
    return [
      {
        editKind: 'text-content',
        id: 'content.text',
        label: 'Text',
        section: 'content',
      },
      {
        attributeName: getInteractiveLabelAttribute(context.elementName),
        editKind: 'source-attribute',
        id: 'content.aria-label',
        label: 'A11y label',
        section: 'content',
      },
    ];
  }

  if (context.category === 'media') {
    return [{
      attributeName: getMediaSourceAttribute(context.elementName),
      editKind: 'source-attribute',
      id: 'content.source',
      label: 'Source',
      section: 'content',
    }];
  }

  return [];
}

function isHeadingElement(elementName: string): boolean {
  return elementName === 'h1' || elementName === 'h2' || elementName === 'h3' || elementName === 'h4' || elementName === 'h5' || elementName === 'h6';
}

function resolveTokenBindingField(field: InspectorTokenBindingField): InspectorFieldDescriptor {
  const section: HtmlInspectorSectionId = field === 'background'
    ? 'background'
    : field === 'radius'
      ? 'border'
      : field === 'fontSize'
        ? 'typography'
        : 'spacing';
  return {
    editKind: 'token-binding',
    id: `${section}.${field}`,
    label: formatTokenBindingFieldLabel(field),
    section,
    tokenBindingField: field,
  };
}

function resolveLayoutFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];

  const fields: InspectorFieldDescriptor[] = [
    {
      control: segmentedControl([
        ['Inline', 'inline'],
        ['Block', 'block'],
        ['Inline B', 'inline-block'],
        ['Flex', 'flex'],
        ['Grid', 'grid'],
        ['Clamp', '-webkit-box'],
      ]),
      editKind: 'source-style',
      id: 'layout.flow',
      label: 'Flow',
      section: 'layout',
      styleProperty: 'display',
    },
    {
      control: segmentedControl([
        ['Row', 'row'],
        ['Column', 'column'],
      ]),
      editKind: 'source-style',
      id: 'layout.direction',
      label: 'Direction',
      section: 'layout',
      styleProperty: 'flex-direction',
    },
    {
      control: segmentedControl([
        ['No Wrap', 'nowrap'],
        ['Wrap', 'wrap'],
      ]),
      editKind: 'source-style',
      id: 'layout.wrap',
      label: 'Wrap',
      section: 'layout',
      styleProperty: 'flex-wrap',
    },
    {
      control: segmentedControl([
        ['Start', 'flex-start'],
        ['Center', 'center'],
        ['End', 'flex-end'],
        ['Stretch', 'stretch'],
      ]),
      editKind: 'source-style',
      id: 'layout.align',
      label: 'Align',
      section: 'layout',
      styleProperty: 'align-items',
    },
    {
      control: segmentedControl([
        ['Start', 'flex-start'],
        ['Center', 'center'],
        ['End', 'flex-end'],
        ['Between', 'space-between'],
      ]),
      editKind: 'source-style',
      id: 'layout.justify',
      label: 'Justify',
      section: 'layout',
      styleProperty: 'justify-content',
    },
    {
      control: textControl('0.75rem'),
      editKind: 'source-style',
      id: 'layout.gap',
      label: 'Gap',
      section: 'layout',
      styleProperty: 'gap',
      tokenField: 'gap',
    },
    {
      control: textControl('2'),
      editKind: 'source-style',
      id: 'layout.gridColumns',
      label: 'Columns',
      section: 'layout',
      styleProperty: 'grid-template-columns',
    },
    {
      control: textControl('2'),
      editKind: 'source-style',
      id: 'layout.gridRows',
      label: 'Rows',
      section: 'layout',
      styleProperty: 'grid-template-rows',
    },
    {
      control: selectControl([
        ['Visible', 'visible'],
        ['Hidden', 'hidden'],
        ['Scroll', 'scroll'],
        ['Auto', 'auto'],
      ], 'visible'),
      editKind: 'source-style',
      id: 'layout.overflow',
      label: 'Overflow',
      section: 'layout',
      styleProperty: 'overflow',
    },
    {
      control: segmentedControl([
        ['Auto', 'auto'],
        ['Isolate', 'isolate'],
      ]),
      editKind: 'source-style',
      id: 'layout.isolation',
      label: 'Isolation',
      section: 'layout',
      styleProperty: 'isolation',
    },
    {
      control: segmentedControl([
        ['Static', 'static'],
        ['Relative', 'relative'],
        ['Absolute', 'absolute'],
        ['Sticky', 'sticky'],
      ]),
      editKind: 'source-style',
      id: 'layout.position',
      label: 'Position',
      section: 'layout',
      styleProperty: 'position',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'layout.zIndex',
      label: 'Z',
      section: 'layout',
      styleProperty: 'z-index',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'layout.inset.top',
      label: 'Top',
      section: 'layout',
      styleProperty: 'top',
      tokenField: 'padding',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'layout.inset.right',
      label: 'Right',
      section: 'layout',
      styleProperty: 'right',
      tokenField: 'padding',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'layout.inset.bottom',
      label: 'Bottom',
      section: 'layout',
      styleProperty: 'bottom',
      tokenField: 'padding',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'layout.inset.left',
      label: 'Left',
      section: 'layout',
      styleProperty: 'left',
      tokenField: 'padding',
    },
  ];

  if (context.category === 'media') {
    fields.push(
      {
        attributeName: 'width',
        editKind: 'source-attribute',
        id: 'layout.width',
        label: 'Width',
        section: 'layout',
      },
      {
        attributeName: 'height',
        editKind: 'source-attribute',
        id: 'layout.height',
        label: 'Height',
        section: 'layout',
      },
    );
  }

  return fields;
}

function resolveSpacingFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: textControl('1rem'),
      editKind: 'source-style',
      id: 'spacing.padding',
      label: 'Padding',
      section: 'spacing',
      styleProperty: 'padding',
      tokenField: 'padding',
    },
    ...[
      ['Top', 'padding-top'],
      ['Right', 'padding-right'],
      ['Bottom', 'padding-bottom'],
      ['Left', 'padding-left'],
    ].map(([label, styleProperty]) => ({
      control: textControl('1rem'),
      editKind: 'source-style' as const,
      id: `spacing.padding.${styleProperty.replace('padding-', '')}`,
      label,
      section: 'spacing' as const,
      styleProperty: styleProperty as SourceStyleProperty,
      tokenField: 'padding' as const,
    })),
    {
      control: textControl('1rem'),
      editKind: 'source-style',
      id: 'spacing.margin',
      label: 'Margin',
      section: 'spacing',
      styleProperty: 'margin',
      tokenField: 'margin',
    },
    ...[
      ['Top', 'margin-top'],
      ['Right', 'margin-right'],
      ['Bottom', 'margin-bottom'],
      ['Left', 'margin-left'],
    ].map(([label, styleProperty]) => ({
      control: textControl('1rem'),
      editKind: 'source-style' as const,
      id: `spacing.margin.${styleProperty.replace('margin-', '')}`,
      label,
      section: 'spacing' as const,
      styleProperty: styleProperty as SourceStyleProperty,
      tokenField: 'margin' as const,
    })),
  ];
}

function resolveFlexItemFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: selectControl([
        ['Default', ''],
        ['Fill share', '1 1 0'],
        ['Fit content', '0 0 auto'],
        ['Auto size', '1 1 auto'],
        ['Shrink only', '0 1 auto'],
      ], 'Default'),
      editKind: 'source-style',
      id: 'flexItem.preset',
      label: 'Flex behavior',
      section: 'flexItem',
      styleProperty: 'flex',
    },
    {
      control: sizeControl('auto'),
      editKind: 'source-style',
      id: 'flexItem.basis',
      label: 'Starting size',
      section: 'flexItem',
      styleProperty: 'flex-basis',
      tokenField: 'width',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'flexItem.grow',
      label: 'Grow share',
      section: 'flexItem',
      styleProperty: 'flex-grow',
    },
    {
      control: textControl('1'),
      editKind: 'source-style',
      id: 'flexItem.shrink',
      label: 'Shrink share',
      section: 'flexItem',
      styleProperty: 'flex-shrink',
    },
    {
      control: selectControl([
        ['Parent', 'auto'],
        ['Start', 'flex-start'],
        ['Center', 'center'],
        ['End', 'flex-end'],
        ['Stretch', 'stretch'],
      ], 'Parent'),
      editKind: 'source-style',
      id: 'flexItem.alignSelf',
      label: 'Cross align',
      section: 'flexItem',
      styleProperty: 'align-self',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'flexItem.order',
      label: 'Visual order',
      section: 'flexItem',
      styleProperty: 'order',
    },
  ];
}

function resolveSizeFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: sizeControl('auto'),
      editKind: 'source-style',
      id: 'size.width',
      label: 'Width',
      section: 'size',
      styleProperty: 'width',
      tokenField: 'width',
    },
    {
      control: sizeControl('auto'),
      editKind: 'source-style',
      id: 'size.height',
      label: 'Height',
      section: 'size',
      styleProperty: 'height',
      tokenField: 'height',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'size.minWidth',
      label: 'Min W',
      section: 'size',
      styleProperty: 'min-width',
      tokenField: 'minWidth',
    },
    {
      control: textControl('none'),
      editKind: 'source-style',
      id: 'size.maxWidth',
      label: 'Max W',
      section: 'size',
      styleProperty: 'max-width',
      tokenField: 'maxWidth',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'size.minHeight',
      label: 'Min H',
      section: 'size',
      styleProperty: 'min-height',
      tokenField: 'minHeight',
    },
    {
      control: textControl('none'),
      editKind: 'source-style',
      id: 'size.maxHeight',
      label: 'Max H',
      section: 'size',
      styleProperty: 'max-height',
      tokenField: 'maxHeight',
    },
  ];
}

function resolveAppearanceFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: textControl('100%'),
      editKind: 'source-style',
      id: 'appearance.opacity',
      label: 'Opacity',
      section: 'appearance',
      styleProperty: 'opacity',
      tokenField: 'opacity',
    },
    {
      control: segmentedControl([
        ['Visible', 'visible'],
        ['Hidden', 'hidden'],
      ]),
      editKind: 'source-style',
      id: 'appearance.visibility',
      label: 'Visible',
      section: 'appearance',
      styleProperty: 'visibility',
    },
    {
      control: selectControl([
        ['Normal', 'normal'],
        ['Multiply', 'multiply'],
        ['Screen', 'screen'],
        ['Overlay', 'overlay'],
        ['Darken', 'darken'],
        ['Lighten', 'lighten'],
        ['Dodge', 'color-dodge'],
        ['Burn', 'color-burn'],
        ['Hard', 'hard-light'],
        ['Soft', 'soft-light'],
        ['Diff', 'difference'],
        ['Exclude', 'exclusion'],
        ['Hue', 'hue'],
        ['Sat', 'saturation'],
        ['Color', 'color'],
        ['Luma', 'luminosity'],
      ], 'normal'),
      editKind: 'source-style',
      id: 'appearance.blend',
      label: 'Node blend',
      section: 'appearance',
      styleProperty: 'mix-blend-mode',
    },
  ];
}

function resolveTypographyFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsTypographyStyleFields(context.category)) return [];
  if (context.elementName === 'text') return [];
  return [
    {
      control: textControl('1rem'),
      editKind: 'source-style',
      id: 'typography.fontSize',
      label: 'Size',
      section: 'typography',
      styleProperty: 'font-size',
      tokenField: 'fontSize',
    },
    {
      control: textControl('400'),
      editKind: 'source-style',
      id: 'typography.fontWeight',
      label: 'Weight',
      section: 'typography',
      styleProperty: 'font-weight',
      tokenField: 'fontWeight',
    },
    {
      control: textControl('#0f172a'),
      editKind: 'source-style',
      id: 'typography.color',
      label: 'Color',
      section: 'typography',
      styleProperty: 'color',
      tokenField: 'textColor',
    },
    {
      control: selectControl([
        ['Sans', 'system-ui, sans-serif'],
        ['Serif', 'Georgia, serif'],
        ['Mono', 'ui-monospace, SFMono-Regular, monospace'],
      ], 'system-ui'),
      editKind: 'source-style',
      id: 'typography.fontFamily',
      label: 'Family',
      section: 'typography',
      styleProperty: 'font-family',
    },
    {
      control: segmentedControl([
        ['Left', 'left'],
        ['Center', 'center'],
        ['Right', 'right'],
        ['Justify', 'justify'],
      ]),
      editKind: 'source-style',
      id: 'typography.align',
      label: 'Align',
      section: 'typography',
      styleProperty: 'text-align',
    },
    {
      control: segmentedControl([
        ['Top', 'start'],
        ['Center', 'center'],
        ['Bottom', 'end'],
      ]),
      editKind: 'source-style',
      id: 'typography.verticalAlign',
      label: 'V Align',
      section: 'typography',
      styleProperty: 'align-content',
    },
    {
      control: textControl('1.5'),
      editKind: 'source-style',
      id: 'typography.lineHeight',
      label: 'Line',
      section: 'typography',
      styleProperty: 'line-height',
      tokenField: 'lineHeight',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'typography.indent',
      label: 'Indent',
      section: 'typography',
      styleProperty: 'text-indent',
    },
    {
      control: textControl('0em'),
      editKind: 'source-style',
      id: 'typography.letterSpacing',
      label: 'Tracking',
      section: 'typography',
      styleProperty: 'letter-spacing',
      tokenField: 'letterSpacing',
    },
    {
      control: segmentedControl([
        ['None', 'none'],
        ['Upper', 'uppercase'],
        ['Lower', 'lowercase'],
        ['Title', 'capitalize'],
      ]),
      editKind: 'source-style',
      id: 'typography.transform',
      label: 'Case',
      section: 'typography',
      styleProperty: 'text-transform',
    },
    {
      control: segmentedControl([
        ['None', 'none'],
        ['Underline', 'underline'],
        ['Strike', 'line-through'],
      ]),
      editKind: 'source-style',
      id: 'typography.decoration',
      label: 'Decor',
      section: 'typography',
      styleProperty: 'text-decoration',
    },
    {
      control: segmentedControl([
        ['Normal', 'normal'],
        ['Italic', 'italic'],
      ]),
      editKind: 'source-style',
      id: 'typography.style',
      label: 'Style',
      section: 'typography',
      styleProperty: 'font-style',
    },
    {
      control: segmentedControl([
        ['normal', 'normal'],
        ['nowrap', 'nowrap'],
        ['pre-wrap', 'pre-wrap'],
      ]),
      editKind: 'source-style',
      id: 'typography.wrap',
      label: 'Wrap',
      section: 'typography',
      styleProperty: 'white-space',
    },
    {
      control: segmentedControl([
        ['Normal', 'normal'],
        ['Word', 'break-word'],
        ['Anywhere', 'anywhere'],
      ]),
      editKind: 'source-style',
      id: 'typography.overflowWrap',
      label: 'Overflow wrap',
      section: 'typography',
      styleProperty: 'overflow-wrap',
    },
    {
      control: selectControl([
        ['Normal', 'normal'],
        ['Break all', 'break-all'],
        ['Keep all', 'keep-all'],
        ['Break word', 'break-word'],
      ], 'normal'),
      editKind: 'source-style',
      id: 'typography.wordBreak',
      label: 'Word break',
      section: 'typography',
      styleProperty: 'word-break',
    },
    {
      control: segmentedControl([
        ['Manual', 'manual'],
        ['Auto', 'auto'],
        ['None', 'none'],
      ]),
      editKind: 'source-style',
      id: 'typography.hyphens',
      label: 'Hyphens',
      section: 'typography',
      styleProperty: 'hyphens',
    },
    {
      control: segmentedControl([
        ['clip', 'clip'],
        ['ellipsis', 'ellipsis'],
      ]),
      editKind: 'source-style',
      id: 'typography.truncate',
      label: 'Truncate',
      section: 'typography',
      styleProperty: 'text-overflow',
    },
    {
      control: textControl('3'),
      editKind: 'source-style',
      id: 'typography.lineClamp',
      label: 'Clamp lines',
      section: 'typography',
      styleProperty: '-webkit-line-clamp',
    },
    {
      control: segmentedControl([
        ['Vertical', 'vertical'],
        ['Horizontal', 'horizontal'],
      ]),
      editKind: 'source-style',
      id: 'typography.clampOrient',
      label: 'Clamp flow',
      section: 'typography',
      styleProperty: '-webkit-box-orient',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'typography.columns.count',
      label: 'Columns',
      section: 'typography',
      styleProperty: 'column-count',
    },
    {
      control: textControl('auto'),
      editKind: 'source-style',
      id: 'typography.columns.width',
      label: 'Col width',
      section: 'typography',
      styleProperty: 'column-width',
    },
    {
      control: textControl('1.5rem'),
      editKind: 'source-style',
      id: 'typography.columns.gap',
      label: 'Col gap',
      section: 'typography',
      styleProperty: 'column-gap',
      tokenField: 'gap',
    },
    {
      control: textControl('none'),
      editKind: 'source-style',
      id: 'typography.columns.rule',
      label: 'Col rule',
      section: 'typography',
      styleProperty: 'column-rule',
    },
    {
      control: segmentedControl([
        ['Balance', 'balance'],
        ['Auto', 'auto'],
      ]),
      editKind: 'source-style',
      id: 'typography.columns.fill',
      label: 'Col fill',
      section: 'typography',
      styleProperty: 'column-fill',
    },
  ];
}

function resolveBackgroundFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: textControl('#ffffff'),
      editKind: 'source-style',
      id: 'background.fill',
      label: 'Fill',
      section: 'background',
      styleProperty: 'background',
      tokenField: 'bgColor',
    },
    {
      control: textControl('none'),
      editKind: 'source-style',
      id: 'background.image',
      label: 'Image',
      section: 'background',
      styleProperty: 'background-image',
    },
    {
      control: selectControl([
        ['Auto', 'auto'],
        ['Cover', 'cover'],
        ['Contain', 'contain'],
      ], 'auto'),
      editKind: 'source-style',
      id: 'background.size',
      label: 'Size',
      section: 'background',
      styleProperty: 'background-size',
    },
    {
      control: selectControl([
        ['Center', 'center'],
        ['Top', 'top'],
        ['Right', 'right'],
        ['Bottom', 'bottom'],
        ['Left', 'left'],
        ['Top L', 'top left'],
        ['Top R', 'top right'],
        ['Bot L', 'bottom left'],
        ['Bot R', 'bottom right'],
      ], 'center'),
      editKind: 'source-style',
      id: 'background.position',
      label: 'Position',
      section: 'background',
      styleProperty: 'background-position',
    },
    {
      control: segmentedControl([
        ['No', 'no-repeat'],
        ['Repeat', 'repeat'],
        ['X', 'repeat-x'],
        ['Y', 'repeat-y'],
      ]),
      editKind: 'source-style',
      id: 'background.repeat',
      label: 'Repeat',
      section: 'background',
      styleProperty: 'background-repeat',
    },
    {
      control: segmentedControl([
        ['Scroll', 'scroll'],
        ['Fixed', 'fixed'],
        ['Local', 'local'],
      ]),
      editKind: 'source-style',
      id: 'background.attachment',
      label: 'Attach',
      section: 'background',
      styleProperty: 'background-attachment',
    },
    {
      control: selectControl([
        ['Normal', 'normal'],
        ['Multiply', 'multiply'],
        ['Screen', 'screen'],
        ['Overlay', 'overlay'],
        ['Darken', 'darken'],
        ['Lighten', 'lighten'],
        ['Dodge', 'color-dodge'],
        ['Burn', 'color-burn'],
        ['Hard', 'hard-light'],
        ['Soft', 'soft-light'],
        ['Diff', 'difference'],
        ['Exclude', 'exclusion'],
        ['Hue', 'hue'],
        ['Sat', 'saturation'],
        ['Color', 'color'],
        ['Luma', 'luminosity'],
      ], 'normal'),
      editKind: 'source-style',
      id: 'background.blend',
      label: 'Blend',
      section: 'background',
      styleProperty: 'background-blend-mode',
    },
  ];
}

function resolveBorderFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: textControl('0.5rem'),
      editKind: 'source-style',
      id: 'border.radius',
      label: 'Radius',
      section: 'border',
      styleProperty: 'border-radius',
      tokenField: 'borderRadius',
    },
    ...[
      ['Top L', 'border-top-left-radius'],
      ['Top R', 'border-top-right-radius'],
      ['Bot L', 'border-bottom-left-radius'],
      ['Bot R', 'border-bottom-right-radius'],
    ].map(([label, styleProperty]) => ({
      control: textControl('0.5rem'),
      editKind: 'source-style' as const,
      id: `border.radius.${styleProperty.replace('border-', '').replace('-radius', '')}`,
      label,
      section: 'border' as const,
      styleProperty: styleProperty as SourceStyleProperty,
      tokenField: 'borderRadius' as const,
    })),
    {
      control: textControl('1px'),
      editKind: 'source-style',
      id: 'border.width',
      label: 'Width',
      section: 'border',
      styleProperty: 'border-width',
      tokenField: 'borderWidth',
    },
    {
      control: textControl('#d1d5db'),
      editKind: 'source-style',
      id: 'border.color',
      label: 'Color',
      section: 'border',
      styleProperty: 'border-color',
      tokenField: 'borderColor',
    },
    {
      control: segmentedControl([
        ['Solid', 'solid'],
        ['Dashed', 'dashed'],
        ['None', 'none'],
      ]),
      editKind: 'source-style',
      id: 'border.style',
      label: 'Style',
      section: 'border',
      styleProperty: 'border-style',
    },
    ...[
      ['Top', 'border-top'],
      ['Right', 'border-right'],
      ['Bottom', 'border-bottom'],
      ['Left', 'border-left'],
    ].map(([label, styleProperty]) => ({
      control: textControl('1px solid #d1d5db'),
      editKind: 'source-style' as const,
      id: `border.side.${styleProperty.replace('border-', '')}`,
      label,
      section: 'border' as const,
      styleProperty: styleProperty as SourceStyleProperty,
    })),
    {
      control: textControl('none'),
      editKind: 'source-style',
      id: 'border.shadow',
      label: 'Shadow',
      section: 'border',
      styleProperty: 'box-shadow',
    },
  ];
}

function resolveFillFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsVectorStyleFields(context)) return [];
  return [
    {
      control: textControl('currentColor'),
      editKind: 'source-style',
      id: 'fill.color',
      label: 'Color',
      section: 'fill',
      styleProperty: 'fill',
      tokenField: 'bgColor',
    },
    {
      control: textControl('1'),
      editKind: 'source-style',
      id: 'fill.opacity',
      label: 'Opacity',
      section: 'fill',
      styleProperty: 'fill-opacity',
      tokenField: 'opacity',
    },
    {
      control: segmentedControl([
        ['Nonzero', 'nonzero'],
        ['Evenodd', 'evenodd'],
      ]),
      editKind: 'source-style',
      id: 'fill.rule',
      label: 'Rule',
      section: 'fill',
      styleProperty: 'fill-rule',
    },
  ];
}

function resolveStrokeFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsVectorStyleFields(context)) return [];
  return [
    {
      control: textControl('currentColor'),
      editKind: 'source-style',
      id: 'stroke.color',
      label: 'Color',
      section: 'stroke',
      styleProperty: 'stroke',
      tokenField: 'borderColor',
    },
    {
      control: textControl('2'),
      editKind: 'source-style',
      id: 'stroke.width',
      label: 'Width',
      section: 'stroke',
      styleProperty: 'stroke-width',
      tokenField: 'borderWidth',
    },
    {
      control: textControl('1'),
      editKind: 'source-style',
      id: 'stroke.opacity',
      label: 'Opacity',
      section: 'stroke',
      styleProperty: 'stroke-opacity',
      tokenField: 'opacity',
    },
    {
      control: textControl('4 2'),
      editKind: 'source-style',
      id: 'stroke.dasharray',
      label: 'Dash',
      section: 'stroke',
      styleProperty: 'stroke-dasharray',
    },
    {
      control: segmentedControl([
        ['Butt', 'butt'],
        ['Round', 'round'],
        ['Square', 'square'],
      ]),
      editKind: 'source-style',
      id: 'stroke.linecap',
      label: 'Cap',
      section: 'stroke',
      styleProperty: 'stroke-linecap',
    },
    {
      control: segmentedControl([
        ['Miter', 'miter'],
        ['Round', 'round'],
        ['Bevel', 'bevel'],
      ]),
      editKind: 'source-style',
      id: 'stroke.linejoin',
      label: 'Join',
      section: 'stroke',
      styleProperty: 'stroke-linejoin',
    },
  ];
}

function resolveOutlineFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (!supportsBoxStyleFields(context)) return [];
  return [
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'outline.width',
      label: 'Width',
      section: 'outline',
      styleProperty: 'outline-width',
      tokenField: 'borderWidth',
    },
    {
      control: textControl('#d1d5db'),
      editKind: 'source-style',
      id: 'outline.color',
      label: 'Color',
      section: 'outline',
      styleProperty: 'outline-color',
      tokenField: 'borderColor',
    },
    {
      control: segmentedControl([
        ['Solid', 'solid'],
        ['Dashed', 'dashed'],
        ['None', 'none'],
      ]),
      editKind: 'source-style',
      id: 'outline.style',
      label: 'Style',
      section: 'outline',
      styleProperty: 'outline-style',
    },
    {
      control: textControl('0'),
      editKind: 'source-style',
      id: 'outline.offset',
      label: 'Offset',
      section: 'outline',
      styleProperty: 'outline-offset',
      tokenField: 'borderWidth',
    },
  ];
}

function resolveAccessibilityFields(context: FieldContext): InspectorFieldDescriptor[] {
  if (context.category === 'interactive') {
    return [
      {
        editKind: 'read',
        id: 'a11y.native',
        label: 'Native',
        section: 'accessibility',
      },
      {
        attributeName: 'aria-label',
        editKind: 'source-attribute',
        id: 'a11y.name',
        label: 'Name',
        section: 'accessibility',
      },
      {
        attributeName: 'role',
        editKind: 'source-attribute',
        id: 'a11y.role',
        label: 'Role',
        section: 'accessibility',
      },
    ];
  }

  if (context.category === 'media') {
    const fields: InspectorFieldDescriptor[] = [];
    if (context.elementName === 'img') {
      fields.push({
        attributeName: 'alt',
        editKind: 'source-attribute',
        id: 'a11y.alt',
        label: 'Alt',
        section: 'accessibility',
      });
    }
    fields.push(
      {
        attributeName: 'role',
        editKind: 'source-attribute',
        id: 'a11y.role',
        label: 'Role',
        section: 'accessibility',
      },
    );
    return fields;
  }

  if (context.category === 'text') {
    return [{
      editKind: 'read',
      id: 'a11y.native',
      label: 'Native',
      section: 'accessibility',
    }];
  }

  if (context.category === 'component') {
    return [
      {
        attributeName: 'aria-label',
        editKind: 'source-attribute',
        id: 'a11y.name',
        label: 'Name',
        section: 'accessibility',
      },
      {
        attributeName: 'role',
        editKind: 'source-attribute',
        id: 'a11y.role',
        label: 'Role',
        section: 'accessibility',
      },
    ];
  }

  if (context.category === 'container') {
    return [
      {
        attributeName: 'aria-label',
        editKind: 'source-attribute',
        id: 'a11y.name',
        label: 'Name',
        section: 'accessibility',
      },
      {
        attributeName: 'role',
        editKind: 'source-attribute',
        id: 'a11y.role',
        label: 'Role',
        section: 'accessibility',
      },
      {
        attributeName: 'title',
        editKind: 'source-attribute',
        id: 'a11y.title',
        label: 'Title',
        section: 'accessibility',
      },
    ];
  }

  return [];
}

function getInteractiveLabelAttribute(elementName: string): SourceAttributeName {
  if (elementName === 'input' || elementName === 'textarea') return 'placeholder';
  return 'aria-label';
}

function getMediaSourceAttribute(elementName: string): SourceAttributeName {
  return 'src';
}

function formatTokenBindingFieldLabel(field: InspectorTokenBindingField): string {
  if (field === 'background') return 'Background';
  if (field === 'radius') return 'Radius';
  if (field === 'fontSize') return 'Font size';
  return 'Spacing';
}

function supportsBoxStyleFields(context: FieldContext): boolean {
  if (context.category === 'text') return context.elementName !== 'text';
  return (
    context.category === 'container' ||
    context.category === 'interactive' ||
    context.category === 'component' ||
    context.category === 'media'
  );
}

function supportsVectorStyleFields(context: FieldContext): boolean {
  if (context.category !== 'media') return false;
  return [
    'circle',
    'ellipse',
    'g',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect',
    'svg',
    'use',
  ].includes(context.elementName.toLowerCase());
}

function supportsTypographyStyleFields(category: HtmlInspectorCategory): boolean {
  return category === 'container' || category === 'interactive' || category === 'text' || category === 'component';
}

function textControl(placeholder?: string): InspectorFieldControl {
  return {
    kind: 'text',
    ...(placeholder ? { placeholder } : {}),
  };
}

function sizeControl(placeholder?: string): InspectorFieldControl {
  return {
    kind: 'size',
    ...(placeholder ? { placeholder } : {}),
  };
}

function segmentedControl(options: Array<[label: string, value: string]>): InspectorFieldControl {
  return {
    kind: 'segmented',
    options: options.map(([label, value]) => ({ label, value })),
  };
}

function selectControl(options: Array<[label: string, value: string]>, placeholder?: string): InspectorFieldControl {
  return {
    kind: 'select',
    options: options.map(([label, value]) => ({ label, value })),
    ...(placeholder ? { placeholder } : {}),
  };
}
