import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createInitialTokenRegistry } from './workbench-template.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const tokenSourceDir = path.join(root, 'src/domain/design-system/tokens');
const tempRoot = mkdtempSync(path.join(tmpdir(), 'wb-token-regressions-'));
const outDir = path.join(tempRoot, 'dist');

try {
  mkdirSync(outDir, { recursive: true });
  const sources = readdirSync(tokenSourceDir)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => path.join(tokenSourceDir, file));

  execFileSync(
    path.join(root, 'node_modules/.bin/tsc'),
    [
      '--target', 'ES2020',
      '--module', 'CommonJS',
      '--moduleResolution', 'Node',
      '--rootDir', tokenSourceDir,
      '--outDir', outDir,
      '--skipLibCheck',
      '--strict',
      ...sources,
    ],
    { cwd: root, stdio: 'pipe' },
  );

  const require = createRequire(path.join(outDir, 'check.cjs'));
  const { resolveTokenValue } = require(path.join(outDir, 'resolver.js'));
  const { validateTokenForField } = require(path.join(outDir, 'compatibility.js'));
  const { buildTailwindTokenBuckets, buildWorkbenchTokenCss } = require(path.join(outDir, 'cssExport.js'));
  const { collectTokenValueReferences } = require(path.join(outDir, 'referenceGraph.js'));
  const { getTokenPreviewCss, queryTokens } = require(path.join(outDir, 'query.js'));
  const { importTokensFromSource } = require(path.join(outDir, 'importSource.js'));
  const { buildTokenUsageIndex, getTokenFieldScopeUsages, getTokenReferenceUsages, getTokenScopeFieldScopeUsages, getTokenSourceUsages } = require(path.join(outDir, 'usageIndex.js'));
  const {
    getAvailableGroupScopeFields,
    getFieldScopeCollections,
    getFieldScopeGroups,
    reconcileTokenFieldScopeFilter,
    setTokenFieldScope,
  } = require(path.join(outDir, 'fieldScopes.js'));
  const { addMode, changeTokenType, createCollection, createGroup, createToken, deleteCollection, deleteGroup, deleteToken, deleteTokens, duplicateCollection, duplicateGroup, duplicateToken, duplicateTokens, mergeTokenRegistryImports, moveTokensToGroup, normalizeImportedRegistry, pasteTokens, renameCollection, renameGroup, renameMode, renameToken, reorderCollections, reorderGroups, reorderModes, setActiveMode, setGroupCollapsed } = require(path.join(outDir, 'operations.js'));

  checkCreateCollectionAvoidsDeletedIdCollision(createCollection, deleteCollection);
  checkWorkbenchTemplateIncludesBundledComponentTokens(buildWorkbenchTokenCss, getTokenPreviewCss, queryTokens);
  checkCreateModeGroupAndTokenUseStableUniqueIds(addMode, createGroup, createToken);
  checkCollectionScopedCycle(resolveTokenValue);
  checkPickerSurvivesExistingCycles(queryTokens);
  checkMeshBackgroundCleanup(deleteToken, collectTokenValueReferences);
  checkDuplicateCollectionRetargetsReferences(duplicateCollection, collectTokenValueReferences);
  checkDuplicateCollectionLeavesFieldScopesUnchanged(duplicateCollection, buildTailwindTokenBuckets);
  checkDuplicateOperationsUseStableUniqueIds(duplicateCollection, duplicateGroup, duplicateToken);
  checkMultiTokenCopyOperations(duplicateTokens, pasteTokens, deleteTokens, collectTokenValueReferences);
  checkModeNamesAndActiveModeStayUsable(addMode, renameMode, setActiveMode);
  checkCollectionGroupAndModeReorder(reorderCollections, reorderGroups, reorderModes);
  checkChangeTokenTypeResetsModeValues(changeTokenType);
  checkCollectionAndGroupNamesStayUsable(createCollection, createGroup, duplicateCollection, duplicateGroup, renameCollection, renameGroup);
  checkGroupCollapseIsScoped(setGroupCollapsed);
  checkTokenNamesStayUnique(createToken, duplicateGroup, duplicateToken, renameToken);
  checkGroupDeleteCleansFieldScopes(deleteGroup);
  checkDuplicateGroupCopiesFieldScopes(duplicateGroup);
  checkUsageIndexIncludesTokenRefsAndFieldScopes(buildTokenUsageIndex, getTokenFieldScopeUsages, getTokenReferenceUsages, getTokenScopeFieldScopeUsages, getTokenSourceUsages);
  checkExplicitUnitTokenExports(buildTailwindTokenBuckets, validateTokenForField);
  checkWorkbenchTokenCssExport(buildWorkbenchTokenCss);
  checkAstryxThemeTokenCssExport(buildWorkbenchTokenCss);
  checkTailwindThemeOverrideCssExport(buildWorkbenchTokenCss);
  checkTailwindThemePickerUsesExportedCssVariables(queryTokens);
  checkTailwindThemeSemanticNormalization(normalizeImportedRegistry, buildWorkbenchTokenCss);
  checkTailwindSyncParsesCssLikeCascade();
  checkWorkbenchTokenCssReferenceExport(buildWorkbenchTokenCss);
  checkFieldScopesRespectGroupSubsets(buildTailwindTokenBuckets);
  checkSurfaceAliasesFollowColorMode(resolveTokenValue);
  checkFieldScopeParentContract(getAvailableGroupScopeFields, setTokenFieldScope);
  checkFieldScopeFilterReconciliation(getFieldScopeCollections, getFieldScopeGroups, reconcileTokenFieldScopeFilter);
  checkImportedTokenNamesAreSafe(importTokensFromSource);
  checkImportedCssGradientsBecomeEditable(importTokensFromSource);
  checkImportedLibraryCssUsesLibraryCollection(importTokensFromSource);
  checkTokenRegistryImportMergePreservesLocalEdits(mergeTokenRegistryImports);
  checkLegacyGradientStringsNormalize(normalizeImportedRegistry);
  checkLegacyImportedCssTokensMigrateToLibraryCollections(normalizeImportedRegistry);
  checkMoveTokensPreservesRelativeOrder(moveTokensToGroup);

  console.log('Token regression checks passed.');
} finally {
  if (existsSync(tempRoot)) rmSync(tempRoot, { recursive: true, force: true });
}

function checkCreateCollectionAvoidsDeletedIdCollision(createCollection, deleteCollection) {
  const registry = createRegistry([
    collection('collection-1', []),
    collection('collection-2', []),
  ]);
  const afterDelete = deleteCollection(registry, 'collection-1');
  const result = withMockedTokenIds(['2', 'unique'], () => createCollection(afterDelete));
  const ids = result.registry.collections.map((candidate) => candidate.id);
  assert(new Set(ids).size === ids.length, 'create collection should not reuse an existing collection id after deletion');
  assert(result.collection.id === 'collection-unique', 'create collection should retry when generated id already exists');
}

function checkWorkbenchTemplateIncludesBundledComponentTokens(buildWorkbenchTokenCss, getTokenPreviewCss, queryTokens) {
  const registry = createInitialTokenRegistry({ templateId: 'shadcn-base' });
  const primitives = registry.collections.find((candidate) => candidate.id === 'tailwind-primitives');
  const collection = registry.collections.find((candidate) => candidate.id === 'workbench-components');
  const semanticColor = registry.collections.find((candidate) => candidate.id === 'workbench-semantic-color');
  const semanticRadius = registry.collections.find((candidate) => candidate.id === 'workbench-semantic-radius');
  const semanticEffect = registry.collections.find((candidate) => candidate.id === 'workbench-semantic-effect');
  const semanticTypography = registry.collections.find((candidate) => candidate.id === 'workbench-semantic-typography');
  const semanticSpacing = registry.collections.find((candidate) => candidate.id === 'workbench-semantic-spacing');
  assert(primitives, 'workbench template should include primitive tokens');
  assert(collection, 'workbench template should include bundled component tokens');
  assert(semanticColor, 'workbench template should include semantic color tokens');
  assert(semanticRadius, 'workbench template should include semantic radius tokens');
  assert(semanticEffect, 'workbench template should include semantic effect tokens');
  assert(semanticTypography, 'workbench template should include semantic typography tokens');
  assert(semanticSpacing, 'workbench template should include semantic spacing tokens');
  assert(semanticColor.modes.map((mode) => mode.id).join(',') === 'light,dark', 'semantic color should include light and dark modes');
  assert(semanticRadius.modes.map((mode) => mode.id).join(',') === 'base,compact,flat', 'semantic radius should include density modes');
  assert(semanticEffect.modes.map((mode) => mode.id).join(',') === 'light,dark', 'semantic effect should include light and dark modes');
  assert(semanticTypography.modes.map((mode) => mode.id).join(',') === 'base,compact', 'semantic typography should include density modes');
  assert(semanticSpacing.modes.map((mode) => mode.id).join(',') === 'base,compact', 'semantic spacing should include density modes');
  assert(primitives.tokens.length >= 400, 'primitive tokens should include the Tailwind default theme scale');
  assert(primitives.tokens.some((candidate) => candidate.id === 'blue-600'), 'primitive tokens should include palette tokens');
  assert(primitives.tokens.some((candidate) => candidate.id === 'space-4'), 'primitive tokens should include spacing tokens');
  assert(primitives.tokens.some((candidate) => candidate.id === 'text-base'), 'primitive tokens should include typography tokens');
  assert(primitives.tokens.some((candidate) => candidate.id === 'shadow-lg'), 'primitive tokens should include shadow tokens');
  assert(primitives.tokens.some((candidate) => candidate.id === 'duration-150'), 'primitive tokens should include duration tokens');
  assert(primitives.tokens.some((candidate) => candidate.id === 'ease-out'), 'primitive tokens should include easing tokens');
  assert(collection.groups.length >= 55, 'bundled component tokens should include the full shadcn-base component catalog groups');
  assert(collection.tokens.length >= 550, 'bundled component tokens should expose a broad component styling surface');
  assert(collection.tokens.some((candidate) => candidate.id === 'button-height-md'), 'bundled tokens should include button component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'card-padding'), 'bundled tokens should include card component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'input-height'), 'bundled tokens should include input component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'progress-track-height'), 'bundled tokens should include progress component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'dialog-padding'), 'bundled tokens should include dialog component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'dropdown-menu-item-height'), 'bundled tokens should include dropdown menu component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'tabs-trigger-height'), 'bundled tokens should include tabs component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'select-trigger-height'), 'bundled tokens should include select component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'checkbox-size'), 'bundled tokens should include checkbox component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'switch-track-width'), 'bundled tokens should include switch component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'tooltip-background'), 'bundled tokens should include tooltip component tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'button-press-offset'), 'bundled tokens should include button press feedback tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'carousel-control-border'), 'bundled tokens should include carousel control state tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'sidebar-item-height-lg'), 'bundled tokens should include sidebar item density tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'sidebar-item-icon-size-lg'), 'bundled tokens should include sidebar item icon density tokens');
  for (const tokenId of [
    'button-height-xs',
    'button-height-sm',
    'button-height-md',
    'button-height-lg',
    'button-press-offset',
    'sidebar-collapsed-width-sm',
    'sidebar-collapsed-item-size-lg',
    'sidebar-item-height-lg',
    'sidebar-item-gap-md',
    'sidebar-item-icon-size-lg',
  ]) {
    const token = collection.tokens.find((candidate) => candidate.id === tokenId);
    assert(token, `bundled tokens should include ${tokenId}`);
    assert(
      Object.values(token.values).every((value) => value.kind === 'ref' && value.collectionId === 'workbench-semantic-spacing'),
      `${tokenId} must reference semantic spacing instead of owning a duplicate raw value`,
    );
  }
  for (const tokenId of ['control-height-xs', 'control-height-sm', 'control-height-md', 'control-height-lg', 'control-height-xl', 'control-height-2xl']) {
    assert(
      semanticSpacing.tokens.some((candidate) => candidate.id === tokenId),
      `semantic spacing should expose the complete ${tokenId} size scale`,
    );
  }
  for (const tokenId of [
    'control-press-offset',
    'control-gap-md',
    'control-icon-lg',
    'navigation-rail-width-sm',
    'navigation-rail-item-size-lg',
  ]) {
    const token = semanticSpacing.tokens.find((candidate) => candidate.id === tokenId);
    assert(token, `semantic spacing should include ${tokenId}`);
    assert(
      Object.values(token.values).every((value) => value.kind === 'ref' && value.collectionId === 'tailwind-primitives'),
      `${tokenId} must reference one shared primitive value`,
    );
  }
  assert(collection.tokens.some((candidate) => candidate.id === 'font-size-md'), 'bundled tokens should include component typography tokens');
  assert(collection.tokens.some((candidate) => candidate.id === 'text-color-primary'), 'bundled tokens should include component text color tokens');
  for (const expectedToken of [
    'alert-title-font-size',
    'alert-description-font-size',
    'accordion-content-gap',
    'navigation-menu-item-height',
    'command-item-height',
    'context-menu-item-height',
    'menubar-item-height',
    'empty-icon-size',
    'field-label-font-size',
    'input-group-addon-background',
    'input-otp-slot-size',
    'pagination-item-size',
    'scroll-area-thumb',
    'sidebar-width',
    'toggle-selected-background',
    'textarea-min-height',
  ]) {
    assert(
      collection.tokens.some((candidate) => candidate.id === expectedToken),
      `bundled tokens should include ${expectedToken}`,
    );
  }
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'action-primary'), 'semantic color should include action roles');
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'text-primary'), 'semantic color should include text color roles');
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'primary'), 'semantic color should include shadcn primary role');
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'secondary'), 'semantic color should include shadcn secondary role');
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'chart-1'), 'semantic color should include chart roles');
  assert(semanticColor.tokens.some((candidate) => candidate.id === 'sidebar'), 'semantic color should include sidebar roles');
  assert(semanticSpacing.tokens.some((candidate) => candidate.id === 'surface-padding-lg'), 'semantic spacing should include surface spacing roles');
  for (const semanticCollection of [semanticColor, semanticRadius, semanticEffect, semanticTypography, semanticSpacing]) {
    assert(
      semanticCollection.tokens.every((candidate) => Object.values(candidate.values).every((value) => value.kind === 'ref')),
      `${semanticCollection.id} should contain reference values only`,
    );
  }

  const css = buildWorkbenchTokenCss(registry);
  assert(
    css.includes('--ds-token-workbench-components-button-height-md: var(--ds-token-workbench-semantic-spacing-control-height-md);'),
    'bundled token CSS should preserve the button-to-semantic height chain',
  );
  assert(
    css.includes('--ds-token-workbench-components-accent: var(--ds-token-workbench-semantic-color-action-primary);'),
    'bundled token CSS should export component-to-semantic refs',
  );
  assert(
    css.includes('--ds-token-workbench-semantic-color-action-primary: var(--ds-token-tailwind-primitives-neutral-900);'),
    'semantic token CSS should export semantic-to-primitive refs',
  );
  assert(
    css.includes('--ds-token-workbench-components-font-size-md: var(--ds-token-workbench-semantic-typography-text-md-size);'),
    'component typography CSS should export component-to-semantic refs',
  );
  assert(
    css.includes('--ds-token-workbench-components-dialog-padding: var(--ds-token-workbench-semantic-spacing-surface-padding-md);'),
    'expanded shadcn component token CSS should export dialog spacing refs',
  );
  assert(
    css.includes('--ds-token-workbench-components-select-content-background: var(--ds-token-workbench-components-dropdown-menu-background);') &&
      css.includes('--ds-token-workbench-components-combobox-content-background: var(--ds-token-workbench-components-dropdown-menu-background);'),
    'select and combobox popover layers should share dropdown-menu surface tokens',
  );
  assert(
    css.includes('--ds-token-workbench-components-alert-title-font-size: var(--ds-token-workbench-semantic-typography-text-md-size);') &&
      css.includes('--ds-token-workbench-components-alert-title-font-weight: var(--ds-token-workbench-semantic-typography-weight-medium);') &&
      css.includes('--ds-token-workbench-components-navigation-menu-item-height: var(--ds-token-workbench-semantic-spacing-control-height-sm);'),
    'expanded component token CSS should export per-component typography and sizing refs',
  );
  assert(
    css.includes('--ds-token-workbench-semantic-spacing-surface-padding-lg: var(--ds-token-tailwind-primitives-space-6);'),
    'semantic spacing CSS should export spacing-to-primitive refs',
  );
  assert(
    css.includes('--ds-token-tailwind-primitives-duration-150: 150ms;') &&
      css.includes('--ds-token-tailwind-primitives-ease-out: cubic-bezier(0, 0, 0.2, 1);'),
    'primitive token CSS should export non-color Tailwind primitive token values such as duration and easing',
  );

  const semanticColorResults = queryTokens(registry, {
    allowedTypes: ['color'],
    collectionId: 'workbench-semantic-color',
    modeByCollection: { 'workbench-semantic-color': 'light' },
  });
  const actionPrimary = semanticColorResults.find((result) => result.token.id === 'action-primary');
  assert(
    actionPrimary?.previewText === '#171717' && getTokenPreviewCss(actionPrimary, registry) === '#171717',
    'color reference token picker previews should resolve Tailwind primitive palette refs to visible swatches',
  );
}

function checkCreateModeGroupAndTokenUseStableUniqueIds(addMode, createGroup, createToken) {
  const registry = createRegistry([
    {
      ...collection('tokens', [
        token('token-taken', 'Existing', 'color', { kind: 'raw', value: '#000000' }),
      ]),
      modes: [{ id: 'default', name: 'Default' }, { id: 'mode-taken', name: 'Existing Mode' }],
      groups: [{ id: 'group-taken', name: 'Existing Group' }],
    },
  ]);

  const modeResult = withMockedTokenIds(['taken', 'next'], () => addMode(registry, 'tokens'));
  const modeIds = modeResult.registry.collections[0].modes.map((mode) => mode.id);
  assert(new Set(modeIds).size === modeIds.length, 'add mode should create a unique stable mode id');
  assert(modeResult.mode.id === 'mode-next', 'add mode should retry when generated id already exists');

  const groupResult = withMockedTokenIds(['taken', 'next'], () => createGroup(modeResult.registry, 'tokens'));
  const groupIds = groupResult.registry.collections[0].groups.map((group) => group.id);
  assert(new Set(groupIds).size === groupIds.length, 'create group should create a unique stable group id');
  assert(groupResult.group.id === 'group-next', 'create group should retry when generated id already exists');

  const tokenResult = withMockedTokenIds(['taken', 'next'], () => createToken(modeResult.registry, 'tokens'));
  const tokenIds = tokenResult.registry.collections[0].tokens.map((candidate) => candidate.id);
  assert(new Set(tokenIds).size === tokenIds.length, 'create token should create a unique stable token id');
  assert(tokenResult.token.id.startsWith('token-'), 'create token should use the token id namespace');
  assert(tokenResult.token.id === 'token-next', 'create token should retry when generated id already exists');
}

function checkCollectionScopedCycle(resolveTokenValue) {
  const registry = createRegistry([
    collection('a', [
      token('shared', 'Alias', 'color', { kind: 'ref', collectionId: 'b', tokenId: 'shared' }),
    ]),
    collection('b', [
      token('shared', 'Base', 'color', { kind: 'raw', value: '#123456' }),
    ]),
  ]);
  const resolved = resolveTokenValue(registry.collections[0].tokens[0], registry.collections[0], registry, 'default');
  assert(resolved === '#123456', 'collection-scoped same-id token reference should resolve');
}

function checkPickerSurvivesExistingCycles(queryTokens) {
  const registry = createRegistry([
    collection('cycle', [
      token('a', 'A', 'number', { kind: 'ref', collectionId: 'cycle', tokenId: 'b' }),
      token('b', 'B', 'number', { kind: 'ref', collectionId: 'cycle', tokenId: 'a' }),
      token('c', 'C', 'number', { kind: 'raw', value: 1 }),
    ]),
  ]);
  const results = queryTokens(registry, { cycleTarget: { collectionId: 'cycle', tokenId: 'new-token' } });
  assert(results.length === 3, 'TokenPicker query should complete when existing registry already has a cycle');
}

function checkMeshBackgroundCleanup(deleteToken, collectTokenValueReferences) {
  const registry = createRegistry([
    collection('a', [
      token('mesh', 'Mesh', 'gradient', {
        kind: 'raw',
        value: {
          type: 'mesh',
          angle: 90,
          meshBackgroundColor: { kind: 'ref', collectionId: 'b', tokenId: 'bg' },
          stops: [
            { id: 's1', position: 0, color: { kind: 'raw', value: '#000000' }, opacity: 100 },
            { id: 's2', position: 100, color: { kind: 'raw', value: '#ffffff' }, opacity: 100 },
          ],
        },
      }),
    ]),
    collection('b', [
      token('bg', 'Background', 'color', { kind: 'raw', value: '#223344' }),
    ]),
  ]);
  const next = deleteToken(registry, 'b', 'bg');
  const meshValue = next.collections[0].tokens[0].values.default;
  assert(
    !collectTokenValueReferences(meshValue).some((ref) => ref.collectionId === 'b' && ref.tokenId === 'bg'),
    'deleting a token should clean mesh background refs',
  );
}

function checkDuplicateCollectionRetargetsReferences(duplicateCollection, collectTokenValueReferences) {
  const registry = createRegistry([
    collection('source', [
      token('base', 'Base', 'color', { kind: 'raw', value: '#445566' }),
      token('space', 'Space', 'number', { kind: 'raw', value: 2 }),
      token('calc', 'Calc', 'number', { kind: 'formula', expression: 'token("source", "space") * 2' }),
      token('mesh', 'Mesh', 'gradient', {
        kind: 'raw',
        value: {
          type: 'mesh',
          angle: 90,
          meshBackgroundColor: { kind: 'ref', collectionId: 'source', tokenId: 'base' },
          stops: [
            { id: 's1', position: 0, color: { kind: 'ref', collectionId: 'source', tokenId: 'base' }, opacity: 100 },
            { id: 's2', position: 100, color: { kind: 'raw', value: '#ffffff' }, opacity: 100 },
          ],
        },
      }),
    ]),
  ]);
  const result = duplicateCollection(registry, 'source');
  const copied = result.collection;
  const copiedCalc = copied.tokens.find((candidate) => candidate.id === 'calc');
  const copiedMesh = copied.tokens.find((candidate) => candidate.id === 'mesh');
  assert(copiedCalc.values.default.expression.includes(`token("${copied.id}", "space")`), 'duplicate collection should retarget formula refs');
  assert(
    collectTokenValueReferences(copiedMesh.values.default).every((ref) => ref.collectionId === copied.id),
    'duplicate collection should retarget gradient stop and mesh background refs',
  );
}

function checkDuplicateCollectionLeavesFieldScopesUnchanged(duplicateCollection, buildTailwindTokenBuckets) {
  const registry = {
    ...createRegistry([
      {
        ...collection('source', [
          { ...token('scale-space', 'scale-space', 'dimension', { kind: 'raw', value: { value: 8, unit: 'px' } }), groupId: 'scale' },
        ]),
        groups: [{ id: 'scale', name: 'Scale' }],
      },
      collection('other', []),
    ]),
    fieldScopes: {
      padding: [
        { collectionId: 'source' },
        { collectionId: 'source', groupId: 'scale' },
        { collectionId: 'other' },
      ],
      margin: [{ collectionId: 'source', groupId: 'scale' }],
    },
  };
  const result = withMockedTokenIds(['copy'], () => duplicateCollection(registry, 'source'));
  const paddingScopes = result.registry.fieldScopes.padding;
  const marginScopes = result.registry.fieldScopes.margin;

  assert(!paddingScopes.some((scope) => scope.collectionId === 'collection-copy'), 'duplicate collection should not automatically expose copied collection scopes');
  assert(!marginScopes.some((scope) => scope.collectionId === 'collection-copy'), 'duplicate collection should leave copied collection groups unscoped');
  assert(paddingScopes.filter((scope) => scope.collectionId === 'other').length === 1, 'duplicate collection should leave other collection scopes unchanged');

  const buckets = buildTailwindTokenBuckets(result.registry);
  assert(buckets.spacing['scale-space'] === '8px', 'duplicate collection should keep source scoped tokens exportable');
}

function checkDuplicateOperationsUseStableUniqueIds(duplicateCollection, duplicateGroup, duplicateToken) {
  const registry = createRegistry([
    collection('collection-taken', []),
    {
      ...collection('source', [
        { ...token('token-taken', 'Taken', 'color', { kind: 'raw', value: '#000000' }), groupId: 'group-taken' },
        { ...token('base', 'Base', 'color', { kind: 'raw', value: '#ffffff' }), groupId: 'group-taken' },
      ]),
      groups: [{ id: 'group-taken', name: 'Taken' }],
    },
  ]);

  const collectionResult = withMockedTokenIds(['taken', 'next'], () => duplicateCollection(registry, 'source'));
  assert(collectionResult.collection.id === 'collection-next', 'duplicate collection should retry when generated collection id exists');

  const groupResult = withMockedTokenIds(['taken', 'nextg', 'taken', 'nextt', 'basecp'], () => duplicateGroup(registry, 'source', 'group-taken'));
  const copiedGroup = groupResult.collections[1].groups.find((group) => group.name === 'Taken copy');
  const copiedTokenIds = groupResult.collections[1].tokens.map((candidate) => candidate.id);
  assert(copiedGroup?.id === 'group-nextg', 'duplicate group should retry when generated group id exists');
  assert(copiedTokenIds.includes('token-nextt'), 'duplicate group should retry when generated copied token id exists');

  const tokenResult = withMockedTokenIds(['taken', 'nextt'], () => duplicateToken(registry, 'source', 'base'));
  assert(
    tokenResult.collections[1].tokens.some((candidate) => candidate.id === 'token-nextt'),
    'duplicate token should retry when generated token id exists',
  );
}

function checkMultiTokenCopyOperations(duplicateTokens, pasteTokens, deleteTokens, collectTokenValueReferences) {
  const registry = createRegistry([
    collection('tokens', [
      token('base', 'base', 'color', { kind: 'raw', value: '#000000' }),
      token('alias', 'alias', 'color', { kind: 'ref', collectionId: 'tokens', tokenId: 'base' }),
      token('other', 'other', 'color', { kind: 'raw', value: '#ffffff' }),
    ]),
  ]);
  const duplicateResult = withMockedTokenIds(['basecp', 'aliascp'], () =>
    duplicateTokens(registry, 'tokens', ['base', 'alias'], 'alias'),
  );
  const duplicatedCollection = duplicateResult.registry.collections[0];
  const copiedAlias = duplicatedCollection.tokens.find((candidate) => candidate.id === 'token-aliascp');
  assert(duplicateResult.tokenIds.join(',') === 'token-basecp,token-aliascp', 'duplicateTokens should return copied token ids in source order');
  assert(
    collectTokenValueReferences(copiedAlias.values.default).some((reference) => reference.tokenId === 'token-basecp'),
    'duplicateTokens should retarget refs between copied tokens',
  );

  const pasteResult = withMockedTokenIds(['pbase', 'palias'], () =>
    pasteTokens(registry, 'tokens', registry.collections[0].tokens.slice(0, 2), 'other'),
  );
  assert(pasteResult.tokenIds.join(',') === 'token-pbase,token-palias', 'pasteTokens should insert copied token snapshots');

  const groupedRegistry = createRegistry([
    {
      ...collection('tokens', [
        { ...token('base', 'base', 'color', { kind: 'raw', value: '#000000' }), groupId: 'source' },
        { ...token('target', 'target', 'color', { kind: 'raw', value: '#ffffff' }), groupId: 'target' },
        token('ungrouped', 'ungrouped', 'color', { kind: 'raw', value: '#eeeeee' }),
      ]),
      groups: [{ id: 'source', name: 'Source' }, { id: 'target', name: 'Target' }],
    },
  ]);
  const pasteIntoTargetGroup = withMockedTokenIds(['gbase'], () =>
    pasteTokens(groupedRegistry, 'tokens', [groupedRegistry.collections[0].tokens[0]], 'target', 'target'),
  );
  const pastedInTarget = pasteIntoTargetGroup.registry.collections[0].tokens.find((candidate) => candidate.id === 'token-gbase');
  assert(pastedInTarget.groupId === 'target', 'pasteTokens should use the current paste target group instead of the copied token group');

  const pasteIntoUngrouped = withMockedTokenIds(['ubase'], () =>
    pasteTokens(groupedRegistry, 'tokens', [groupedRegistry.collections[0].tokens[0]], 'ungrouped', null),
  );
  const pastedUngrouped = pasteIntoUngrouped.registry.collections[0].tokens.find((candidate) => candidate.id === 'token-ubase');
  assert(pastedUngrouped.groupId === undefined, 'pasteTokens should support pasting into the ungrouped area');

  const deleted = deleteTokens(registry, 'tokens', ['base', 'alias']);
  assert(deleted.collections[0].tokens.length === 1, 'deleteTokens should remove every selected token');
  assert(deleted.collections[0].tokens[0].id === 'other', 'deleteTokens should keep unselected tokens');
}

function checkModeNamesAndActiveModeStayUsable(addMode, renameMode, setActiveMode) {
  const registry = createRegistry([
    {
      ...collection('tokens', [
        token('a', 'A', 'color', { kind: 'raw', value: '#000000' }),
      ]),
      modes: [
        { id: 'default', name: 'Default' },
        { id: 'dark', name: 'Dark' },
        { id: 'mode-3', name: 'Mode 3' },
      ],
      activeMode: 'default',
    },
  ]);

  const addResult = withMockedTokenIds(['next'], () => addMode(registry, 'tokens'));
  assert(addResult.mode.name === 'Mode 4', 'add mode should choose an available default mode name');
  assert(
    addResult.registry.collections[0].tokens[0].values[addResult.mode.id].value === '#000000',
    'add mode should copy the first mode value into the new mode',
  );

  const emptyRename = renameMode(registry, 'tokens', 'dark', '   ');
  assert(emptyRename.error === 'Mode name is required.', 'rename mode should reject empty names');
  const duplicateRename = renameMode(registry, 'tokens', 'dark', 'Default');
  assert(duplicateRename.error === 'Mode name must be unique within the collection.', 'rename mode should reject duplicate names');
  const validRename = renameMode(registry, 'tokens', 'dark', ' Night ');
  assert(validRename.error === null, 'rename mode should accept trimmed valid names');
  assert(validRename.registry.collections[0].modes.find((mode) => mode.id === 'dark')?.name === 'Night', 'rename mode should trim names before saving');

  const missingActive = setActiveMode(registry, 'tokens', 'missing');
  assert(missingActive.error === 'Mode does not exist in this collection.', 'set active mode should reject missing modes');
  const activeResult = setActiveMode(registry, 'tokens', 'dark');
  assert(activeResult.registry.collections[0].activeMode === 'dark', 'set active mode should store a known mode id');
}

function checkCollectionGroupAndModeReorder(reorderCollections, reorderGroups, reorderModes) {
  const registry = createRegistry([
    collection('a', []),
    {
      ...collection('b', []),
      modes: [
        { id: 'default', name: 'Default' },
        { id: 'dark', name: 'Dark' },
        { id: 'compact', name: 'Compact' },
      ],
      activeMode: 'dark',
      groups: [
        { id: 'base', name: 'Base' },
        { id: 'semantic', name: 'Semantic' },
        { id: 'feedback', name: 'Feedback' },
      ],
    },
    collection('c', []),
  ]);

  const collectionsAfter = reorderCollections(registry, 'a', 'c', 'after');
  assert(collectionsAfter.collections.map((candidate) => candidate.id).join(',') === 'b,c,a', 'reorderCollections should move a collection after the target');

  const groupsAfter = reorderGroups(registry, 'b', 'feedback', 'base', 'before');
  assert(groupsAfter.collections[1].groups.map((candidate) => candidate.id).join(',') === 'feedback,base,semantic', 'reorderGroups should move a group before the target');

  const modesAfter = reorderModes(registry, 'b', 'compact', 'default', 'after');
  assert(modesAfter.collections[1].modes.map((candidate) => candidate.id).join(',') === 'default,compact,dark', 'reorderModes should move a mode after the target');
  assert(modesAfter.collections[1].activeMode === 'dark', 'reorderModes should preserve the active mode id');
}

function checkChangeTokenTypeResetsModeValues(changeTokenType) {
  const registry = createRegistry([
    {
      ...collection('tokens', [
        {
          ...token('a', 'A', 'color', { kind: 'raw', value: '#000000' }),
          values: {
            default: { kind: 'raw', value: '#000000' },
            dark: { kind: 'ref', collectionId: 'tokens', tokenId: 'b' },
          },
        },
        token('b', 'B', 'color', { kind: 'raw', value: '#ffffff' }),
      ]),
      modes: [
        { id: 'default', name: 'Default' },
        { id: 'dark', name: 'Dark' },
      ],
    },
  ]);

  const next = changeTokenType(registry, 'tokens', 'a', 'dimension');
  const changed = next.collections[0].tokens.find((candidate) => candidate.id === 'a');
  const untouched = next.collections[0].tokens.find((candidate) => candidate.id === 'b');
  assert(changed.type === 'dimension', 'change token type should update the token type');
  assert(changed.values.default.kind === 'raw' && changed.values.default.value.value === 1 && changed.values.default.value.unit === 'rem', 'change token type should reset the default mode value');
  assert(changed.values.dark.kind === 'raw' && changed.values.dark.value.value === 1 && changed.values.dark.value.unit === 'rem', 'change token type should reset secondary mode values');
  assert(untouched.type === 'color' && untouched.values.default.value === '#ffffff', 'change token type should leave other tokens unchanged');
}

function checkCollectionAndGroupNamesStayUsable(createCollection, createGroup, duplicateCollection, duplicateGroup, renameCollection, renameGroup) {
  const registry = createRegistry([
    { ...collection('one', []), name: 'Collection 1' },
    { ...collection('two', []), name: 'Collection 2' },
    {
      ...collection('grouped', []),
      name: 'Collection 3',
      groups: [
        { id: 'parent', name: 'Parent' },
        { id: 'child', name: 'Child', parentGroupId: 'parent' },
        { id: 'parent-copy', name: 'Parent copy' },
        { id: 'new-group-3', name: 'New Group' },
      ],
    },
  ]);

  const createCollectionResult = createCollection(registry);
  assert(createCollectionResult.collection.name === 'Collection 4', 'create collection should choose an available default name');

  const duplicateCollectionResult = duplicateCollection(registry, 'one');
  assert(duplicateCollectionResult.collection.name === 'Collection 1 copy', 'duplicate collection should create a copy name');

  const duplicateCollectionAgain = duplicateCollection(
    { ...registry, collections: [...registry.collections, duplicateCollectionResult.collection] },
    'one',
  );
  assert(duplicateCollectionAgain.collection.name === 'Collection 1 copy-2', 'duplicate collection should avoid duplicate collection names');

  const emptyCollectionName = renameCollection(registry, 'one', '   ');
  assert(emptyCollectionName.error === 'Collection name is required.', 'rename collection should reject empty names');
  const duplicateCollectionName = renameCollection(registry, 'one', 'Collection 2');
  assert(duplicateCollectionName.error === 'Collection name must be unique.', 'rename collection should reject duplicate names');

  const createGroupResult = createGroup(registry, 'grouped');
  assert(createGroupResult.group.name === 'New Group-2', 'create group should choose an available default name');

  const duplicateGroupResult = duplicateGroup(registry, 'grouped', 'parent');
  const duplicatedGroups = duplicateGroupResult.collections.find((collection) => collection.id === 'grouped').groups;
  const groupNames = duplicatedGroups.map((group) => group.name);
  assert(new Set(groupNames).size === groupNames.length, 'duplicate group should keep group names unique');
  assert(groupNames.includes('Parent copy-2'), 'duplicate group should avoid copied parent name collisions');
  assert(groupNames.includes('Child-2'), 'duplicate group should avoid copied child name collisions');

  const emptyGroupName = renameGroup(registry, 'grouped', 'parent', '   ');
  assert(emptyGroupName.error === 'Group name is required.', 'rename group should reject empty names');
  const duplicateGroupName = renameGroup(registry, 'grouped', 'parent', 'Child');
  assert(duplicateGroupName.error === 'Group name must be unique within the collection.', 'rename group should reject duplicate names');
}

function checkGroupCollapseIsScoped(setGroupCollapsed) {
  const registry = createRegistry([
    {
      ...collection('tokens', []),
      groups: [
        { id: 'target', name: 'Target' },
        { id: 'sibling', name: 'Sibling' },
      ],
    },
    {
      ...collection('other', []),
      groups: [{ id: 'target', name: 'Target in other collection' }],
    },
  ]);

  const next = setGroupCollapsed(registry, 'tokens', 'target', true);
  const tokensGroups = next.collections.find((collection) => collection.id === 'tokens').groups;
  const otherGroups = next.collections.find((collection) => collection.id === 'other').groups;
  assert(tokensGroups.find((group) => group.id === 'target')?.collapsed === true, 'set group collapsed should update the target group');
  assert(tokensGroups.find((group) => group.id === 'sibling')?.collapsed === undefined, 'set group collapsed should leave sibling groups unchanged');
  assert(otherGroups.find((group) => group.id === 'target')?.collapsed === undefined, 'set group collapsed should be collection scoped');
}

function checkTokenNamesStayUnique(createToken, duplicateGroup, duplicateToken, renameToken) {
  const registry = createRegistry([
    {
      ...collection('tokens', [
        { ...token('a', 'base', 'color', { kind: 'raw', value: '#000000' }), groupId: 'group-a' },
        { ...token('b', 'base-copy', 'color', { kind: 'raw', value: '#111111' }), groupId: 'group-a' },
        { ...token('c', 'new-token-4', 'color', { kind: 'raw', value: '#222222' }), groupId: 'group-a' },
      ]),
      groups: [{ id: 'group-a', name: 'Group A' }],
    },
  ]);

  const createResult = createToken(registry, 'tokens');
  assert(createResult.token.name === 'new-token-4-2', 'create token should avoid existing generated token names');

  const duplicateResult = duplicateToken(registry, 'tokens', 'a');
  assert(
    duplicateResult.collections[0].tokens.some((candidate) => candidate.id !== 'a' && candidate.name === 'base-copy-2'),
    'duplicate token should avoid existing copy names',
  );

  const duplicateGroupResult = duplicateGroup(registry, 'tokens', 'group-a');
  const names = duplicateGroupResult.collections[0].tokens.map((candidate) => candidate.name);
  assert(new Set(names).size === names.length, 'duplicate group should keep copied token names unique');
  assert(names.includes('base-copy-2'), 'duplicate group should avoid copied token name collisions');
  assert(names.includes('base-copy-copy'), 'duplicate group should assign stable copy names for copied copy tokens');

  const renameResult = renameToken(registry, 'tokens', 'a', 'base-copy');
  assert(renameResult.error === 'Token name must be unique within the collection.', 'rename token should reject duplicate names');
  assert(
    registry.collections[0].tokens.find((candidate) => candidate.id === 'a')?.name === 'base',
    'rename token duplicate rejection should leave registry unchanged',
  );

  const numericRenameResult = renameToken(registry, 'tokens', 'a', '2xl');
  assert(numericRenameResult.error === null, 'rename token should allow names that start with numbers');
  assert(
    numericRenameResult.registry.collections[0].tokens.find((candidate) => candidate.id === 'a')?.name === '2xl',
    'rename token should store numeric-leading names',
  );

  const invalidRenameResult = renameToken(registry, 'tokens', 'a', '-2xl');
  assert(invalidRenameResult.error === 'Use letters, numbers, hyphens, and underscores. The first character cannot be a hyphen.', 'rename token should reject names that start with hyphens');
}

function checkGroupDeleteCleansFieldScopes(deleteGroup) {
  const registry = {
    ...createRegistry([
      {
        ...collection('tokens', [token('a', 'A', 'color', { kind: 'raw', value: '#000000' })]),
        groups: [
          { id: 'parent', name: 'Parent' },
          { id: 'child', name: 'Child', parentGroupId: 'parent' },
        ],
      },
      collection('other', [token('b', 'B', 'color', { kind: 'raw', value: '#ffffff' })]),
    ]),
    fieldScopes: {
      padding: [{ collectionId: 'tokens', groupId: 'child' }, { collectionId: 'tokens' }],
      margin: [{ collectionId: 'other', groupId: 'child' }],
    },
  };
  const next = deleteGroup(registry, 'tokens', 'parent');
  assert(next.fieldScopes.padding.length === 1 && !next.fieldScopes.padding[0].groupId, 'delete group should remove field scopes to deleted groups');
  assert(next.fieldScopes.margin[0].collectionId === 'other', 'delete group should keep field scopes for other collections');
}

function checkDuplicateGroupCopiesFieldScopes(duplicateGroup) {
  const registry = {
    ...createRegistry([
      {
        ...collection('tokens', [
          { ...token('parent-token', 'Parent Token', 'dimension', { kind: 'raw', value: { value: 8, unit: 'px' } }), groupId: 'parent' },
          { ...token('child-token', 'Child Token', 'dimension', { kind: 'raw', value: { value: 12, unit: 'px' } }), groupId: 'child' },
        ]),
        groups: [
          { id: 'parent', name: 'Parent' },
          { id: 'child', name: 'Child', parentGroupId: 'parent' },
          { id: 'sibling', name: 'Sibling' },
        ],
      },
      {
        ...collection('other', []),
        groups: [{ id: 'parent', name: 'Other Parent' }],
      },
    ]),
    fieldScopes: {
      padding: [
        { collectionId: 'tokens' },
        { collectionId: 'tokens', groupId: 'parent' },
        { collectionId: 'tokens', groupId: 'child' },
        { collectionId: 'tokens', groupId: 'sibling' },
        { collectionId: 'other', groupId: 'parent' },
      ],
      margin: [{ collectionId: 'tokens', groupId: 'child' }],
    },
  };
  const next = withMockedTokenIds(['pcopy', 'ccopy', 'ptcopy', 'ctcopy'], () =>
    duplicateGroup(registry, 'tokens', 'parent'),
  );
  const paddingScopes = next.fieldScopes.padding;
  const marginScopes = next.fieldScopes.margin;

  assert(paddingScopes.some((scope) => scope.collectionId === 'tokens' && scope.groupId === 'group-pcopy'), 'duplicate group should copy parent group field scopes');
  assert(paddingScopes.some((scope) => scope.collectionId === 'tokens' && scope.groupId === 'group-ccopy'), 'duplicate group should copy child group field scopes');
  assert(marginScopes.some((scope) => scope.collectionId === 'tokens' && scope.groupId === 'group-ccopy'), 'duplicate group should copy child-only field scopes');
  assert(paddingScopes.filter((scope) => scope.collectionId === 'tokens' && scope.groupId === 'sibling').length === 1, 'duplicate group should leave sibling scopes unchanged');
  assert(paddingScopes.filter((scope) => scope.collectionId === 'other' && scope.groupId === 'parent').length === 1, 'duplicate group should not copy same-id groups in other collections');
}

function checkUsageIndexIncludesTokenRefsAndFieldScopes(buildTokenUsageIndex, getTokenFieldScopeUsages, getTokenReferenceUsages, getTokenScopeFieldScopeUsages, getTokenSourceUsages) {
  const registry = {
    ...createRegistry([
      {
        ...collection('sg-ds-library-semantic-color', [
        token('base', 'Base', 'color', { kind: 'raw', value: '#000000' }),
        token('alias', 'Alias', 'color', { kind: 'ref', collectionId: 'sg-ds-library-semantic-color', tokenId: 'base' }),
        ]),
        groups: [{ id: 'palette', name: 'Palette' }],
      },
    ]),
    fieldScopes: {
      bgColor: [{ collectionId: 'sg-ds-library-semantic-color', groupId: 'palette' }],
      textColor: [{ collectionId: 'sg-ds-library-semantic-color' }],
    },
  };
  const index = buildTokenUsageIndex(registry, [
    {
      contents: 'const CARD_BG = "var(--s-base)"; const DIRECT_BG = "var(--ds-token-sg-ds-library-semantic-color-base)";',
      sourceFile: 'src/components/Stack.tsx',
      sourceId: 'src/components/Stack.tsx',
      sourceLabel: 'Stack',
    },
  ]);
  assert(getTokenReferenceUsages(index, { collectionId: 'sg-ds-library-semantic-color', tokenId: 'base' }).length === 1, 'usage index should include token value refs');
  assert(getTokenSourceUsages(index, { collectionId: 'sg-ds-library-semantic-color', tokenId: 'base' }).length === 2, 'usage index should include component source token usages');
  assert(getTokenFieldScopeUsages(index, { collectionId: 'sg-ds-library-semantic-color' }).length === 2, 'usage index should include collection field scopes');
  assert(
    getTokenFieldScopeUsages(index, { collectionId: 'sg-ds-library-semantic-color', groupIds: new Set(['palette']) }).length === 1,
    'usage index should include group field scopes',
  );
  assert(
    getTokenScopeFieldScopeUsages(index, { collectionId: 'sg-ds-library-semantic-color', groupId: 'palette' }).length === 2,
    'usage index should include collection and matching group field scopes for token scope',
  );
  assert(
    getTokenScopeFieldScopeUsages(index, { collectionId: 'sg-ds-library-semantic-color' }).length === 1,
    'usage index should include collection field scopes for ungrouped token scope',
  );
}

function checkExplicitUnitTokenExports(buildTailwindTokenBuckets, validateTokenForField) {
  const registry = {
    ...createRegistry([
      collection('tokens', [
        token('space', 'space', 'dimension', { kind: 'raw', value: { value: 12, unit: 'px' } }),
        token('tracking', 'tracking', 'dimension', { kind: 'raw', value: { value: 0.02, unit: 'em' } }),
        token('weight', 'weight', 'number', { kind: 'raw', value: 700 }),
        token('weight-keyword', 'weight-keyword', 'string', { kind: 'raw', value: 'bold' }),
      ]),
    ]),
    fieldScopes: {
      padding: [{ collectionId: 'tokens' }],
      borderWidth: [{ collectionId: 'tokens' }],
      borderRadius: [{ collectionId: 'tokens' }],
      fontSize: [{ collectionId: 'tokens' }],
      lineHeight: [{ collectionId: 'tokens' }],
      letterSpacing: [{ collectionId: 'tokens' }],
      fontWeight: [{ collectionId: 'tokens' }],
    },
  };
  const buckets = buildTailwindTokenBuckets(registry);
  assert(buckets.spacing.space === '12px', 'dimension tokens should export to spacing with explicit units');
  assert(buckets.borderWidth.space === '12px', 'dimension tokens should export to borderWidth with explicit units');
  assert(buckets.borderRadius.space === '12px', 'dimension tokens should export to borderRadius with explicit units');
  assert(buckets.fontSize.space === '12px', 'dimension tokens should export to fontSize with explicit units');
  assert(buckets.lineHeight.space === '12px', 'dimension tokens should export to lineHeight with explicit units');
  assert(buckets.letterSpacing.tracking === '0.02em', 'dimension tokens should export to letterSpacing with explicit units');
  assert(buckets.typography.space === '12px', 'fontSize tokens should keep a compatibility typography bucket');
  assert(!('weight' in buckets.spacing), 'number tokens should not auto-export to spacing with an inferred unit');
  assert(!('weight' in buckets.borderWidth), 'number tokens should not auto-export to borderWidth with an inferred unit');
  assert(!('weight' in buckets.fontSize), 'number tokens should not auto-export to fontSize with an inferred unit');
  assert(!('weight' in buckets.lineHeight), 'number tokens should not auto-export to lineHeight with an inferred unit');
  assert(!('weight' in buckets.letterSpacing), 'number tokens should not auto-export to letterSpacing with an inferred unit');
  assert(buckets.fontWeight.weight === '700', 'number tokens should remain unitless for fontWeight');
  assert(buckets.fontWeight['weight-keyword'] === 'bold', 'string tokens should export only to fontWeight');
  assert(!('weight-keyword' in buckets.spacing), 'string tokens should not be routed to spacing by value inspection');
  assert(!('weight-keyword' in buckets.fontSize), 'string tokens should not be routed to fontSize by value inspection');
  assert(validateTokenForField(registry.collections[0].tokens[0], 'padding') === null, 'spacing fields should accept dimension tokens');
  assert(validateTokenForField(registry.collections[0].tokens[0], 'fontSize') === null, 'fontSize should accept explicit dimension tokens');
  assert(validateTokenForField(registry.collections[0].tokens[0], 'lineHeight') === null, 'lineHeight should accept explicit dimension tokens');
  assert(validateTokenForField(registry.collections[0].tokens[1], 'letterSpacing') === null, 'letterSpacing should accept explicit dimension tokens');
  assert(validateTokenForField(registry.collections[0].tokens[2], 'padding') !== null, 'spacing fields should reject unitless number tokens');
  assert(validateTokenForField(registry.collections[0].tokens[2], 'lineHeight') !== null, 'lineHeight should reject unitless number tokens');
  assert(validateTokenForField(registry.collections[0].tokens[3], 'fontWeight') === null, 'fontWeight should accept string tokens');
}

function checkFieldScopesRespectGroupSubsets(buildTailwindTokenBuckets) {
  const registry = {
    ...createRegistry([
      {
        ...collection('spacing', [
          { ...token('scale-space', 'scale-space', 'dimension', { kind: 'raw', value: { value: 8, unit: 'px' } }), groupId: 'scale' },
          { ...token('semantic-space', 'semantic-space', 'dimension', { kind: 'raw', value: { value: 16, unit: 'px' } }), groupId: 'semantic' },
        ]),
        groups: [{ id: 'scale', name: 'Scale' }, { id: 'semantic', name: 'Semantic' }],
      },
    ]),
    fieldScopes: {
      padding: [{ collectionId: 'spacing' }, { collectionId: 'spacing', groupId: 'scale' }],
    },
  };
  const buckets = buildTailwindTokenBuckets(registry);
  assert(buckets.spacing['scale-space'] === '8px', 'group field scopes should export scoped group tokens');
  assert(!('semantic-space' in buckets.spacing), 'group field scopes should not export sibling group tokens');
}

function checkFieldScopeParentContract(getAvailableGroupScopeFields, setTokenFieldScope) {
  const registry = {
    ...createRegistry([
      {
        ...collection('spacing', [
          { ...token('space', 'space', 'dimension', { kind: 'raw', value: { value: 8, unit: 'px' } }), groupId: 'scale' },
        ]),
        groups: [{ id: 'scale', name: 'Scale' }],
      },
    ]),
    fieldScopes: {},
  };

  const withGroupScope = setTokenFieldScope(registry, 'padding', { collectionId: 'spacing', groupId: 'scale' }, true);
  assert(
    withGroupScope.fieldScopes.padding.some((scope) => scope.collectionId === 'spacing' && !scope.groupId),
    'enabling a group field scope should also expose the parent collection field scope',
  );
  assert(
    getAvailableGroupScopeFields(withGroupScope, 'spacing').includes('padding'),
    'group field scope choices should come from the parent collection scope',
  );

  const withoutCollectionScope = setTokenFieldScope(withGroupScope, 'padding', { collectionId: 'spacing' }, false);
  assert(
    !withoutCollectionScope.fieldScopes?.padding?.some((scope) => scope.collectionId === 'spacing'),
    'disabling a collection field scope should remove dependent group field scopes',
  );
}

function checkFieldScopeFilterReconciliation(getFieldScopeCollections, getFieldScopeGroups, reconcileTokenFieldScopeFilter) {
  const registry = {
    ...createRegistry([
      {
        ...collection('spacing', [
          { ...token('scale-space', 'scale-space', 'dimension', { kind: 'raw', value: { value: 8, unit: 'px' } }), groupId: 'scale' },
          { ...token('semantic-space', 'semantic-space', 'dimension', { kind: 'raw', value: { value: 16, unit: 'px' } }), groupId: 'semantic' },
        ]),
        groups: [{ id: 'scale', name: 'Scale' }, { id: 'semantic', name: 'Semantic' }],
      },
      {
        ...collection('colors', [
          { ...token('blue', 'blue', 'color', { kind: 'raw', value: '#2563eb' }), groupId: 'brand' },
        ]),
        groups: [{ id: 'brand', name: 'Brand' }],
      },
    ]),
    fieldScopes: {
      padding: [{ collectionId: 'spacing' }, { collectionId: 'spacing', groupId: 'scale' }],
    },
  };

  const collections = getFieldScopeCollections(registry, 'padding').map((candidate) => candidate.id);
  assert(collections.length === 1 && collections[0] === 'spacing', 'field scope filter collections should come from explicit field scopes');

  const spacing = registry.collections.find((candidate) => candidate.id === 'spacing');
  const groups = getFieldScopeGroups(registry, 'padding', spacing).map((candidate) => candidate.id);
  assert(groups.length === 1 && groups[0] === 'scale', 'field scope filter groups should narrow to explicitly scoped groups');

  const staleCollection = reconcileTokenFieldScopeFilter(registry, 'padding', { collectionId: 'colors', groupId: 'brand' });
  assert(staleCollection.collectionId === 'all' && staleCollection.groupId === 'all', 'stale inspector field filters should fall back to all linked scopes');

  const staleGroup = reconcileTokenFieldScopeFilter(registry, 'padding', { collectionId: 'spacing', groupId: 'semantic' });
  assert(staleGroup.collectionId === 'spacing' && staleGroup.groupId === 'all', 'stale inspector group filters should keep the valid collection and clear the group');
}

function checkWorkbenchTokenCssExport(buildWorkbenchTokenCss) {
  const registry = {
    ...createRegistry([
      collection('colors', [
        token('brand', 'brand', 'color', { kind: 'raw', value: '#00ffff' }),
      ]),
      collection('spacing', [
        token('2', '2', 'dimension', { kind: 'raw', value: { value: 0.5, unit: 'rem' } }),
      ]),
      collection('typography', [
        token('line-height-display', 'display', 'dimension', { kind: 'raw', value: { value: 1, unit: 'em' } }),
      ]),
    ]),
    fieldScopes: {
      bgColor: [{ collectionId: 'colors' }],
      padding: [{ collectionId: 'spacing' }],
      lineHeight: [{ collectionId: 'typography' }],
    },
  };

  const css = buildWorkbenchTokenCss(registry);
  assert(css.includes('--ds-color-brand: #00ffff;'), 'project token CSS should export scoped color variables');
  assert(css.includes('--ds-spacing-2: 0.5rem;'), 'project token CSS should export scoped dimension variables with explicit units');
  assert(css.includes('--ds-lineHeight-line-height-display: 1em;'), 'project token CSS should export canonical field variable ids');
  assert(css.includes('--ds-lineHeight-display: 1em;'), 'project token CSS should export display-name field variable aliases');
  assert(css.includes('--ds-token-colors-brand: #00ffff;'), 'project token CSS should export canonical collection-scoped token variables');
  assert(css.includes('--ds-token-spacing-2: 0.5rem;'), 'project token CSS should export collection-scoped numeric token ids safely');
  assert(css.includes('--ds-token-typography-line-height-display: 1em;'), 'project token CSS should keep collection-scoped token ids canonical');
  assert(!css.includes('--ds-token-typography-display: 1em;'), 'project token CSS should not alias collection-scoped token ids by display name');
}

function checkAstryxThemeTokenCssExport(buildWorkbenchTokenCss) {
  const astryxTheme = {
    ...collection('astryx-theme', [
      {
        ...token('color-background-body', 'color-background-body', 'color', { kind: 'raw', value: 'light-dark(#f1f1f1, #1b1b1b)' }),
        values: {
          neutral: { kind: 'raw', value: 'light-dark(#f1f1f1, #1b1b1b)' },
          butter: { kind: 'raw', value: 'light-dark(#fffef1, #2d2608)' },
        },
      },
    ]),
    modes: [{ id: 'neutral', name: 'Neutral' }, { id: 'butter', name: 'Butter' }],
    activeMode: 'neutral',
    extensions: {
      source: 'astryx',
      astryx: { kind: 'theme-overrides' },
    },
  };
  const css = buildWorkbenchTokenCss(createRegistry([astryxTheme]));

  assert(css.includes('[data-astryx-theme="butter"]'), 'Astryx theme CSS should export official data-astryx-theme mode selectors');
  assert(css.includes('[data-wb-token-modes="astryx-theme=butter"]'), 'Astryx theme CSS should keep Workbench token-mode selectors');
  assert(!css.includes('[data-theme="butter"]'), 'Astryx theme CSS should not reuse data-theme for theme names');
  assert(css.includes('--ds-token-astryx-theme-color-background-body: light-dark(#fffef1, #2d2608);'), 'Astryx theme CSS should preserve light-dark() token values');
}

function checkTailwindThemeOverrideCssExport(buildWorkbenchTokenCss) {
  const registry = {
    ...createRegistry([
      {
        ...collection('tailwind-theme', [
          {
            ...token('primary', 'primary', 'color', { kind: 'raw', value: 'oklch(0.8 0.2 90)' }),
            values: {
              light: { kind: 'raw', value: 'oklch(0.8 0.2 90)' },
              dark: { kind: 'raw', value: 'oklch(0.7 0.18 90)' },
            },
            groupId: 'action',
            extensions: { cssVariable: '--primary', source: 'tailwind' },
          },
          {
            ...token('radius', 'radius', 'dimension', { kind: 'raw', value: { value: 0.625, unit: 'rem' } }),
            values: {
              light: { kind: 'raw', value: { value: 0.625, unit: 'rem' } },
              dark: { kind: 'raw', value: { value: 0.75, unit: 'rem' } },
            },
            groupId: 'radius',
            extensions: { cssVariable: '--radius', source: 'tailwind' },
          },
        ]),
        modes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'light',
        groups: [{ id: 'action', name: 'Action' }, { id: 'radius', name: 'Radius' }],
        extensions: { source: 'tailwind', tailwind: { kind: 'theme-variables' } },
      },
    ]),
    extensions: {
      tailwind: {
        cssExport: 'tailwind-theme-overrides',
        lightModeId: 'light',
        darkModeId: 'dark',
      },
    },
  };

  const css = buildWorkbenchTokenCss(registry);
  assert(css.includes(':root'), 'Tailwind override CSS should export root variables');
  assert(css.includes('--primary: oklch(0.8 0.2 90);'), 'Tailwind override CSS should keep the original shadcn variable names');
  assert(css.includes('--radius: 0.625rem;'), 'Tailwind override CSS should serialize explicit dimension values');
  assert(css.includes('.dark'), 'Tailwind override CSS should export dark variables');
  assert(css.includes('--primary: oklch(0.7 0.18 90);'), 'Tailwind override CSS should export dark-mode values');
  assert(css.includes('[data-wb-token-modes="tailwind-theme=dark"]'), 'Tailwind override CSS should export token-mode selectors for nested theme overrides');
  assert(!css.slice(css.indexOf('[data-wb-token-modes="tailwind-theme=dark"]')).includes('--ds-token-'), 'Scoped Tailwind override blocks should not clobber semantic token variables');
  assert(!css.includes('--ds-color-primary'), 'Tailwind override CSS should not emit Workbench field aliases');

  const semanticRegistry = {
    ...createRegistry([
      collection('workbench-semantic-color', [
        {
          ...token('chart-1', 'chart-1', 'color', { kind: 'raw', value: '#2563eb' }),
          values: {
            light: { kind: 'raw', value: '#2563eb' },
            amberDark: { kind: 'raw', value: 'oklch(0.809 0.105 251.813)' },
          },
          groupId: 'chart',
        },
      ], {
        modes: [{ id: 'light', name: 'Light' }, { id: 'amberDark', name: 'Amber Dark' }],
        activeMode: 'light',
        groups: [{ id: 'chart', name: 'Chart' }],
      }),
      {
        ...collection('tailwind-theme', [
          {
            ...token('chart-1', 'chart-1', 'color', { kind: 'ref', collectionId: 'workbench-semantic-color', tokenId: 'chart-1' }),
            values: {
              light: { kind: 'ref', collectionId: 'workbench-semantic-color', tokenId: 'chart-1' },
              dark: { kind: 'ref', collectionId: 'workbench-semantic-color', tokenId: 'chart-1' },
            },
            groupId: 'chart',
            extensions: { cssVariable: '--chart-1', source: 'tailwind' },
          },
        ]),
        modes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'light',
        groups: [{ id: 'chart', name: 'Chart' }],
        extensions: { source: 'tailwind', tailwind: { kind: 'theme-variables' } },
      },
    ]),
    extensions: {
      tailwind: {
        cssExport: 'tailwind-theme-overrides',
        lightModeId: 'light',
        darkModeId: 'dark',
      },
    },
  };
  const semanticCss = buildWorkbenchTokenCss(semanticRegistry);
  assert(semanticCss.includes('[data-wb-token-modes="tailwind-theme=dark"]'), 'Tailwind semantic bridge should export dark token-mode selectors');
  const semanticDarkBlock = semanticCss.slice(semanticCss.indexOf('[data-wb-token-modes="tailwind-theme=dark"]'));
  assert(semanticDarkBlock.includes('--chart-1: var(--ds-token-workbench-semantic-color-chart-1);'), 'Tailwind semantic bridge should preserve direct shadcn vars as semantic references');
  assert(!semanticDarkBlock.includes('--chart-1: #2563eb;'), 'Tailwind semantic bridge should not freeze nested theme chart variables to the base light mode');
  assert(!semanticDarkBlock.includes('--chart-1: oklch(0.809 0.105 251.813);'), 'Tailwind semantic bridge should not freeze nested theme chart variables to a semantic raw mode');
}

function checkTailwindThemePickerUsesExportedCssVariables(queryTokens) {
  const registry = {
    ...createRegistry([
      {
        ...collection('tailwind-theme', [
          {
            ...token('primary', 'primary', 'color', { kind: 'raw', value: 'oklch(0.8 0.2 90)' }),
            values: {
              light: { kind: 'raw', value: 'oklch(0.8 0.2 90)' },
              dark: { kind: 'raw', value: 'oklch(0.7 0.18 90)' },
            },
            groupId: 'action',
            extensions: { cssVariable: '--primary', source: 'tailwind' },
          },
          {
            ...token('radius', 'radius', 'dimension', { kind: 'raw', value: { value: 0.625, unit: 'rem' } }),
            values: {
              light: { kind: 'raw', value: { value: 0.625, unit: 'rem' } },
              dark: { kind: 'raw', value: { value: 0.75, unit: 'rem' } },
            },
            groupId: 'radius',
            extensions: { cssVariable: '--radius', source: 'tailwind' },
          },
          {
            ...token('space-4', 'space-4', 'dimension', { kind: 'raw', value: { value: 1, unit: 'rem' } }),
            groupId: 'spacing',
            extensions: { cssVariable: '--spacing-4', source: 'tailwind' },
          },
          {
            ...token('font-weight-medium', 'font-weight-medium', 'number', { kind: 'raw', value: 500 }),
            groupId: 'font-weight',
            extensions: { cssVariable: '--font-weight-medium', source: 'tailwind' },
          },
        ]),
        modes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'light',
        groups: [
          { id: 'action', name: 'Action' },
          { id: 'radius', name: 'Radius' },
          { id: 'spacing', name: 'Spacing' },
          { id: 'font-weight', name: 'Font weight' },
        ],
        extensions: { source: 'tailwind', tailwind: { kind: 'theme-variables' } },
      },
    ]),
    extensions: {
      tailwind: {
        cssExport: 'tailwind-theme-overrides',
        lightModeId: 'light',
        darkModeId: 'dark',
      },
    },
    fieldScopes: {
      bgColor: [{ collectionId: 'tailwind-theme' }],
      borderRadius: [{ collectionId: 'tailwind-theme', groupId: 'radius' }],
      fontWeight: [{ collectionId: 'tailwind-theme', groupId: 'font-weight' }],
      padding: [{ collectionId: 'tailwind-theme', groupId: 'spacing' }],
    },
  };

  const primary = queryTokens(registry, { field: 'bgColor' })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'primary');
  assert(primary, 'Tailwind theme picker should include scoped theme tokens');
  assert(primary.cssVariable === 'var(--primary)', 'Tailwind theme picker should commit the exported CSS variable');
  assert(primary.cssVariableAliases.includes('var(--ds-color-primary)'), 'Tailwind theme picker should still recognize legacy Workbench field aliases');
  assert(primary.cssVariableAliases.includes('var(--ds-token-tailwind-theme-primary)'), 'Tailwind theme picker should still recognize collection token aliases');

  const componentPropPrimary = queryTokens(registry, { allowedTypes: ['color'] })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'primary');
  assert(componentPropPrimary?.cssVariable === 'var(--primary)', 'Component prop token pickers should commit exported Tailwind theme CSS variables without an inspector field');

  const radius = queryTokens(registry, { field: 'borderRadius' })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'radius');
  assert(radius?.cssVariable === 'var(--radius)', 'Radius token pickers should commit token-owned CSS variables');
  assert(radius.previewText === '0.625rem', 'Radius token picker previews should preserve explicit units');

  const spacing = queryTokens(registry, { field: 'padding' })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'space-4');
  assert(spacing?.cssVariable === 'var(--spacing-4)', 'Spacing token pickers should commit token-owned CSS variables');
  assert(spacing.previewText === '1rem', 'Spacing token picker previews should preserve explicit units');

  const fontWeight = queryTokens(registry, { field: 'fontWeight' })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'font-weight-medium');
  assert(fontWeight?.cssVariable === 'var(--font-weight-medium)', 'Numeric token pickers should commit token-owned CSS variables');
  assert(fontWeight.previewText === '500', 'Numeric token picker previews should not infer px units');

  const componentPropFontWeight = queryTokens(registry, { allowedTypes: ['number'] })
    .find((result) => result.collection.id === 'tailwind-theme' && result.token.id === 'font-weight-medium');
  assert(componentPropFontWeight?.cssVariable === 'var(--font-weight-medium)', 'Component prop numeric token pickers should commit token-owned CSS variables without inferring px units');
}

function checkTailwindThemeSemanticNormalization(normalizeImportedRegistry, buildWorkbenchTokenCss) {
  const registry = {
    ...createRegistry([
      {
        ...collection('tailwind-theme', [
          {
            ...token('primary', 'primary', 'color', { kind: 'raw', value: 'oklch(0.8 0.2 90)' }),
            values: {
              light: { kind: 'raw', value: 'oklch(0.8 0.2 90)' },
              dark: { kind: 'raw', value: 'oklch(0.7 0.18 90)' },
            },
            groupId: 'action',
            extensions: { cssVariable: '--primary', source: 'tailwind' },
          },
          {
            ...token('radius', 'radius', 'dimension', { kind: 'raw', value: { value: 0.625, unit: 'rem' } }),
            values: {
              light: { kind: 'raw', value: { value: 0.625, unit: 'rem' } },
              dark: { kind: 'raw', value: { value: 0.75, unit: 'rem' } },
            },
            groupId: 'radius',
            extensions: { cssVariable: '--radius', source: 'tailwind' },
          },
        ]),
        modes: [{ id: 'light', name: 'Light' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'light',
        groups: [{ id: 'action', name: 'Action' }, { id: 'radius', name: 'Radius' }],
        extensions: { source: 'tailwind', tailwind: { kind: 'theme-variables' } },
      },
    ]),
    extensions: {
      tailwind: {
        cssExport: 'tailwind-theme-overrides',
        lightModeId: 'light',
        darkModeId: 'dark',
      },
    },
  };

  const normalized = normalizeImportedRegistry(registry);
  const primitives = normalized.collections.find((candidate) => candidate.id === 'tailwind-primitives');
  const semanticColor = normalized.collections.find((candidate) => candidate.id === 'workbench-semantic-color');
  const semanticRadius = normalized.collections.find((candidate) => candidate.id === 'workbench-semantic-radius');
  const theme = normalized.collections.find((candidate) => candidate.id === 'tailwind-theme');
  const primary = theme?.tokens.find((candidate) => candidate.id === 'primary');
  const radius = theme?.tokens.find((candidate) => candidate.id === 'radius');

  assert(primitives?.tokens.some((candidate) => candidate.id === 'theme-primary-light'), 'Tailwind theme normalization should preserve raw primary as a primitive');
  assert(semanticColor?.tokens.some((candidate) => candidate.id === 'primary'), 'Tailwind theme normalization should create semantic primary');
  assert(semanticRadius?.tokens.some((candidate) => candidate.id === 'radius'), 'Tailwind theme normalization should create semantic radius');
  assert(primary?.values.light?.kind === 'ref' && primary.values.light.collectionId === 'workbench-semantic-color', 'Tailwind theme primary should become a semantic ref');
  assert(radius?.values.light?.kind === 'ref' && radius.values.light.collectionId === 'workbench-semantic-radius', 'Tailwind theme radius should become a semantic ref');

  const css = buildWorkbenchTokenCss(normalized);
  assert(
    css.includes('--ds-token-tailwind-primitives-theme-primary-light: oklch(0.8 0.2 90);'),
    'Tailwind override CSS should include normalized raw primitive values',
  );
  assert(
    css.includes('--ds-token-workbench-semantic-color-primary: var(--ds-token-tailwind-primitives-theme-primary-light);'),
    'Tailwind override CSS should include semantic color aliases',
  );
  assert(
    css.includes('--primary: var(--ds-token-workbench-semantic-color-primary);'),
    'Tailwind override CSS should export shadcn variables through semantic refs',
  );
}

function checkTailwindSyncParsesCssLikeCascade() {
  const source = readFileSync(path.join(root, 'scripts/workbench-tailwind-sync.mjs'), 'utf8');
  assert(
    source.includes("const previewOnly = Boolean(args.previewOnly || args['preview-only']);") &&
      source.includes('if (previewOnly)') &&
      source.indexOf('if (previewOnly)') < source.indexOf("const sourceCss = readFileSync(join(projectRoot, sourceCssPath), 'utf8');"),
    'Tailwind preview-only sync should stop before token registry parsing and token CSS generation',
  );
  assert(
    source.includes("parseCssVariableBlocks(extractCssBlocks(withoutComments, ':root'))") &&
      source.includes("parseCssVariableBlocks(extractCssBlocks(withoutComments, '.dark'))"),
    'Tailwind sync should merge repeated :root/.dark blocks instead of reading only the first block',
  );
  assert(
    source.includes('pattern.lastIndex = index + 1') &&
      source.includes('return blocks;'),
    'Tailwind sync CSS block extraction should keep scanning later matching blocks in source order',
  );
  assert(
    source.includes('TAILWIND_THEME_COLOR_ROLE_IDS.has(name)'),
    'Tailwind sync should keep known shadcn/Tailwind theme color roles typed as color even when their value is a var() alias',
  );
}

function checkWorkbenchTokenCssReferenceExport(buildWorkbenchTokenCss) {
  const registry = createRegistry([
    {
      ...collection('colors', [
        token('card', 'card', 'color', { kind: 'raw', value: '#ffffff' }),
      ]),
      modes: [{ id: 'default', name: 'Light' }, { id: 'dark', name: 'Dark' }],
      tokens: [
        {
          ...token('card', 'card', 'color', { kind: 'raw', value: '#ffffff' }),
          values: {
            default: { kind: 'raw', value: '#ffffff' },
            dark: { kind: 'raw', value: '#21190f' },
          },
        },
      ],
    },
    {
      ...collection('semantic-surface', [
        token('surface', 'surface', 'color', { kind: 'ref', collectionId: 'colors', tokenId: 'card' }),
      ]),
      modes: [{ id: 'default', name: 'Light' }, { id: 'dark', name: 'Dark' }],
      tokens: [
        {
          ...token('surface', 'surface', 'color', { kind: 'ref', collectionId: 'colors', tokenId: 'card' }),
          values: {
            default: { kind: 'ref', collectionId: 'colors', tokenId: 'card' },
            dark: { kind: 'ref', collectionId: 'colors', tokenId: 'card' },
          },
        },
      ],
    },
    collection('component', [
      token('sidebar-item-background', 'sidebar-item-background', 'color', {
        kind: 'ref',
        collectionId: 'semantic-surface',
        tokenId: 'surface',
      }),
    ]),
  ]);

  const css = buildWorkbenchTokenCss(registry);
  assert(
    css.includes('--ds-token-component-sidebar-item-background: var(--ds-token-semantic-surface-surface);'),
    'component reference tokens should export CSS variable aliases so semantic mode changes keep flowing',
  );
  assert(
    css.includes('--ds-token-semantic-surface-surface: var(--ds-token-colors-card);'),
    'default-mode semantic aliases should keep references live so primitive or semantic color mode changes can flow',
  );
  assert(
    css.includes('--ds-token-semantic-surface-surface: #21190f;'),
    'multi-mode semantic tokens should still export concrete mode values',
  );
}

function checkSurfaceAliasesFollowColorMode(resolveTokenValue) {
  const registry = createRegistry([
    {
      ...collection('colors', [
        token('card', 'card', 'color', { kind: 'raw', value: '#ffffff' }),
      ]),
      modes: [{ id: 'default', name: 'Default' }, { id: 'dark', name: 'Dark' }],
      tokens: [
        {
          ...token('card', 'card', 'color', { kind: 'raw', value: '#ffffff' }),
          values: {
            default: { kind: 'raw', value: '#ffffff' },
            dark: { kind: 'raw', value: '#21190f' },
          },
        },
      ],
    },
    collection('surface', [
      token('surface', 'surface', 'string', { kind: 'ref', collectionId: 'colors', tokenId: 'card' }),
    ]),
  ]);
  const surfaceCollection = registry.collections.find((candidate) => candidate.id === 'surface');
  const surfaceToken = surfaceCollection.tokens.find((candidate) => candidate.id === 'surface');
  const light = resolveTokenValue(surfaceToken, surfaceCollection, registry, 'default', { colors: 'default' });
  const dark = resolveTokenValue(surfaceToken, surfaceCollection, registry, 'default', { colors: 'dark' });
  assert(light === '#ffffff', 'surface aliases should resolve the default color mode');
  assert(dark === '#21190f', 'surface aliases should follow color mode overrides instead of staying light');
}

function checkImportedTokenNamesAreSafe(importTokensFromSource) {
  const result = importTokensFromSource(
    createRegistry([]),
    ':root { --100: 8px; --space-sm: 0.5rem; --2-opacity: 60%; }',
    'tokens.css',
  );
  const imported = result.registry.collections.find((collection) => collection.id === 'imported');
  const names = imported.tokens.map((token) => token.name);
  assert(result.importedCount === 3, 'token import should import supported CSS custom properties');
  assert(names.includes('100'), 'token import should preserve numeric token identifiers');
  assert(names.includes('space-sm'), 'token import should preserve already safe token identifiers');
  assert(names.every((name) => /^[a-zA-Z0-9_][\w-]*$/.test(name)), 'token import should produce token names accepted by the editor');
}

function checkImportedCssGradientsBecomeEditable(importTokensFromSource) {
  const result = importTokensFromSource(
    createRegistry([]),
    ':root { --ds-color-brand-gradient: linear-gradient(135deg, #ffff00 0%, #00ffff 100%); }',
    'tokens.css',
  );
  const imported = result.registry.collections.find((collection) => collection.id === 'imported');
  const gradient = imported.tokens.find((token) => token.id === 'brand-gradient');
  assert(gradient?.type === 'gradient', 'CSS gradient imports should create gradient tokens');
  const value = gradient.values.default.value;
  assert(value && typeof value === 'object' && value.type === 'linear', 'CSS gradient imports should store editable GradientValue objects');
}

function checkImportedLibraryCssUsesLibraryCollection(importTokensFromSource) {
  const result = importTokensFromSource(
    createRegistry([]),
    `
      .sg-ds-library-new-scope {
        --sg-ds-library-new-radius-pill: 999px;
        --ds-color-brand: #ff0055;
        --broken-rule: :before { right: 0;
      }
    `,
    'src/libraries/sg-ds-library-new/components/sg-ds-library-new.css',
  );
  const library = result.registry.collections.find((candidate) => candidate.id === 'sg-ds-library-new');
  assert(library, 'library CSS token imports should use the inferred library collection id');
  assert(library.name === 'SG DS LIBRARY NEW', 'library CSS token imports should derive a readable library collection name');
  assert(library.extensions.source === 'sg-ds-library-new', 'library CSS token imports should preserve the library source id');
  assert(library.extensions.importKind === 'library-css', 'library CSS token imports should mark CSS-derived collections');
  assert(!result.registry.collections.some((candidate) => candidate.id === 'imported'), 'library CSS token imports should not fall back to Imported');
  assert(library.tokens.some((candidate) => candidate.id === 'brand'), 'library CSS token imports should keep workbench token variables');
  assert(!library.tokens.some((candidate) => candidate.id === 'broken-rule'), 'library CSS token imports should ignore malformed CSS fragments');
}

function checkTokenRegistryImportMergePreservesLocalEdits(mergeTokenRegistryImports) {
  const previous = {
    ...createRegistry([
      {
        ...collection('lib-colors', [
          {
            ...token('brand', 'Brand', 'color', { kind: 'raw', value: '#111111' }),
            values: {
              default: { kind: 'raw', value: '#111111' },
              dark: { kind: 'raw', value: '#101010' },
            },
          },
        ]),
        name: 'Previous Colors',
        modes: [{ id: 'default', name: 'Default' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'default',
        groups: [{ id: 'base', name: 'Base' }],
        extensions: { source: 'library-a' },
      },
    ]),
    fieldScopes: {
      borderColor: [{ collectionId: 'lib-colors' }],
      textColor: [{ collectionId: 'lib-colors' }],
    },
    extensions: { imported: 'previous' },
  };
  const current = {
    ...createRegistry([
      {
        ...collection('lib-colors', [
          {
            ...token('brand', 'Brand', 'color', { kind: 'raw', value: '#111111' }),
            values: {
              default: { kind: 'raw', value: '#111111' },
              dark: { kind: 'raw', value: '#444444' },
              local: { kind: 'raw', value: '#222222' },
            },
          },
          token('local-only', 'Local only', 'color', { kind: 'raw', value: '#333333' }),
        ]),
        name: 'Previous Colors',
        modes: [{ id: 'default', name: 'Default' }, { id: 'dark', name: 'Dark' }, { id: 'local', name: 'Local' }],
        activeMode: 'local',
        groups: [{ id: 'base', name: 'Base' }, { id: 'local', name: 'Local' }],
        extensions: { source: 'library-a', localNote: true },
      },
      collection('project-colors', [
        token('project-brand', 'Project brand', 'color', { kind: 'raw', value: '#abcdef' }),
      ]),
    ]),
    fieldScopes: {
      bgColor: [{ collectionId: 'project-colors' }],
      borderColor: [{ collectionId: 'project-colors' }],
    },
    extensions: { current: true },
  };
  const imported = {
    ...createRegistry([
      {
        ...collection('lib-colors', [
          {
            ...token('brand', 'Brand', 'color', { kind: 'raw', value: '#ff0055' }),
            values: {
              default: { kind: 'raw', value: '#ff0055' },
              dark: { kind: 'raw', value: '#cc0044' },
            },
          },
          {
            ...token('accent', 'Accent', 'color', { kind: 'raw', value: '#ff80aa' }),
            values: {
              default: { kind: 'raw', value: '#ff80aa' },
              dark: { kind: 'raw', value: '#ff4d88' },
            },
          },
        ]),
        name: 'Imported Colors',
        modes: [{ id: 'default', name: 'Default' }, { id: 'dark', name: 'Dark' }],
        activeMode: 'default',
        groups: [{ id: 'base', name: 'Base' }, { id: 'accent', name: 'Accent' }],
        extensions: { source: 'library-a', importedNote: true },
      },
    ]),
    fieldScopes: {
      borderColor: [{ collectionId: 'lib-colors' }],
      textColor: [{ collectionId: 'lib-colors' }],
    },
    extensions: { imported: true },
  };

  const merged = mergeTokenRegistryImports(current, [imported], [previous]);
  const mergedCollection = merged.collections.find((candidate) => candidate.id === 'lib-colors');
  const brand = mergedCollection.tokens.find((candidate) => candidate.id === 'brand');
  const accent = mergedCollection.tokens.find((candidate) => candidate.id === 'accent');
  const localOnly = mergedCollection.tokens.find((candidate) => candidate.id === 'local-only');
  assert(merged.collections.some((candidate) => candidate.id === 'project-colors'), 'token registry import merge should preserve unrelated project collections');
  assert(mergedCollection.name === 'Imported Colors', 'token registry import merge should update collection metadata from the imported registry');
  assert(mergedCollection.activeMode === 'local', 'token registry import merge should preserve a locally changed active mode');
  assert(mergedCollection.modes.map((mode) => mode.id).join(',') === 'default,dark,local', 'token registry import merge should upsert imported modes and retain local modes');
  assert(mergedCollection.groups.map((group) => group.id).join(',') === 'base,accent,local', 'token registry import merge should upsert imported groups and retain local groups');
  assert(brand.values.default.value === '#ff0055', 'token registry import merge should update unchanged imported token values');
  assert(brand.values.dark.value === '#444444', 'token registry import merge should preserve locally edited token values');
  assert(brand.values.local.value === '#222222', 'token registry import merge should retain local-mode values on matching tokens');
  assert(accent.values.local.value === '#ff80aa', 'token registry import merge should fill retained local modes on newly imported tokens');
  assert(localOnly.values.dark.value === '#333333', 'token registry import merge should retain local-only tokens and fill imported modes from their fallback value');
  assert(mergedCollection.tokens.map((candidate) => `${candidate.id}:${candidate.sortOrder}`).join(',') === 'brand:0,accent:1,local-only:2', 'token registry import merge should keep imported token order before retained local tokens');
  assert(mergedCollection.extensions.localNote === true && mergedCollection.extensions.importedNote === true, 'token registry import merge should merge collection extensions');
  assert(merged.fieldScopes.bgColor?.[0]?.collectionId === 'project-colors' && merged.fieldScopes.textColor?.[0]?.collectionId === 'lib-colors', 'token registry import merge should merge field scopes');
  assert(merged.fieldScopes.borderColor?.[0]?.collectionId === 'project-colors', 'token registry import merge should preserve locally edited field scopes');
  assert(merged.extensions.current === true && merged.extensions.imported === true, 'token registry import merge should merge registry extensions');
}

function checkLegacyGradientStringsNormalize(normalizeImportedRegistry) {
  const registry = createRegistry([
    collection('colors', [
      token('brand-gradient', 'brand-gradient', 'gradient', {
        kind: 'raw',
        value: 'linear-gradient(135deg, #FFFF00 0%, #00FFFF 100%)',
      }),
      token('brand-gradient-soft', 'brand-gradient-soft', 'gradient', {
        kind: 'raw',
        value: 'radial-gradient(circle at 24% 20%, rgba(255, 255, 0, 0.24), transparent 30%), radial-gradient(circle at 78% 76%, rgba(0, 255, 255, 0.18), transparent 32%)',
      }),
      token('bad-saved-gradient', 'bad-saved-gradient', 'gradient', {
        kind: 'raw',
        value: {
          type: 'linear',
          angle: 180,
          stops: [
            { id: 'bad-angle', position: 0, color: { kind: 'raw', value: '135deg' }, opacity: 100 },
            { id: 'start', position: 0, color: { kind: 'raw', value: '#FFFF00' }, opacity: 100 },
            { id: 'end', position: 100, color: { kind: 'raw', value: '#00FFFF' }, opacity: 100 },
          ],
        },
      }),
    ]),
  ]);
  const normalized = normalizeImportedRegistry(registry);
  const [linear, mesh, recovered] = normalized.collections[0].tokens.map((candidate) => candidate.values.default.value);
  assert(linear && typeof linear === 'object' && linear.type === 'linear', 'loaded legacy linear gradient strings should normalize to editable GradientValue objects');
  assert(linear.angle === 135, 'loaded legacy linear gradients should preserve the CSS angle');
  assert(linear.stops.length === 2, 'loaded legacy linear gradients should not treat the angle as a color stop');
  assert(linear.stops[0].color.value === '#FFFF00', 'loaded legacy linear gradients should preserve the first stop color');
  assert(linear.stops[1].color.value === '#00FFFF', 'loaded legacy linear gradients should preserve the last stop color');
  assert(mesh && typeof mesh === 'object' && mesh.type === 'mesh', 'loaded legacy layered radial gradient strings should normalize to editable mesh GradientValue objects');
  assert(recovered && typeof recovered === 'object' && recovered.stops.length === 2, 'loaded malformed GradientValue objects should drop invalid angle color stops');
  assert(recovered.stops.every((stop) => stop.color.value !== '135deg'), 'loaded malformed GradientValue objects should not emit angle strings as colors');
}

function checkLegacyImportedCssTokensMigrateToLibraryCollections(normalizeImportedRegistry) {
  const registry = {
    ...createRegistry([
      {
        ...collection('imported', [
          {
            ...token('brand', 'Brand', 'color', { kind: 'raw', value: '#ff0055' }),
            groupId: 'colors',
            extensions: { importedFrom: 'src/libraries/sg-ds-library-new/components/sg-ds-library-new.css' },
          },
          {
            ...token('broken-rule', 'Broken rule', 'string', { kind: 'raw', value: ':before { right: 0' }),
            groupId: 'colors',
            extensions: { importedFrom: 'src/libraries/sg-ds-library-new/components/sg-ds-library-new.css' },
          },
          {
            ...token('loose', 'Loose', 'color', { kind: 'raw', value: '#111111' }),
            groupId: 'colors',
            extensions: { importedFrom: 'tokens.css' },
          },
        ]),
        name: 'Imported',
        groups: [{ id: 'colors', name: 'Colors' }],
      },
    ]),
    fieldScopes: {
      bgColor: [{ collectionId: 'imported', groupId: 'colors' }],
      textColor: [{ collectionId: 'imported' }],
    },
  };
  const normalized = normalizeImportedRegistry(registry);
  const library = normalized.collections.find((candidate) => candidate.id === 'sg-ds-library-new');
  const imported = normalized.collections.find((candidate) => candidate.id === 'imported');
  assert(library, 'legacy Imported CSS tokens should migrate into the inferred library collection');
  assert(library.extensions.source === 'sg-ds-library-new', 'migrated library CSS tokens should preserve source metadata');
  assert(library.extensions.importKind === 'library-css', 'migrated library CSS tokens should preserve CSS-derived metadata');
  assert(library.tokens.some((candidate) => candidate.id === 'brand'), 'migrated library CSS collection should contain source-matched tokens');
  assert(!library.tokens.some((candidate) => candidate.id === 'broken-rule'), 'migrated library CSS tokens should drop malformed CSS fragments');
  assert(imported?.tokens.some((candidate) => candidate.id === 'loose'), 'legacy loose token imports should remain in Imported');
  assert(
    normalized.fieldScopes.bgColor.some((scope) => scope.collectionId === 'sg-ds-library-new' && scope.groupId === 'colors'),
    'migrated library CSS tokens should retarget matching field scopes',
  );
  assert(
    normalized.fieldScopes.textColor.some((scope) => scope.collectionId === 'sg-ds-library-new'),
    'migrated collection-wide field scopes should retarget to the library collection',
  );
}

function checkMoveTokensPreservesRelativeOrder(moveTokensToGroup) {
  const registry = createRegistry([
    {
      ...collection('tokens', [
        { ...token('a', 'A', 'color', { kind: 'raw', value: '#111111' }), groupId: 'neutral' },
        { ...token('b', 'B', 'color', { kind: 'raw', value: '#222222' }), groupId: 'neutral' },
        { ...token('c', 'C', 'color', { kind: 'raw', value: '#333333' }), groupId: 'feedback' },
        { ...token('d', 'D', 'color', { kind: 'raw', value: '#444444' }), groupId: 'feedback' },
      ]),
      groups: [{ id: 'neutral', name: 'Neutral' }, { id: 'feedback', name: 'Feedback' }],
    },
  ]);

  const next = moveTokensToGroup(registry, 'tokens', ['a', 'c'], 'feedback', 'd');
  const ordered = [...next.collections[0].tokens].sort((a, b) => a.sortOrder - b.sortOrder);
  assert(ordered.map((candidate) => candidate.id).join(',') === 'b,a,c,d', 'moving multiple tokens should preserve relative order before drop target');
  assert(
    ordered.filter((candidate) => ['a', 'c'].includes(candidate.id)).every((candidate) => candidate.groupId === 'feedback'),
    'moving multiple tokens should assign the drop target group to every moved token',
  );
}

function createRegistry(collections) {
  return { schemaVersion: '0.1', collections, extensions: {} };
}

function collection(id, tokens) {
  return {
    id,
    name: id,
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: tokens.map((candidate, index) => ({ ...candidate, sortOrder: index })),
    extensions: {},
  };
}

function token(id, name, type, value) {
  return {
    id,
    name,
    type,
    values: { default: value },
    sortOrder: 0,
    extensions: {},
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function withMockedTokenIds(values, callback) {
  const originalRandom = Math.random;
  let index = 0;
  Math.random = () => ({
    toString: () => `0.${values[Math.min(index++, values.length - 1)]}`,
  });
  try {
    return callback();
  } finally {
    Math.random = originalRandom;
  }
}
