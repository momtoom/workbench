/**
 * CSS class effectiveness is deliberately bounded to the selected root.
 * Exercise local class declarations, inline Inspector styles, conditional
 * selectors, media queries, and shorthand behavior without reading CSSOM.
 */
import { assert } from '../helpers.mjs';

export const fixture = 'SHADCN-002';

export default async function cssClassEffectivenessSpec({ page, baseUrl }) {
  // Load the module URL itself so this low-level CSSOM regression does not
  // depend on the current project/page selection or boot the editor runtime.
  await page.goto(
    `${baseUrl}/src/domain/preview/cssClassEffectiveness.ts`,
    { waitUntil: 'domcontentloaded', timeout: 60000 },
  );

  const result = await page.evaluate(async () => {
    const {
      analyzeCssClassEffectiveness,
      analyzeCssClassEffectivenessAsync,
    } = await import('/src/domain/preview/cssClassEffectiveness.ts');

    document.querySelector('#wb-css-effectiveness-test-root')?.remove();

    const root = document.createElement('div');
    root.id = 'wb-css-effectiveness-test-root';
    root.style.cssText = 'position:fixed;left:-10000px;top:0;';
    document.body.append(root);

    const selectorFor = (className, suffix = '') => `.${CSS.escape(className)}${suffix}`;
    const localRules = [
      { className: 'ce-applied', declarations: ['color: rgb(11, 22, 33)'], order: 0, selector: selectorFor('ce-applied') },
      { className: 'ce-overridden', declarations: ['border-color: rgb(170, 10, 10)'], order: 1, selector: selectorFor('ce-overridden') },
      { className: 'ce-partial', declarations: ['padding: 10px'], order: 2, selector: selectorFor('ce-partial') },
      { className: 'hover:ce-inactive', declarations: ['opacity: 0.25'], order: 3, selector: selectorFor('hover:ce-inactive', ':hover') },
      { className: 'data-state:ce-inactive', declarations: ['width: 77px'], order: 4, selector: selectorFor('data-state:ce-inactive', '[data-state="open"]') },
      { className: 'md:ce-inactive', declarations: ['max-width: 55px'], media: '(min-width: 9999px)', order: 5, selector: selectorFor('md:ce-inactive') },
      { className: 'ce-descendant-dependent', declarations: ['min-height: 88px'], order: 6, selector: `${selectorFor('ce-descendant-dependent')}:has(.ce-child)` },
    ];

    const analyze = (classNames, renderedClassName, attributes = {}) => {
      const element = document.createElement('button');
      element.className = renderedClassName;
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }
      root.append(element);
      return analyzeCssClassEffectiveness({
        classNames,
        componentName: 'FixtureButton',
        element,
        layerId: `fixture-${classNames.join('-')}`,
        localRules,
        sourceClassName: classNames.join(' '),
      }).entries[0];
    };

    const entries = {
      applied: analyze(['ce-applied'], 'ce-applied'),
      overridden: analyze(['ce-overridden'], 'ce-overridden', { style: 'border-color: rgb(10, 20, 170) !important' }),
      notForwarded: analyze(['ce-not-forwarded'], 'ce-rendered-other'),
      hoverInactive: analyze(['hover:ce-inactive'], 'hover:ce-inactive'),
      mediaInactive: analyze(['md:ce-inactive'], 'md:ce-inactive'),
      dataInactive: analyze(
        ['data-state:ce-inactive'],
        'data-state:ce-inactive',
        { 'data-state': 'closed' },
      ),
      partial: analyze(['ce-partial'], 'ce-partial', { style: 'padding-left: 2px !important' }),
      unverified: analyze(['ce-no-rule'], 'ce-no-rule'),
    };
    const descendantDependentElement = document.createElement('section');
    descendantDependentElement.className = 'ce-descendant-dependent';
    const descendant = document.createElement('span');
    descendant.className = 'ce-child';
    descendantDependentElement.append(descendant);
    root.append(descendantDependentElement);
    entries.descendantDependent = analyzeCssClassEffectiveness({
      classNames: ['ce-descendant-dependent'],
      componentName: 'LargeFixture',
      element: descendantDependentElement,
      layerId: 'fixture-descendant-dependent',
      localRules,
      sourceClassName: 'ce-descendant-dependent',
    }).entries[0];
    const largeElement = document.createElement('section');
    largeElement.className = 'ce-large-root';
    largeElement.replaceChildren(...Array.from({ length: 2_000 }, () => document.createElement('span')));
    root.append(largeElement);
    const largeAnalysisStartedAt = performance.now();
    const largeEntry = analyzeCssClassEffectiveness({
      classNames: ['ce-large-root'],
      componentName: 'Theme',
      element: largeElement,
      layerId: 'fixture-large-root',
      localRules: [{
        className: 'ce-large-root',
        declarations: ['background-color: red'],
        order: 0,
        selector: `${selectorFor('ce-large-root')} .ce-child`,
      }],
      sourceClassName: 'ce-large-root',
    }).entries[0];
    entries.largeRoot = {
      elapsed: performance.now() - largeAnalysisStartedAt,
      entry: largeEntry,
    };
    const safetyStopStartedAt = performance.now();
    try {
      await analyzeCssClassEffectivenessAsync({
        classNames: ['ce-applied'],
        element: largeElement,
        layerId: 'fixture-safety-stop',
        localRules: Array.from({ length: 513 }, (_item, order) => ({
          className: 'ce-applied',
          declarations: ['color: red'],
          order,
          selector: selectorFor('ce-applied'),
        })),
        sourceClassName: 'ce-applied',
      });
      entries.safetyStop = { elapsed: performance.now() - safetyStopStartedAt, name: 'none' };
    } catch (error) {
      entries.safetyStop = {
        elapsed: performance.now() - safetyStopStartedAt,
        name: error instanceof DOMException ? error.name : 'unknown',
      };
    }

    root.remove();
    return entries;
  });

  assert(result.applied.status === 'applied', `ordinary rule is applied (${JSON.stringify(result.applied)})`);
  assert(
    result.overridden.status === 'overridden' &&
      result.overridden.reason.includes('inline style'),
    `an inline Inspector style overrides the class (${JSON.stringify(result.overridden)})`,
  );
  assert(
    result.notForwarded.status === 'not-forwarded',
    `a source-only token is not forwarded (${JSON.stringify(result.notForwarded)})`,
  );
  assert(
    result.hoverInactive.status === 'inactive',
    `hover variant is inactive, not overridden (${JSON.stringify(result.hoverInactive)})`,
  );
  assert(
    result.mediaInactive.status === 'inactive' &&
      result.mediaInactive.reason.includes('breakpoint'),
    `responsive variant is inactive at this viewport (${JSON.stringify(result.mediaInactive)})`,
  );
  assert(
    result.dataInactive.status === 'inactive',
    `data variant is inactive for the current state (${JSON.stringify(result.dataInactive)})`,
  );
  assert(
    result.partial.status === 'partially-overridden' &&
      result.partial.appliedProperties.includes('padding-top') &&
      result.partial.overriddenProperties.includes('padding-left'),
    `shorthand is partially overridden by longhand (${JSON.stringify(result.partial)})`,
  );
  assert(
    result.unverified.status === 'unverified',
    `a rendered token without an inspectable rule stays unverified (${JSON.stringify(result.unverified)})`,
  );
  assert(
    result.descendantDependent.status === 'unverified',
    `a descendant-dependent selector stays unverified without inspecting the selected subtree (${JSON.stringify(result.descendantDependent)})`,
  );
  assert(
    result.largeRoot.entry.status === 'unverified' && result.largeRoot.elapsed < 250,
    `a Theme-sized root stays bounded when its rule needs descendant context (${JSON.stringify(result.largeRoot)})`,
  );
  assert(
    result.safetyStop.name === 'TimeoutError' && result.safetyStop.elapsed < 250,
    `oversized analysis stops itself before blocking selection (${JSON.stringify(result.safetyStop)})`,
  );
}
