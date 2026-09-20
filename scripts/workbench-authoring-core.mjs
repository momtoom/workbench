import { createHash, randomUUID } from 'node:crypto';
import { access, readFile, realpath } from 'node:fs/promises';
import { dirname, posix, relative, resolve, sep } from 'node:path';
import { inflateSync } from 'node:zlib';
import { parse } from '@babel/parser';
import { VISITOR_KEYS } from '@babel/types';
import { buildWorkbenchProjectTokenCss } from './workbench-token-css.mjs';

const AUTHORING_PLAN_TTL_MS = 30 * 60 * 1000;
const AUTHORING_APPROVAL_TTL_MS = 8 * 60 * 60 * 1000;
const AUTHORING_GATEWAY_VERSION = 'editable-v1';
const AUTHORING_GATEWAY_SUPPORTED_VERSIONS = new Set(['structured-v2', 'structured-v3', 'structured-v4', 'structured-v5', 'structured-v6', 'structured-v7', 'structured-v8', AUTHORING_GATEWAY_VERSION]);
const AUTHORING_GATEWAY_EVIDENCE_VERSIONS = new Set(['structured-v7', 'structured-v8']);
const AUTHORING_PAGE_ROOT = 'src/workbench-pages';
const AUTHORING_ASSET_PUBLIC_ROOT = 'public/workbench-assets';
const AUTHORING_ORGANIZATIONAL_CONTEXT_PATH = 'docs/workbench-agent/WORKBENCH-ORGANIZATIONAL-CONTEXT.md';
const AUTHORING_ASSET_KIND_FOLDERS = Object.freeze({ icon: 'icons', image: 'images', font: 'fonts', video: 'videos' });
const AUTHORING_ASSET_MIME_TYPES = Object.freeze({
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
});
const AUTHORING_COMPONENT_ROOTS = ['components', 'src/components', 'src/libraries'];
const AUTHORING_SOURCE_EXTENSION_PATTERN = /\.(?:jsx|tsx|vue)$/i;
const AUTHORING_COMPONENT_NAME_PATTERN = /^[A-Z][A-Za-z0-9_$]*$/;
const AUTHORING_PROP_NAME_PATTERN = /^(?:[A-Za-z_$][A-Za-z0-9_$]*|aria-[a-z0-9-]+|data-[a-z0-9-]+)$/;
const AUTHORING_GLOBAL_COMPONENT_PROPS = new Set(['className', 'id', 'key', 'role', 'tabIndex', 'title']);
const DESIGN_CONTEXT_LIMITS = Object.freeze({
  assets: 80,
  briefItems: 20,
  collections: 80,
  componentsPerRole: 12,
  groupsPerCollection: 40,
  notes: 40,
  pages: 100,
  roles: 80,
  sourceCharacters: 12000,
  sourceFacts: 80,
  string: 600,
  variants: 80,
});
const AUTHORING_NATIVE_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'cite',
  'button', 'circle', 'code', 'dd', 'details', 'div', 'dl', 'dt', 'ellipse', 'em', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'kbd', 'label',
  'input', 'li', 'line', 'main', 'mark', 'nav', 'ol', 'option', 'p', 'path', 'picture', 'polygon', 'polyline', 'pre', 'rect', 'section', 'select', 'small', 'source',
  'span', 'strong', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th',
  'thead', 'time', 'tr', 'u', 'ul', 'video',
]);
const AUTHORING_NATIVE_PURPOSES = new Set(['content', 'decoration', 'layout', 'semantic']);
// Composition violations that genuinely break the authored result: the compiler either
// replaces the node with `<div />` or silently drops a prop, so writing would lose content
// or produce something the author cannot edit back. Everything else the compiler emits
// faithfully, so it is reported as advice instead of blocking the write. Recommending a
// better material is useful; refusing to write an otherwise-editable page is not.
const AUTHORING_BLOCKING_COMPOSITION_CODES = new Set([
  'WB-AUTH-NODE-INVALID',
  'WB-AUTH-NODE-KIND',
  'WB-AUTH-COMPONENT-UNKNOWN',
  'WB-AUTH-TEXT-INVALID',
  'WB-AUTH-PROPS-INVALID',
  'WB-AUTH-PROP-NAME',
  'WB-AUTH-PROP-OPAQUE',
  'WB-AUTH-PROP-NONLITERAL',
  'WB-AUTH-PROP-CHILDREN',
  'WB-AUTH-RUNTIME-UNAPPROVED',
  'WB-AUTH-RUNTIME-KIND-REQUIRED',
]);
const AUTHORING_RUNTIME_CLASSES = new Set(['canvas', 'chart', 'editor', 'map', 'virtualized-grid', 'webgl']);
const AUTHORING_GESTALT_PRINCIPLES = Object.freeze([
  'figureGround',
  'proximity',
  'similarity',
  'continuity',
  'visualRelief',
]);
const AUTHORING_VISUAL_REVIEW_STATUSES = new Set(['accept', 'revise']);
const AUTHORING_GESTALT_REVIEW_STATUSES = new Set(['pass', 'revise']);
const AUTHORING_RENDER_EVIDENCE_PHASES = new Set(['before-refinement', 'after-refinement', 'final']);
const AUTHORING_RENDERERS = new Set(['workbench-design-canvas', 'workbench-browser-preview']);
const AUTHORING_VISUAL_REVIEWER_METHODS = new Set(['human-design-review', 'separate-agent', 'vision-model']);
const AUTHORING_QUALITY_SCORE_CATEGORIES = Object.freeze([
  'visualHierarchy',
  'compositionRhythm',
  'typography',
  'color',
  'componentCoherence',
  'responsiveContinuity',
  'briefSpecificity',
  'interactionClarity',
]);
const AUTHORING_QUALITY_SCORE_THRESHOLD = 80;
const AUTHORING_MAX_RENDER_EVIDENCE_BYTES = 12 * 1024 * 1024;
const AUTHORING_GEOMETRY_GRID_UNIT_PX = 8;
const AUTHORING_GEOMETRY_TOLERANCE_PX = 0;
const AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX = 1;
const AUTHORING_GEOMETRY_ELEMENT_LIMIT = 1000;
const AUTHORING_GEOMETRY_SPACING_LIMIT = 2000;
const AUTHORING_GEOMETRY_ELEMENT_KINDS = new Set(['control', 'icon', 'image', 'layout', 'surface', 'text']);
const AUTHORING_GEOMETRY_SPACING_KINDS = new Set(['baseline', 'gap', 'gutter', 'margin']);
const AUTHORING_SURFACE_ROLES = new Set(['default-workspace', 'entity-detail', 'task-flow', 'exception-workspace', 'overlay']);
const AUTHORING_SCREEN_STATES = new Set(['default', 'healthy', 'warning', 'incident', 'empty', 'loading', 'error']);
const AUTHORING_STATE_APPLICABILITY = new Set(['required', 'not-applicable']);
const AUTHORING_SECTION_OWNERSHIP = new Set(['common', 'page', 'exception']);
const AUTHORING_SECTION_EMPHASIS = new Set(['high', 'medium', 'low']);
const AUTHORING_REQUIREMENT_EVIDENCE_SOURCES = new Set(['user', 'project', 'artifact']);
const AUTHORING_REFERENCE_STATUSES = new Set(['none', 'provided']);
const AUTHORING_REFERENCE_IMPLEMENTATION_MODES = new Set(['exact-conversion', 'adapt-to-project']);
const AUTHORING_VISUAL_TARGET_STATUSES = new Set(['unresolved', 'user-supplied', 'project-established', 'user-selected']);
const AUTHORING_DESIGN_CAPABILITY_HOSTS = new Set(['codex', 'claude', 'other']);
const AUTHORING_DESIGN_CAPABILITY_PROVIDERS = new Set(['codex-product-design', 'claude-frontend-design', 'host-design-plugin', 'model-fallback']);
const AUTHORING_DESIGN_CAPABILITY_STATUSES = new Set(['used', 'unavailable']);
const AUTHORING_VISUAL_EXPLORATION_STATUSES = new Set(['resolved', 'explored']);
const AUTHORING_VISUAL_SELECTION_SOURCES = new Set(['user', 'project', 'artifact']);
const AUTHORING_CONTENT_SURFACE_MODELS = new Set(['single-surface', 'layered-surface', 'sectioned-surface']);
const AUTHORING_CONTENT_DENSITIES = new Set(['minimal', 'balanced', 'dense']);
const AUTHORING_BORDER_POLICIES = new Set(['borderless', 'dividers-only', 'contained']);
const AUTHORING_CARD_POLICIES = new Set(['avoid', 'independent-only', 'allowed']);
const AUTHORING_OVERLAY_POLICIES = new Set(['none', 'contextual-only', 'workflow-owned']);
const AUTHORING_DIVIDER_POLICIES = new Set(['none', 'rows-only', 'sectional']);
const AUTHORING_DISCLOSURE_OWNERS = new Set(['inline', 'popover', 'menu', 'dialog', 'drawer', 'dedicated-page']);
const AUTHORING_VISUAL_CONSTRAINT_STATUSES = new Set(['pass', 'revise']);
const AUTHORING_IDEATION_MODES = new Set(['focused', 'divergent']);
const AUTHORING_INTERACTION_MODELS = new Set([
  'comparison-first',
  'content-first',
  'conversation-first',
  'decision-first',
  'diagnosis-first',
  'direct-manipulation',
  'guided-resolution',
  'monitoring-first',
  'timeline-first',
  'other',
]);
const AUTHORING_DISCLOSURE_MODELS = new Set([
  'contextual-overlays',
  'dedicated-detail',
  'inline-progressive',
  'mixed',
  'workflow-overlay',
]);
const AUTHORING_DIFFERENTIATION_AXES = new Set([
  'experience-hypothesis',
  'primary-decision',
  'dominant-evidence',
  'information-architecture',
  'interaction-model',
  'disclosure-model',
  'service-tradeoff',
]);
const AUTHORING_PRODUCT_DIFFERENTIATION_AXES = new Set([
  'experience-hypothesis',
  'primary-decision',
  'dominant-evidence',
]);
const AUTHORING_STRUCTURAL_DIFFERENTIATION_AXES = new Set([
  'information-architecture',
  'interaction-model',
  'disclosure-model',
  'service-tradeoff',
]);
const AUTHORING_NON_BYPASSABLE_VISUAL_WARNING_CODES = new Set([
  'WB-AUTH-VISUAL-SURFACE-SATURATION',
  'WB-AUTH-VISUAL-PERSISTENT-REGIONS',
  'WB-AUTH-VISUAL-FULL-HEIGHT-PARTITIONS',
  'WB-AUTH-VISUAL-OUTLINED-CONTAINERS',
  'WB-AUTH-VISUAL-CARD-POLICY',
  'WB-AUTH-VISUAL-OVERLAY-POLICY',
  'WB-AUTH-VISUAL-DIVIDER-POLICY',
  'WB-AUTH-VISUAL-VERTICAL-PARTITIONS',
]);
const AUTHORING_REQUIRED_EVIDENCE_FIELDS = Object.freeze([
  'product.name',
  'product.purpose',
  'product.primaryUser',
  'surface.role',
  'surface.primaryOutcome',
  'surface.primaryAction',
  'surface.actionConsequence',
  'surface.nextStep',
  'designIntelligence.workflow',
  'designIntelligence.decisions',
  'designIntelligence.operationalRules',
  'designIntelligence.content',
  'designIntelligence.reference',
  'ownership.common',
  'ownership.page',
  'ownership.exception',
  'states.default',
  'states.healthy',
  'states.incident',
  'sections',
  'dataRequirements',
  'visualComposition.surfaceModel',
  'visualComposition.borderPolicy',
  'visualComposition.disclosures',
]);
const AUTHORING_COMPONENT_ROLE_RULES = [
  { pattern: /(?:^|)(?:IconButton|Button)$/, roles: ['control.action'], nativeReplacements: ['button'] },
  { pattern: /(?:Input|Textarea|SearchField|InputField)$/, roles: ['control.input'], nativeReplacements: ['input', 'textarea'] },
  { pattern: /Slider$/, roles: ['control.range'], nativeReplacements: [] },
  { pattern: /(?:Select|Combobox|RadioGroup|Checkbox|Switch|Toggle)$/, roles: ['control.selection'], nativeReplacements: ['select'] },
  { pattern: /Item$/, roles: ['collection.item'], nativeReplacements: [] },
  { pattern: /(?:Card|Alert)$/, roles: ['surface.card'], nativeReplacements: [] },
  { pattern: /(?:Dialog|AlertDialog|Drawer|Sheet|Modal)$/, roles: ['surface.dialog'], nativeReplacements: [] },
  { pattern: /Tabs$/, roles: ['navigation.tabs'], nativeReplacements: [] },
  { pattern: /(?:Navigation|NavigationMenu|Menubar)$/, roles: ['navigation.primary'], nativeReplacements: [] },
  { pattern: /Carousel$/, roles: ['collection.carousel'], nativeReplacements: [] },
  { pattern: /Table$/, roles: ['collection.table'], nativeReplacements: ['table'] },
  { pattern: /(?:Image|AspectRatio)$/, roles: ['media.image'], nativeReplacements: ['img'] },
  { pattern: /Icon$/, roles: ['media.icon'], nativeReplacements: ['svg'] },
  { pattern: /(?:Stack|VStack|HStack)$/, roles: ['layout.stack'], nativeReplacements: [] },
  { pattern: /Grid$/, roles: ['layout.grid'], nativeReplacements: [] },
  { pattern: /(?:Text|Caption|Label)$/, roles: ['content.text'], nativeReplacements: [] },
  { pattern: /(?:Heading|Title)$/, roles: ['content.heading'], nativeReplacements: [] },
];

export function createWorkbenchAuthoringService({
  writeFileAtomic,
  getPreviewCssStatus = null,
  synchronizePreviewCss = null,
}) {
  if (typeof writeFileAtomic !== 'function') {
    throw new Error('Workbench authoring service requires an atomic file writer.');
  }
  if (synchronizePreviewCss !== null && typeof synchronizePreviewCss !== 'function') {
    throw new Error('synchronizePreviewCss must be a function when provided.');
  }
  if (getPreviewCssStatus !== null && typeof getPreviewCssStatus !== 'function') {
    throw new Error('getPreviewCssStatus must be a function when provided.');
  }

  const inspections = new Map();
  const requirements = new Map();
  const executionPrompts = new Map();
  const approvedPrompts = new Map();
  const plans = new Map();
  const renderEvidence = new Map();
  return {
    async assertProjectTarget(projectRoot, input = {}) {
      const project = await loadAuthoringProjectIdentity(projectRoot);
      return {
        ok: true,
        projectBinding: validateAuthoringProjectTarget(project, input, projectRoot, { requireEvidence: false }),
      };
    },

    async inspectDesignContext(projectRoot, input = {}) {
      const project = await loadAuthoringProject(projectRoot);
      const projectBinding = validateAuthoringProjectTarget(project, input?.projectTarget, projectRoot, { requireEvidence: true });
      const selectionRegistry = await readOptionalJson(project.selectionPath, {
        schemaVersion: '0.1',
        activeTarget: null,
        selectedTargets: [],
        extensions: {},
      });
      const [tokenRegistry, assetRegistry, notes, organizationalContext, activeSource, previewCss] = await Promise.all([
        readJson(project.tokensPath, 'Workbench token registry'),
        readOptionalJson(project.assetsPath, { schemaVersion: '0.1', assets: [], extensions: {} }),
        readDesignContextNotes(project, selectionRegistry),
        readOrganizationalContext(project),
        readDesignContextActiveSource(project, selectionRegistry),
        inspectPreviewCssStatus(projectRoot, project, getPreviewCssStatus),
      ]);
      const briefReadiness = createDesignBriefReadiness(input);
      const context = {
        project: summarizeDesignContextProject(project),
        projectBinding,
        pages: summarizeDesignContextPages(project.pages, selectionRegistry),
        selection: summarizeDesignContextSelection(selectionRegistry),
        components: summarizeDesignContextComponents(project.catalog, project.components),
        tokens: summarizeDesignContextTokens(tokenRegistry),
        assets: summarizeDesignContextAssets(assetRegistry),
        notes,
        organizationalContext,
        activeSource,
        previewCss,
        briefReadiness,
      };
      context.designIntelligence = createDesignIntelligenceReport(context);
      const revision = createContentRevision(JSON.stringify(context));
      inspections.set(revision, {
        projectRoot: resolve(projectRoot),
        projectId: project.config.projectId,
        projectBinding,
        catalogRevision: project.catalogRevision,
        briefReadiness,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString(),
      });
      pruneExpiredRecords(inspections);
      return {
        ok: true,
        revision,
        procedure: createAuthoringProcedureChecklist(),
        ...context,
      };
    },

    async confirmRequirements(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const contextRevision = getRequiredString(input, 'contextRevision');
      const inspection = inspections.get(contextRevision);
      if (!inspection) {
        throw createAuthoringError('WB-AUTH-CONTEXT-MISSING', 'Design context inspection was not found or has expired. Inspect the active project again before confirming requirements.');
      }
      if (Date.parse(inspection.expiresAt) <= Date.now()) {
        inspections.delete(contextRevision);
        throw createAuthoringError('WB-AUTH-CONTEXT-EXPIRED', 'Design context inspection expired. Inspect the active project again before confirming requirements.');
      }
      if (inspection.projectRoot !== resolve(projectRoot) || inspection.projectId !== project.config.projectId || inspection.catalogRevision !== project.catalogRevision) {
        throw createAuthoringError('WB-AUTH-CONTEXT-STALE', 'Project identity or component catalog changed after design context inspection. Inspect the active project again.');
      }
      if (inspection.briefReadiness?.status === 'needs-clarification') {
        throw createAuthoringError('WB-AUTH-BRIEF-UNRESOLVED', 'The inspected brief still has unresolved high-impact fields. Resolve the returned questions and inspect the completed brief again before confirming requirements.');
      }
      const contract = {
        ...normalizeRequirementsInput(input),
        visualDirection: inspection.briefReadiness.visualDirectionReadiness,
      };
      const requirement = {
        id: randomUUID(),
        projectRoot: resolve(projectRoot),
        projectId: project.config.projectId,
        catalogRevision: project.catalogRevision,
        contextRevision,
        contract,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString(),
      };
      requirements.set(requirement.id, requirement);
      pruneExpiredRecords(requirements);
      return {
        ok: true,
        requirements: requirement,
        procedure: createAuthoringProcedureChecklist(),
        instruction: 'Requirements were recorded as optional design context. They can improve a difficult brief, but page planning and writing do not depend on this contract.',
      };
    },

    async prepareExecutionPrompt(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const request = normalizeExecutionPromptInput(input, project.pages);
      const requirement = getActiveRequirement(requirements, request.requirementsId, project, projectRoot);
      const executionPrompt = {
        id: randomUUID(),
        projectRoot: resolve(projectRoot),
        projectId: project.config.projectId,
        catalogRevision: project.catalogRevision,
        requirementsId: requirement.id,
        request,
        prompt: createPageExecutionPrompt(requirement.contract, request),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString(),
      };
      executionPrompts.set(executionPrompt.id, executionPrompt);
      pruneExpiredRecords(executionPrompts);
      return {
        ok: true,
        executionPrompt,
        instruction: 'Use this prompt as an optional collaboration artifact when the user wants to review scope before implementation. It is not a write gate.',
      };
    },

    async confirmExecutionPrompt(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const promptId = getRequiredString(input, 'promptId');
      const prompt = executionPrompts.get(promptId);
      if (!prompt) throw createAuthoringError('WB-AUTH-EXECUTION-PROMPT-MISSING', 'Execution prompt was not found or has expired. Prepare and show a fresh prompt.');
      if (Date.parse(prompt.expiresAt) <= Date.now()) {
        executionPrompts.delete(promptId);
        throw createAuthoringError('WB-AUTH-EXECUTION-PROMPT-EXPIRED', 'Execution prompt expired. Prepare and show a fresh prompt.');
      }
      if (prompt.projectRoot !== resolve(projectRoot) || prompt.projectId !== project.config.projectId) {
        throw createAuthoringError('WB-AUTH-EXECUTION-PROMPT-STALE', 'The active project changed after the execution prompt was prepared. Prepare and show the prompt for the intended project.');
      }
      getActiveRequirement(requirements, prompt.requirementsId, project, projectRoot);
      const approvalEvidence = isRecord(input?.approvalEvidence) ? input.approvalEvidence : {};
      if (getRequiredString(approvalEvidence, 'source') !== 'user') {
        throw createAuthoringError('WB-AUTH-EXECUTION-APPROVAL-SOURCE', 'Execution prompt approval must be grounded in an explicit user response.');
      }
      const approval = {
        id: randomUUID(),
        promptId,
        requirementsId: prompt.requirementsId,
        projectRoot: prompt.projectRoot,
        projectId: prompt.projectId,
        request: prompt.request,
        promptRevision: createContentRevision(prompt.prompt),
        evidence: { source: 'user', reference: getRequiredString(approvalEvidence, 'reference') },
        approvedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_APPROVAL_TTL_MS).toISOString(),
      };
      const requirement = requirements.get(prompt.requirementsId);
      if (requirement) requirement.expiresAt = approval.expiresAt;
      approvedPrompts.set(approval.id, approval);
      pruneExpiredRecords(approvedPrompts);
      return {
        ok: true,
        approval,
        instruction: 'The optional prompt approval was recorded. It may be attached to a plan for provenance, but it is not required for authoring or refinement.',
      };
    },

    async search(projectRoot, input = {}) {
      const project = await loadAuthoringProject(projectRoot);
      return searchComponentCatalog(project.catalog, input);
    },

    async plan(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const normalized = normalizePlanInput(input, project.pages);
      const requirement = normalized.requirementsId
        ? getActiveRequirement(requirements, normalized.requirementsId, project, projectRoot)
        : null;
      const promptApproval = normalized.approvedPromptId
        ? approvedPrompts.get(normalized.approvedPromptId)
        : null;
      if (normalized.approvedPromptId && !promptApproval) {
        throw createAuthoringError('WB-AUTH-EXECUTION-APPROVAL-MISSING', 'The supplied optional prompt approval was not found or has expired.');
      }
      if (promptApproval && Date.parse(promptApproval.expiresAt) <= Date.now()) {
        approvedPrompts.delete(normalized.approvedPromptId);
        throw createAuthoringError('WB-AUTH-EXECUTION-APPROVAL-EXPIRED', 'The supplied optional prompt approval expired.');
      }
      if (promptApproval && (promptApproval.projectRoot !== resolve(projectRoot) || promptApproval.projectId !== project.config.projectId)) {
        throw createAuthoringError('WB-AUTH-EXECUTION-APPROVAL-STALE', 'The supplied optional prompt approval belongs to another project.');
      }
      const approvedExecutionPrompt = promptApproval
        ? executionPrompts.get(promptApproval.promptId) ?? { request: promptApproval.request }
        : null;
      const filePath = resolveAuthoringPagePath(projectRoot, normalized.sourceFile, project.pages);
      const baseRevision = await readSourceRevision(filePath);
      const plan = {
        id: randomUUID(),
        projectRoot: resolve(projectRoot),
        projectId: project.config.projectId,
        pageName: normalized.pageName,
        route: normalized.route,
        sourceFile: normalized.sourceFile,
        exportName: normalized.exportName,
        requirementsId: requirement?.id ?? null,
        approvedPromptId: promptApproval?.id ?? null,
        refinementAttempt: 0,
        executionPrompt: approvedExecutionPrompt,
        requirements: requirement?.contract ?? null,
        designEvidence: normalized.designEvidence,
        visualHierarchy: normalized.visualHierarchy,
        authoringSessionId: normalized.authoringSessionId ?? randomUUID(),
        geometryContract: normalized.geometryContract,
        baseRevision,
        catalogRevision: project.catalogRevision,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString(),
      };
      plans.set(plan.id, plan);
      pruneExpiredRecords(plans);
      const componentMatches = (normalized.intents ?? []).map((intent) => ({
        intent,
        components: searchComponentCatalog(project.catalog, { roles: [intent], limit: 8 }).components,
      }));
      return {
        ok: true,
        plan,
        componentMatches,
        promotionCandidates: componentMatches
          .filter((match) => match.components.length === 0)
          .map((match) => ({ intent: match.intent, status: 'optional' })),
        fallback: 'Native HTML and existing primitives are valid first-class authoring choices. Use a registered component only when its behavior, accessibility, reuse, or Inspector prop contract is useful; a catalog match never forces replacement.',
      };
    },

    async apply(projectRoot, input) {
      const request = normalizeApplyInput(input);
      const plan = plans.get(request.planId);
      if (!plan) throw createAuthoringError('WB-AUTH-PLAN-MISSING', 'Authoring plan was not found or has already been consumed.');
      if (Date.parse(plan.expiresAt) <= Date.now()) {
        plans.delete(plan.id);
        throw createAuthoringError('WB-AUTH-PLAN-EXPIRED', 'Authoring plan expired. Create a fresh plan before writing.');
      }
      if (resolve(projectRoot) !== plan.projectRoot) {
        throw createAuthoringError('WB-AUTH-PROJECT-MISMATCH', 'Authoring plan belongs to a different project root.');
      }

      const project = await loadAuthoringProject(projectRoot);
      if (project.config.projectId !== plan.projectId || project.catalogRevision !== plan.catalogRevision) {
        throw createAuthoringError('WB-AUTH-CATALOG-STALE', 'Project or component catalog changed after planning. Create a fresh plan.');
      }

      const filePath = resolveAuthoringPagePath(projectRoot, plan.sourceFile, project.pages);
      const currentRevision = await readSourceRevision(filePath);
      if (currentRevision !== plan.baseRevision) {
        throw createAuthoringError('WB-AUTH-SOURCE-STALE', 'Page source changed after planning. Create a fresh plan before writing.');
      }

      const compileResult = compileAuthoringPage({
        catalog: project.catalog,
        exportName: plan.exportName,
        root: request.root,
        sourceFile: plan.sourceFile,
      });
      const verification = analyzeAuthoringSource({
        catalog: project.catalog,
        contents: compileResult.contents,
        exportName: plan.exportName,
        sourceFile: plan.sourceFile,
      });
      if (!verification.ok) {
        throw createAuthoringError('WB-AUTH-VERIFY-FAILED', 'Generated page failed the Workbench authoring contract.', verification.violations);
      }

      const visualSignals = analyzeAuthoringVisualSignals({
        catalog: project.catalog,
        root: request.root,
        visualHierarchy: plan.visualHierarchy ?? { attentionOrder: [], emphasis: { highEmphasisLimit: 1 } },
        visualComposition: plan.requirements?.visualComposition ?? null,
      });
      const revision = createContentRevision(compileResult.contents);
      await writeFileAtomic(filePath, compileResult.contents);
      let previewCss = await inspectPreviewCssStatus(projectRoot, project, getPreviewCssStatus);
      try {
        if (synchronizePreviewCss) previewCss = await synchronizePreviewCss(projectRoot, plan.sourceFile);
      } catch (error) {
        plan.baseRevision = revision;
        plan.expiresAt = new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString();
        throw createAuthoringError(
          'WB-AUTH-PREVIEW-CSS-SYNC',
          `Page source was written, but Workbench preview CSS synchronization failed. Retry the same plan after fixing the Tailwind build: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const synchronizedProject = await loadAuthoringProject(projectRoot);
      const renderRevision = await createAuthoringRenderRevision(synchronizedProject, plan.sourceFile, compileResult.contents);
      const nextPages = upsertAuthoringPage(synchronizedProject.pages, {
        ...plan,
        revision,
        renderRevision,
        visualSignals,
      });
      await writeFileAtomic(project.pagesPath, `${JSON.stringify(nextPages, null, 2)}\n`);
      plans.delete(plan.id);

      return {
        ok: true,
        page: nextPages.pages.find((page) => page.sourceFile === plan.sourceFile),
        revision,
        renderRevision,
        sourceFile: plan.sourceFile,
        previewCss,
        verification,
        compositionAdvisories: compileResult.advisories,
        visualQualityGate: {
          required: false,
          requirements: plan.requirements,
          designEvidence: plan.designEvidence,
          visualHierarchy: plan.visualHierarchy,
          geometryContract: plan.geometryContract,
          visualSignals,
          instruction: 'Use practical visual review proportional to the request: inspect the Workbench Design canvas, fix obvious overflow or interaction defects, and compare requested viewports or references when relevant. Render receipts, numeric scores, independent review, and final approval are optional.',
        },
      };
    },

    async submitRenderEvidence(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const evidence = normalizeRenderEvidenceInput(input);
      const sourceFile = normalizeProjectPath(evidence.sourceFile);
      const filePath = resolveAuthoringPagePath(projectRoot, sourceFile, project.pages);
      const contents = await readFile(filePath, 'utf8');
      const currentRevision = createContentRevision(contents);
      if (evidence.sourceRevision !== currentRevision) {
        throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-STALE', 'Render evidence must be captured from the current page source revision.');
      }
      const page = (Array.isArray(project.pages?.pages) ? project.pages.pages : [])
        .find((candidate) => normalizeProjectPath(candidate?.sourceFile ?? '') === sourceFile);
      const gateway = isRecord(page?.extensions?.authoringGateway) ? page.extensions.authoringGateway : null;
      if (gateway?.version !== AUTHORING_GATEWAY_VERSION || gateway?.sourceRevision !== currentRevision) {
        throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-UNPLANNED', 'Render evidence requires a current structured page contract.');
      }
      const currentRenderRevision = await createAuthoringRenderRevision(project, sourceFile, contents);
      if (evidence.renderRevision !== currentRenderRevision || gateway.renderRevision !== currentRenderRevision) {
        throw createAuthoringError('WB-AUTH-RENDER-REVISION-STALE', 'Page source, registered components, tokens, or configured project styles changed after apply. Create and apply a fresh plan before capturing evidence.');
      }
      const receipt = {
        id: randomUUID(),
        projectRoot: resolve(projectRoot),
        projectId: project.config.projectId,
        sourceFile,
        sourceRevision: currentRevision,
        renderRevision: currentRenderRevision,
        phase: evidence.phase,
        viewport: evidence.viewport,
        capture: evidence.capture,
        geometryEvaluation: evidence.geometryEvaluation,
        artifact: evidence.artifact,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + AUTHORING_PLAN_TTL_MS).toISOString(),
      };
      renderEvidence.set(receipt.id, receipt);
      pruneExpiredRecords(renderEvidence);
      return {
        ok: true,
        receipt: withoutPrivateReceiptFields(receipt),
        instruction: evidence.phase === 'before-refinement'
          ? 'Revise the page through a fresh plan/apply cycle, then capture matching after-refinement wide and compact evidence.'
          : evidence.phase === 'final'
            ? 'Combine final receipts from Workbench Browser Preview and Workbench Design Canvas, covering wide and compact viewports, in workbench_submit_visual_review from an independent reviewer session.'
            : 'Use the before/after receipt pairs in workbench_submit_visual_review from a reviewer session distinct from the authoring session.',
      };
    },

    async submitVisualReview(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const review = normalizeVisualReviewInput(input);
      const sourceFile = normalizeProjectPath(review.sourceFile);
      const filePath = resolveAuthoringPagePath(projectRoot, sourceFile, project.pages);
      const contents = await readFile(filePath, 'utf8');
      const currentRevision = createContentRevision(contents);
      if (review.sourceRevision !== currentRevision) {
        throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-STALE', 'The rendered-page review does not match the current page source revision. Render and review the latest source.');
      }

      const page = (Array.isArray(project.pages?.pages) ? project.pages.pages : [])
        .find((candidate) => normalizeProjectPath(candidate?.sourceFile ?? '') === sourceFile);
      const gateway = isRecord(page?.extensions?.authoringGateway) ? page.extensions.authoringGateway : null;
      if (gateway?.version !== AUTHORING_GATEWAY_VERSION || gateway?.sourceRevision !== currentRevision) {
        throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-UNPLANNED', 'The page does not have a current structured design contract. Create and apply a fresh page plan first.');
      }

      const currentRenderRevision = await createAuthoringRenderRevision(project, sourceFile, contents);
      if (review.renderRevision !== currentRenderRevision || gateway.renderRevision !== currentRenderRevision) {
        throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-RENDER-STALE', 'The visual review does not match the current render-contract revision. Re-apply and recapture the page.');
      }

      const evidenceComparison = validateVisualReviewAgainstContract(review, gateway, renderEvidence, projectRoot);
      const reviewId = randomUUID();
      const approvalSummary = createVisualApprovalSummary({ ...review, id: reviewId }, evidenceComparison);
      const nextPages = {
        ...project.pages,
        pages: project.pages.pages.map((candidate) => candidate.id !== page.id ? candidate : {
          ...candidate,
          extensions: {
            ...(isRecord(candidate.extensions) ? candidate.extensions : {}),
            authoringGateway: {
              ...gateway,
              visualReview: {
                ...review,
                id: reviewId,
                evidence: evidenceComparison,
                reviewedAt: new Date().toISOString(),
              },
              visualApproval: null,
            },
          },
        }),
      };
      await writeFileAtomic(project.pagesPath, `${JSON.stringify(nextPages, null, 2)}\n`);
      return {
        ok: review.outcome === 'accept',
        outcome: review.outcome,
        sourceFile,
        sourceRevision: currentRevision,
        renderRevision: currentRenderRevision,
        reviewId,
        approvalRequired: review.outcome === 'accept',
        approvalSummary,
        instruction: review.outcome === 'accept'
          ? 'Show approvalSummary verbatim to the user. After explicit approval, call workbench_confirm_visual_approval before workbench_verify_page.'
          : 'Revise the source through a fresh plan/apply cycle, render again, and submit a new visual review before handoff.',
      };
    },

    async confirmVisualApproval(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const sourceFile = normalizeProjectPath(getRequiredString(input, 'sourceFile'));
      const sourceRevision = getRequiredString(input, 'sourceRevision');
      const renderRevision = getRequiredString(input, 'renderRevision');
      const reviewId = getRequiredString(input, 'reviewId');
      const approvalEvidence = input?.approvalEvidence;
      if (!isRecord(approvalEvidence) || approvalEvidence.source !== 'user') {
        throw createAuthoringError('WB-AUTH-VISUAL-APPROVAL-SOURCE', 'Final visual approval must come from the user after reviewing the exact quality summary.');
      }
      const filePath = resolveAuthoringPagePath(projectRoot, sourceFile, project.pages);
      const contents = await readFile(filePath, 'utf8');
      const currentRevision = createContentRevision(contents);
      const currentRenderRevision = await createAuthoringRenderRevision(project, sourceFile, contents);
      const page = (Array.isArray(project.pages?.pages) ? project.pages.pages : [])
        .find((candidate) => normalizeProjectPath(candidate?.sourceFile ?? '') === sourceFile);
      const gateway = isRecord(page?.extensions?.authoringGateway) ? page.extensions.authoringGateway : null;
      const review = isRecord(gateway?.visualReview) ? gateway.visualReview : null;
      if (sourceRevision !== currentRevision || renderRevision !== currentRenderRevision || gateway?.sourceRevision !== currentRevision || gateway?.renderRevision !== currentRenderRevision) {
        throw createAuthoringError('WB-AUTH-VISUAL-APPROVAL-STALE', 'The page render contract changed after visual review. Capture and review the latest render.');
      }
      if (!review || review.id !== reviewId || review.outcome !== 'accept') {
        throw createAuthoringError('WB-AUTH-VISUAL-APPROVAL-REVIEW', 'Final approval must reference the current accepted visual review.');
      }
      const approval = {
        id: randomUUID(),
        reviewId,
        sourceRevision: currentRevision,
        renderRevision: currentRenderRevision,
        evidence: { source: 'user', reference: getRequiredString(approvalEvidence, 'reference') },
        approvedAt: new Date().toISOString(),
      };
      const nextPages = {
        ...project.pages,
        pages: project.pages.pages.map((candidate) => candidate.id !== page.id ? candidate : {
          ...candidate,
          extensions: {
            ...(isRecord(candidate.extensions) ? candidate.extensions : {}),
            authoringGateway: { ...gateway, visualApproval: approval },
          },
        }),
      };
      await writeFileAtomic(project.pagesPath, `${JSON.stringify(nextPages, null, 2)}\n`);
      return { ok: true, sourceFile, sourceRevision: currentRevision, renderRevision: currentRenderRevision, reviewId, approval };
    },

    async verify(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const previewCss = await inspectPreviewCssStatus(projectRoot, project, getPreviewCssStatus);
      const sourceFile = normalizeProjectPath(getRequiredString(input, 'sourceFile'));
      const filePath = resolveAuthoringPagePath(projectRoot, sourceFile, project.pages);
      const contents = await readFile(filePath, 'utf8');
      const analysis = analyzeAuthoringSource({
        catalog: project.catalog,
        contents,
        exportName: typeof input?.exportName === 'string' ? input.exportName.trim() : null,
        sourceFile,
      });
      const page = (Array.isArray(project.pages?.pages) ? project.pages.pages : [])
        .find((candidate) => normalizeProjectPath(candidate?.sourceFile ?? '') === sourceFile);
      const gateway = isRecord(page?.extensions?.authoringGateway) ? page.extensions.authoringGateway : null;
      if (!AUTHORING_GATEWAY_SUPPORTED_VERSIONS.has(gateway?.version)) return { ...analysis, previewCss };

      const currentRevision = createContentRevision(contents);
      const currentRenderRevision = await createAuthoringRenderRevision(project, sourceFile, contents);
      const visualReview = isRecord(gateway.visualReview) ? gateway.visualReview : null;
      const visualApproval = isRecord(gateway.visualApproval) ? gateway.visualApproval : null;
      const requiresEvidenceGate = AUTHORING_GATEWAY_EVIDENCE_VERSIONS.has(gateway.version);
      if (gateway.version === AUTHORING_GATEWAY_VERSION) {
        return {
          ...analysis,
          previewCss,
          editabilityContract: {
            version: gateway.version,
            sourceRevision: currentRevision,
            sourceCurrent: gateway.sourceRevision === currentRevision,
            requirement: 'The page must remain source-backed and editable through Workbench Layers, Inspector or Binding/source boundaries.',
          },
        };
      }
      const requiresMathematicalGate = gateway.version === 'structured-v8';
      const visualViolations = [];
      if (gateway.sourceRevision !== currentRevision) {
        visualViolations.push(createViolation('WB-AUTH-DESIGN-CONTRACT-STALE', 'source', 'The page source changed after the structured design contract was applied. Create and apply a fresh plan.'));
      }
      if (requiresEvidenceGate && (gateway.renderRevision !== currentRenderRevision || visualReview?.renderRevision !== currentRenderRevision)) {
        visualViolations.push(createViolation('WB-AUTH-RENDER-CONTRACT-STALE', 'source', 'Page source, registered components, tokens, or configured project styles changed after visual review. Create and apply a fresh plan, then recapture and review.'));
      }
      if (!visualReview || visualReview.outcome !== 'accept' || visualReview.sourceRevision !== currentRevision) {
        visualViolations.push(createViolation('WB-AUTH-VISUAL-REVIEW-MISSING', 'source', requiresEvidenceGate
          ? 'This structured page has no accepted independent visual review for the current render revision. Capture Workbench Browser Preview and Design Canvas evidence across wide and compact viewports; use direct final evidence when no refinement is needed.'
          : 'This structured page has no accepted visual review for the current source revision.'));
      }
      if (requiresEvidenceGate && (!visualApproval || visualApproval.reviewId !== visualReview?.id || visualApproval.sourceRevision !== currentRevision || visualApproval.renderRevision !== currentRenderRevision)) {
        visualViolations.push(createViolation('WB-AUTH-VISUAL-APPROVAL-MISSING', 'source', 'The user has not approved the exact accepted visual-review summary for the current render revision.'));
      }
      if (requiresMathematicalGate && visualReview?.evidence?.some((comparison) => comparison?.after?.geometryEvaluation?.passed !== true)) {
        visualViolations.push(createViolation('WB-AUTH-MATHEMATICAL-QUALITY-MISSING', 'source', 'The accepted review does not contain passing server-computed 8px grid, uniform padding, and optical-balance evidence for every final viewport.'));
      }
      return {
        ...analysis,
        previewCss,
        ok: analysis.ok && visualViolations.length === 0,
        violations: [...analysis.violations, ...visualViolations],
        visualQualityGate: {
          version: gateway.version,
          sourceRevision: currentRevision,
          renderRevision: requiresEvidenceGate ? currentRenderRevision : null,
          accepted: visualViolations.length === 0,
          review: visualReview,
          approval: requiresEvidenceGate ? visualApproval : null,
          visualSignals: gateway.visualSignals,
        },
      };
    },

    async upsertTokens(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const registryContents = await readFile(project.tokensPath, 'utf8');
      const registry = JSON.parse(registryContents);
      const baseRevision = getRequiredString(input, 'baseRevision');
      if (baseRevision !== createContentRevision(registryContents)) {
        throw createAuthoringError('WB-AUTH-TOKENS-STALE', 'Token registry changed. Read the latest token revision before writing.');
      }
      const operations = Array.isArray(input?.operations) ? input.operations : [];
      if (operations.length === 0) throw createAuthoringError('WB-AUTH-TOKENS-EMPTY', 'At least one token operation is required.');
      const next = structuredClone(registry);
      for (const operation of operations) applyLayeredTokenOperation(next, operation);
      const nextContents = `${JSON.stringify(next, null, 2)}\n`;
      await writeFileAtomic(project.tokensPath, nextContents);
      await writeFileAtomic(project.tokenCssPath, buildWorkbenchProjectTokenCss(next));
      return { ok: true, operations: operations.length, revision: createContentRevision(nextContents), tokensPath: normalizeProjectPath(relative(project.root, project.tokensPath)), tokenCssPath: normalizeProjectPath(relative(project.root, project.tokenCssPath)) };
    },

    async inspectTokens(projectRoot) {
      const project = await loadAuthoringProject(projectRoot);
      const contents = await readFile(project.tokensPath, 'utf8');
      const registry = JSON.parse(contents);
      return {
        ok: true,
        revision: createContentRevision(contents),
        collections: (registry.collections ?? []).map((collection) => ({
          id: collection.id,
          name: collection.name,
          modes: collection.modes,
          groups: collection.groups,
          tokens: collection.tokens,
        })),
      };
    },

    // Installs the bytes and writes the registry record in one call, because a
    // page that references an asset the registry does not know about fails
    // WB-AUTH-UNREGISTERED-ASSET in the project's own authoring contract.
    async upsertAssets(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const entries = Array.isArray(input?.assets) ? input.assets : [];
      if (entries.length === 0) throw createAuthoringError('WB-AUTH-ASSETS-EMPTY', 'At least one asset is required.');
      const contents = await readFile(project.assetsPath, 'utf8');
      const registry = JSON.parse(contents);
      if (!Array.isArray(registry.assets)) throw createAuthoringError('WB-AUTH-ASSETS-REGISTRY', 'Project asset registry has no assets array.');

      const installed = [];
      for (const entry of entries) {
        const kind = String(entry?.kind ?? '').toLowerCase();
        const folder = AUTHORING_ASSET_KIND_FOLDERS[kind];
        if (!folder) throw createAuthoringError('WB-AUTH-ASSET-KIND', `Asset "${entry?.name ?? '(unnamed)'}" has unsupported kind "${entry?.kind}". Use icon, image, font, or video.`);
        const name = getRequiredString(entry, 'name');
        const files = Array.isArray(entry.files) ? entry.files : [];
        if (files.length === 0) throw createAuthoringError('WB-AUTH-ASSET-FILES', `Asset "${name}" has no files.`);

        const collection = createAuthoringAssetFolderName(entry.collection || name);
        const assetRoot = `public/workbench-assets/${folder}/${collection}`;
        const previews = [];
        let totalSize = 0;
        for (const file of files) {
          const { bytes, fileName } = await readAuthoringAssetBytes(file);
          const relativeFilePath = `${assetRoot}/${fileName}`;
          await writeFileAtomic(resolveAuthoringAssetPath(project.root, relativeFilePath), bytes);
          totalSize += bytes.byteLength;
          previews.push({
            ...(kind === 'icon' ? { importName: typeof file.importName === 'string' && file.importName ? file.importName : toAuthoringAssetImportName(file.label || fileName) } : {}),
            name: typeof file.label === 'string' && file.label ? file.label : fileName.replace(/\.[^.]+$/, ''),
            sourceFile: fileName,
            ...(kind === 'icon' && typeof file.style === 'string' && file.style ? { style: file.style } : {}),
            value: `/workbench-assets/${folder}/${collection}/${fileName}`,
          });
        }

        const id = typeof entry.id === 'string' && entry.id ? entry.id : `asset-${collection}`;
        const existing = registry.assets.find((asset) => asset?.id === id);
        const now = new Date().toISOString();
        const extension = previews[0].sourceFile.slice(previews[0].sourceFile.lastIndexOf('.')).toLowerCase();
        const figma = isRecord(entry.figma) ? entry.figma : {};
        registry.assets = [...registry.assets.filter((asset) => asset?.id !== id), {
          id,
          name,
          kind,
          source: { type: 'project-file', value: previews[0].value, filePath: `${assetRoot}/${previews[0].sourceFile}` },
          fileName: previews.length > 1 ? `${collection}${extension}-set` : previews[0].sourceFile,
          mimeType: AUTHORING_ASSET_MIME_TYPES[extension] ?? 'application/octet-stream',
          size: totalSize,
          tags: [...new Set([kind, ...(Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === 'string') : [])])],
          createdAt: typeof existing?.createdAt === 'string' ? existing.createdAt : now,
          updatedAt: now,
          extensions: {
            ...(typeof figma.fileKey === 'string' ? { sourceFigmaFileKey: figma.fileKey } : {}),
            ...(typeof figma.fileName === 'string' ? { sourceFigmaFileName: figma.fileName } : {}),
            ...(typeof figma.nodeId === 'string' ? { sourceFigmaNodeId: figma.nodeId } : {}),
            ...(typeof figma.nodeName === 'string' ? { sourceFigmaNodeName: figma.nodeName } : {}),
            installedAs: 'project-assets',
            sourceAssetRoot: assetRoot,
            ...(kind === 'icon' ? { previewIcons: previews } : {}),
            ...(kind === 'image' ? { previewImages: previews } : {}),
          },
        }];
        installed.push({ id, kind, fileCount: previews.length, assetRoot, size: totalSize, urls: previews.map((preview) => preview.value) });
      }

      registry.extensions = isRecord(registry.extensions) ? registry.extensions : {};
      const nextContents = `${JSON.stringify(registry, null, 2)}\n`;
      await writeFileAtomic(project.assetsPath, nextContents);
      return {
        ok: true,
        assets: installed,
        assetsPath: normalizeProjectPath(relative(project.root, project.assetsPath)),
        revision: createContentRevision(nextContents),
      };
    },

    async inspectComponent(projectRoot, input) {
      await loadAuthoringProject(projectRoot);
      const sourceFile = normalizeComponentSourcePath(getRequiredString(input, 'sourceFile'));
      const storyFile = normalizeComponentStoryPath(getRequiredString(input, 'storyFile'));
      return {
        ok: true,
        sourceFile,
        storyFile,
        source: await readOptionalAuthoringFile(resolve(projectRoot, sourceFile)),
        story: await readOptionalAuthoringFile(resolve(projectRoot, storyFile)),
      };
    },

    async upsertComponent(projectRoot, input) {
      const project = await loadAuthoringProject(projectRoot);
      const sourceFile = normalizeComponentSourcePath(getRequiredString(input, 'sourceFile'));
      const storyFile = normalizeComponentStoryPath(getRequiredString(input, 'storyFile'));
      const exportName = getRequiredString(input, 'exportName');
      if (!AUTHORING_COMPONENT_NAME_PATTERN.test(exportName)) throw createAuthoringError('WB-AUTH-COMPONENT-NAME', 'exportName must be a PascalCase component identifier.');
      const sourceContents = getRequiredString(input, 'sourceContents');
      const storyContents = getRequiredString(input, 'storyContents');
      const sourcePath = resolve(projectRoot, sourceFile);
      const storyPath = resolve(projectRoot, storyFile);
      await assertSourceRevision(sourcePath, getRequiredString(input, 'sourceRevision'), 'component source');
      await assertSourceRevision(storyPath, getRequiredString(input, 'storyRevision'), 'component story');
      validateComponentAuthoringContents({ exportName, sourceContents, storyContents });
      await writeFileAtomic(sourcePath, `${sourceContents.trimEnd()}\n`);
      await writeFileAtomic(storyPath, `${storyContents.trimEnd()}\n`);
      let previewCss = await inspectPreviewCssStatus(projectRoot, project, getPreviewCssStatus);
      try {
        if (synchronizePreviewCss) previewCss = await synchronizePreviewCss(projectRoot, sourceFile);
      } catch (error) {
        throw createAuthoringError(
          'WB-AUTH-PREVIEW-CSS-SYNC',
          `Component source and story were written, but Workbench preview CSS synchronization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return {
        ok: true,
        sourceFile,
        storyFile,
        sourceRevision: createContentRevision(`${sourceContents.trimEnd()}\n`),
        storyRevision: createContentRevision(`${storyContents.trimEnd()}\n`),
        previewCss,
        reconciliation: 'reload-required',
      };
    },
  };
}

function normalizeComponentSourcePath(value) {
  const path = normalizeProjectPath(value);
  if (!AUTHORING_COMPONENT_ROOTS.some((root) => path.startsWith(`${root}/`)) || !AUTHORING_SOURCE_EXTENSION_PATTERN.test(path) || path.endsWith('.stories.tsx') || path.endsWith('.stories.ts') || path.includes('/../')) {
    throw createAuthoringError('WB-AUTH-COMPONENT-PATH', `Component source must be TSX/JSX/Vue SFC under ${AUTHORING_COMPONENT_ROOTS.join(', ')}.`);
  }
  return path;
}

function normalizeComponentStoryPath(value) {
  const path = normalizeProjectPath(value);
  if (!AUTHORING_COMPONENT_ROOTS.some((root) => path.startsWith(`${root}/`)) || !/\.stories\.(?:jsx|tsx|ts)$/i.test(path) || path.includes('/../')) {
    throw createAuthoringError('WB-AUTH-COMPONENT-STORY-PATH', 'Component story must be a *.stories.tsx/jsx file (or *.stories.ts beside a Vue SFC) in project components.');
  }
  return path;
}

async function readOptionalAuthoringFile(filePath) {
  try {
    const contents = await readFile(filePath, 'utf8');
    return { contents, revision: createContentRevision(contents) };
  } catch (error) {
    if (error?.code === 'ENOENT') return { contents: null, revision: 'missing' };
    throw error;
  }
}

async function assertSourceRevision(filePath, expected, label) {
  const actual = await readSourceRevision(filePath);
  if (actual !== expected) throw createAuthoringError('WB-AUTH-SOURCE-STALE', `${label} changed after inspection.`);
}

function validateComponentAuthoringContents({ exportName, sourceContents, storyContents }) {
  try {
    parse(sourceContents, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    parse(storyContents, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  } catch (error) {
    throw createAuthoringError('WB-AUTH-COMPONENT-SYNTAX', error instanceof Error ? error.message : 'Component source or story could not be parsed.');
  }
  const escapedName = exportName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`export\\s+(?:const|function|class)\\s+${escapedName}\\b|export\\s*\\{[^}]*\\b${escapedName}\\b`, 'm').test(sourceContents)) {
    throw createAuthoringError('WB-AUTH-COMPONENT-EXPORT', `Component source must export ${exportName}.`);
  }
  const requiredStoryContracts = [
    ['default export', /export\s+default\b/],
    ['component binding', new RegExp(`\\bcomponent\\s*:\\s*${escapedName}\\b`)],
    ['args', /\bargs\s*:/],
    ['argTypes', /\bargTypes\s*:/],
    ['sourceInsert', /\bsourceInsert\s*:/],
  ];
  const missing = requiredStoryContracts.filter(([, pattern]) => !pattern.test(storyContents)).map(([label]) => label);
  if (missing.length > 0) throw createAuthoringError('WB-AUTH-COMPONENT-STORY', `Component story is missing: ${missing.join(', ')}.`);
  const opaqueCollectionProp = sourceContents.match(
    /\b(items|messages|options|entries|nodes|sections|images|imageUrls|captions|descriptions)\s*\??\s*:\s*string\b/,
  );
  if (opaqueCollectionProp) {
    throw createAuthoringError(
      'WB-AUTH-COMPONENT-OPAQUE-COLLECTION',
      `${opaqueCollectionProp[1]} cannot encode designer-editable repeated content as a string prop. Use a parent plus registered child components, and insert the initial child tree with sourceInsert.jsxChildren. Data-only collections require an explicit Binding writer contract.`,
    );
  }
  const fixedVisibleConfig = sourceContents.match(
    /\b(createPowerSearchConfig|createStaticSource)\s*\(\s*\[/,
  );
  if (
    fixedVisibleConfig &&
    (
      !/\bchildren\s*\??\s*:\s*ReactNode\b/.test(sourceContents) ||
      !/\bjsxChildren\s*:/.test(storyContents)
    )
  ) {
    throw createAuthoringError(
      'WB-AUTH-COMPONENT-OPAQUE-CONFIG',
      `${fixedVisibleConfig[1]} cannot hide designer-editable fields or options in a fixed internal array. Accept registered source children, provide sourceInsert.jsxChildren, and derive the runtime config from those children.`,
    );
  }
}

async function loadAuthoringProject(projectRoot) {
  const { config, root: resolvedRoot } = await loadAuthoringProjectIdentity(projectRoot);

  const componentsPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.components, '.workbench/components.json');
  const pagesPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.pages, '.workbench/pages.json');
  const tokensPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.tokens, '.workbench/tokens.json');
  const assetsPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.assets, '.workbench/assets.json');
  const notesPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.notes ?? config.paths?.comments, '.workbench/notes.json');
  const selectionPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.selection, '.workbench/selection.json');
  const tokenCssPath = resolveProjectMetadataPath(resolvedRoot, config.paths?.tokenCss, 'src/workbench-tokens.css');
  const [components, pages] = await Promise.all([
    readJson(componentsPath, 'Workbench component registry'),
    readJson(pagesPath, 'Workbench page registry'),
  ]);
  const catalog = await createComponentCatalog(components, resolvedRoot);
  return {
    catalog,
    catalogRevision: createContentRevision(JSON.stringify(catalog)),
    components,
    config,
    assetsPath,
    notesPath,
    pages,
    pagesPath,
    root: resolvedRoot,
    selectionPath,
    tokensPath,
    tokenCssPath,
  };
}

async function inspectPreviewCssStatus(projectRoot, project, getPreviewCssStatus) {
  if (getPreviewCssStatus) return getPreviewCssStatus(projectRoot);
  const extensions = isRecord(project.config?.extensions) ? project.config.extensions : {};
  const tailwind = isRecord(extensions.tailwind) ? extensions.tailwind : null;
  const enabled = Boolean(tailwind) && tailwind.enabled !== false;
  const compiledCss = typeof tailwind?.compiledCss === 'string' ? normalizeProjectPath(tailwind.compiledCss) : null;
  const tokenCss = typeof tailwind?.tokenCss === 'string'
    ? normalizeProjectPath(tailwind.tokenCss)
    : normalizeProjectPath(project.config?.paths?.tokenCss ?? 'src/workbench-tokens.css');
  if (!enabled) {
    return {
      compiledCss,
      mode: 'disabled',
      renderFreshness: {
        error: null,
        fresh: true,
        inputRevision: null,
        outputRevision: null,
        ready: true,
        reason: 'Tailwind preview CSS is disabled; no compiled Tailwind layer is required.',
        representative: true,
        state: 'ready',
      },
      status: 'not-configured',
      tokenCss,
    };
  }
  return {
    compiledCss,
    mode: compiledCss ? 'compiled' : 'fallback',
    renderFreshness: {
      error: null,
      fresh: false,
      inputRevision: null,
      outputRevision: null,
      ready: false,
      reason: 'This authoring service cannot verify whether preview CSS was built from the current project source.',
      representative: false,
      state: 'unavailable',
    },
    status: 'unavailable',
    tokenCss,
  };
}

async function loadAuthoringProjectIdentity(projectRoot) {
  const resolvedRoot = resolve(projectRoot);
  const configPath = resolve(resolvedRoot, '.workbench', 'workbench.config.json');
  const config = await readJson(configPath, 'Workbench project config');
  if (config?.workbench?.app !== 'workbench-v1' || typeof config?.projectId !== 'string') {
    throw createAuthoringError('WB-AUTH-PROJECT-INVALID', 'Active folder is not a valid Workbench V1 project.');
  }
  return {
    config,
    root: resolvedRoot,
  };
}

function summarizeDesignContextProject(project) {
  const extensions = isRecord(project.config.extensions) ? project.config.extensions : {};
  const tailwind = isRecord(extensions.tailwind) ? extensions.tailwind : {};
  const projectTemplate = isRecord(extensions.projectTemplate) ? extensions.projectTemplate : {};
  return {
    id: compactDesignContextText(project.config.projectId, 160),
    name: compactDesignContextText(typeof project.config.projectName === 'string' ? project.config.projectName : project.config.projectId, 240),
    template: {
      id: compactDesignContextText(projectTemplate.id, 160),
      name: compactDesignContextText(projectTemplate.name, 240),
    },
    styling: {
      tailwindEnabled: tailwind.enabled === true,
      sourceCss: typeof tailwind.sourceCss === 'string' ? compactDesignContextText(normalizeProjectPath(tailwind.sourceCss), 500) : null,
      compiledCss: typeof tailwind.compiledCss === 'string' ? compactDesignContextText(normalizeProjectPath(tailwind.compiledCss), 500) : null,
      tokenCss: compactDesignContextText(normalizeProjectPath(project.config.paths?.tokenCss ?? 'src/workbench-tokens.css'), 500),
    },
  };
}

function validateAuthoringProjectTarget(project, input, projectRoot, options = {}) {
  if (!isRecord(input)) {
    throw createAuthoringError('WB-AUTH-PROJECT-TARGET-REQUIRED', 'Authoring requires an explicit project target before context inspection. Provide projectId, projectName, or rootPath from the user request or trusted project context.');
  }
  const projectId = compactDesignContextText(input.projectId, 160);
  const projectName = compactDesignContextText(input.projectName, 240);
  const rootPath = compactDesignContextText(input.rootPath, 1200);
  if (!projectId && !projectName && !rootPath) {
    throw createAuthoringError('WB-AUTH-PROJECT-TARGET-REQUIRED', 'projectTarget must identify the intended project by projectId, projectName, or rootPath.');
  }
  const actualProjectId = compactDesignContextText(project.config.projectId, 160);
  const actualProjectName = compactDesignContextText(typeof project.config.projectName === 'string' ? project.config.projectName : project.config.projectId, 240);
  const actualRootPath = resolve(projectRoot);
  const mismatches = [];
  if (projectId && projectId !== actualProjectId) mismatches.push(`projectId expected ${projectId} but active project is ${actualProjectId}`);
  if (projectName && projectName.localeCompare(actualProjectName, undefined, { sensitivity: 'accent' }) !== 0) mismatches.push(`projectName expected ${projectName} but active project is ${actualProjectName}`);
  if (rootPath && resolve(rootPath) !== actualRootPath) mismatches.push(`rootPath expected ${resolve(rootPath)} but active project is ${actualRootPath}`);
  if (mismatches.length > 0) {
    throw createAuthoringError('WB-AUTH-PROJECT-TARGET-MISMATCH', 'The requested authoring project does not match the resolved Workbench project.', mismatches.map((message) => ({ code: 'project-target-mismatch', path: 'projectTarget', message })));
  }
  const requireEvidence = options.requireEvidence !== false;
  const evidence = isRecord(input.evidence) ? input.evidence : null;
  if (requireEvidence && (!evidence || !AUTHORING_REQUIREMENT_EVIDENCE_SOURCES.has(evidence.source) || !compactDesignContextText(evidence.reference, 600))) {
    throw createAuthoringError('WB-AUTH-PROJECT-TARGET-EVIDENCE', 'projectTarget.evidence must record user, project, or artifact evidence for the intended project.');
  }
  return {
    projectId: actualProjectId,
    projectName: actualProjectName,
    rootPath: actualRootPath,
    evidence: evidence ? { source: evidence.source, reference: compactDesignContextText(evidence.reference, 600) } : null,
    verifiedAt: new Date().toISOString(),
  };
}

function summarizeDesignContextPages(registry, selectionRegistry) {
  const pages = Array.isArray(registry?.pages) ? registry.pages : [];
  const selectionExtensions = isRecord(selectionRegistry?.extensions) ? selectionRegistry.extensions : {};
  const activeTarget = isRecord(selectionRegistry?.activeTarget) ? selectionRegistry.activeTarget : {};
  const activePageId = firstNonEmptyString(
    activeTarget.pageId,
    selectionExtensions.activeDesignTargetKind === 'page' ? selectionExtensions.activeDesignTargetId : null,
  );
  const prioritizedPages = activePageId
    ? [
        ...pages.filter((page) => page?.id === activePageId),
        ...pages.filter((page) => page?.id !== activePageId),
      ]
    : pages;
  return {
    total: pages.length,
    truncated: pages.length > DESIGN_CONTEXT_LIMITS.pages,
    items: prioritizedPages.slice(0, DESIGN_CONTEXT_LIMITS.pages).map((page) => ({
      id: compactDesignContextText(page?.id, 160),
      name: compactDesignContextText(page?.name, 240),
      route: compactDesignContextText(page?.route, 500),
      sourceFile: typeof page?.sourceFile === 'string' ? compactDesignContextText(normalizeProjectPath(page.sourceFile), 500) : null,
      status: compactDesignContextText(page?.status, 80),
    })),
  };
}

function summarizeDesignContextSelection(registry) {
  const extensions = isRecord(registry?.extensions) ? registry.extensions : {};
  const viewport = isRecord(extensions.designPreviewViewport) ? extensions.designPreviewViewport : {};
  const activeTarget = isRecord(registry?.activeTarget) ? registry.activeTarget : null;
  return {
    updatedAt: compactDesignContextText(registry?.updatedAt, 80),
    activeTarget: activeTarget ? {
      kind: compactDesignContextText(activeTarget.kind, 80),
      pageId: compactDesignContextText(activeTarget.pageId, 160),
      componentId: compactDesignContextText(activeTarget.componentId, 160),
      nodeId: compactDesignContextText(activeTarget.nodeId, 320),
      sourceFile: typeof activeTarget.sourceFile === 'string' ? compactDesignContextText(normalizeProjectPath(activeTarget.sourceFile), 500) : null,
      state: compactDesignContextText(activeTarget.state, 120),
    } : null,
    selectedTargetCount: Array.isArray(registry?.selectedTargets) ? registry.selectedTargets.length : 0,
    design: {
      surface: compactDesignContextText(extensions.activeWorkbenchSurface, 80),
      targetKind: compactDesignContextText(extensions.activeDesignTargetKind, 80),
      targetId: compactDesignContextText(extensions.activeDesignTargetId, 160),
      sourceFile: typeof extensions.activeDesignSourceFile === 'string' ? compactDesignContextText(normalizeProjectPath(extensions.activeDesignSourceFile), 500) : null,
      layerId: compactDesignContextText(extensions.activeDesignLayerId, 500),
      viewport: {
        width: Number.isFinite(viewport.width) ? viewport.width : null,
        height: Number.isFinite(viewport.height) ? viewport.height : null,
        presetId: compactDesignContextText(viewport.presetId, 120),
      },
      appearance: compactDesignContextText(extensions.designPreviewAppearance, 80),
    },
  };
}

async function readDesignContextActiveSource(project, selectionRegistry) {
  const extensions = isRecord(selectionRegistry?.extensions) ? selectionRegistry.extensions : {};
  const activeTarget = isRecord(selectionRegistry?.activeTarget) ? selectionRegistry.activeTarget : {};
  const activePage = (Array.isArray(project.pages?.pages) ? project.pages.pages : [])
    .find((page) => page?.id === activeTarget.pageId || page?.id === extensions.activeDesignTargetId);
  const sourceFile = firstNonEmptyString(
    extensions.activeDesignSourceFile,
    activeTarget.sourceFile,
    activePage?.sourceFile,
  );
  if (!sourceFile) return { status: 'unavailable', reason: 'No active source file is selected.' };

  const normalized = normalizeProjectPath(sourceFile);
  const filePath = resolve(project.root, normalized);
  const relativePath = relative(project.root, filePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || !AUTHORING_SOURCE_EXTENSION_PATTERN.test(normalized)) {
    return { status: 'rejected', sourceFile: compactDesignContextText(normalized, 500), reason: 'The selected source is outside the project TSX/JSX boundary.' };
  }

  let contents;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch {
    return { status: 'unavailable', sourceFile: compactDesignContextText(normalized, 500), reason: 'The selected source file could not be read.' };
  }

  const imports = [];
  const exports = [];
  const textSamples = [];
  const classTokens = [];
  const jsxCounts = new Map();
  let parseDiagnostic = null;
  try {
    const ast = parse(contents, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: false });
    for (const statement of ast.program.body) {
      if (statement.type === 'ImportDeclaration') imports.push(compactDesignContextText(statement.source?.value, 500));
      if (statement.type === 'ExportDefaultDeclaration') exports.push('default');
      if (statement.type === 'ExportNamedDeclaration') {
        if (statement.declaration?.id?.name) exports.push(statement.declaration.id.name);
        for (const specifier of statement.specifiers ?? []) {
          if (specifier.exported?.name) exports.push(specifier.exported.name);
        }
      }
    }
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'JSXOpeningElement') {
        const name = getJsxName(node.name) || 'Unknown';
        jsxCounts.set(name, (jsxCounts.get(name) ?? 0) + 1);
        for (const attribute of node.attributes ?? []) {
          if (attribute?.type === 'JSXAttribute' && attribute.name?.name === 'className' && attribute.value?.type === 'StringLiteral') {
            classTokens.push(...attribute.value.value.split(/\s+/).filter(Boolean));
          }
        }
      }
      if (node.type === 'JSXText') {
        const value = compactDesignContextText(node.value, 240);
        if (value) textSamples.push(value);
      }
      for (const key of VISITOR_KEYS[node.type] ?? []) {
        const child = node[key];
        if (Array.isArray(child)) child.forEach(visit);
        else visit(child);
      }
    };
    visit(ast.program);
  } catch (error) {
    parseDiagnostic = compactDesignContextText(error instanceof Error ? error.message : String(error), 600);
  }

  return {
    status: parseDiagnostic ? 'parse-warning' : 'collected',
    sourceFile: compactDesignContextText(normalized, 500),
    revision: createContentRevision(contents),
    lineCount: contents.split(/\r?\n/).length,
    characterCount: contents.length,
    excerptTruncated: contents.length > DESIGN_CONTEXT_LIMITS.sourceCharacters,
    excerpt: compactDesignContextText(contents, DESIGN_CONTEXT_LIMITS.sourceCharacters),
    imports: uniqueStrings(imports).slice(0, 40),
    exports: uniqueStrings(exports).slice(0, 20),
    jsxElements: [...jsxCounts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, DESIGN_CONTEXT_LIMITS.sourceFacts)
      .map(([name, count]) => ({ name: compactDesignContextText(name, 160), count })),
    textSamples: uniqueStrings(textSamples).slice(0, 40),
    classTokens: uniqueStrings(classTokens).slice(0, DESIGN_CONTEXT_LIMITS.sourceFacts),
    parseDiagnostic,
  };
}

function summarizeDesignContextComponents(catalog, registry) {
  const registryById = new Map((Array.isArray(registry?.components) ? registry.components : [])
    .filter((component) => typeof component?.id === 'string')
    .map((component) => [component.id, component]));
  const roles = new Map();
  const runtimeClasses = new Map();
  const variantComponents = [];
  let unclassified = 0;

  for (const component of catalog) {
    if (component.authoring.roles.length === 0) unclassified += 1;
    for (const role of component.authoring.roles) {
      const matches = roles.get(role) ?? [];
      matches.push({ id: compactDesignContextText(component.id, 160), name: compactDesignContextText(component.name, 240) });
      roles.set(role, matches);
    }
    if (component.authoring.runtimeClass) {
      runtimeClasses.set(component.authoring.runtimeClass, (runtimeClasses.get(component.authoring.runtimeClass) ?? 0) + 1);
    }
    const source = registryById.get(component.id);
    const variants = Array.isArray(source?.variants) ? source.variants : [];
    if (variants.length > 0) {
      variantComponents.push({
        id: compactDesignContextText(component.id, 160),
        name: compactDesignContextText(component.name, 240),
        count: variants.length,
        names: variants
          .map((variant) => typeof variant === 'string' ? variant : firstNonEmptyString(variant?.name, variant?.id))
          .filter(Boolean)
          .slice(0, 12)
          .map((name) => compactDesignContextText(name, 160)),
      });
    }
  }

  const roleEntries = [...roles.entries()].sort(([left], [right]) => left.localeCompare(right));
  const runtimeEntries = [...runtimeClasses.entries()].sort(([left], [right]) => left.localeCompare(right));
  // Most of the catalog carries no role, so a role-only summary hides real materials
  // (list items, tables, media) from whoever is choosing components. The flat name index is
  // the cheapest way to let the caller see everything and search for what it actually needs.
  const nameIndex = catalog
    .map((component) => compactDesignContextText(component.name, 240))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
  return {
    total: catalog.length,
    unclassified,
    nameIndex,
    rolesTruncated: roleEntries.length > DESIGN_CONTEXT_LIMITS.roles,
    roles: roleEntries
      .slice(0, DESIGN_CONTEXT_LIMITS.roles)
      .map(([role, components]) => ({ role: compactDesignContextText(role, 160), count: components.length, components: components.slice(0, DESIGN_CONTEXT_LIMITS.componentsPerRole) })),
    runtimeClasses: runtimeEntries
      .slice(0, 20)
      .map(([runtimeClass, count]) => ({ runtimeClass: compactDesignContextText(runtimeClass, 80), count })),
    variantComponentsTruncated: variantComponents.length > DESIGN_CONTEXT_LIMITS.variants,
    variantComponents: variantComponents.slice(0, DESIGN_CONTEXT_LIMITS.variants),
  };
}

function summarizeDesignContextTokens(registry) {
  const collections = Array.isArray(registry?.collections) ? registry.collections : [];
  return {
    total: collections.length,
    truncated: collections.length > DESIGN_CONTEXT_LIMITS.collections,
    collections: collections.slice(0, DESIGN_CONTEXT_LIMITS.collections).map((collection) => ({
      id: compactDesignContextText(collection.id, 160),
      name: compactDesignContextText(collection.name, 240),
      layer: getTokenCollectionLayer(collection),
      activeMode: compactDesignContextText(collection.activeMode, 160),
      modeCount: Array.isArray(collection.modes) ? collection.modes.length : 0,
      modesTruncated: Array.isArray(collection.modes) && collection.modes.length > DESIGN_CONTEXT_LIMITS.groupsPerCollection,
      modes: (Array.isArray(collection.modes) ? collection.modes : []).slice(0, DESIGN_CONTEXT_LIMITS.groupsPerCollection).map((mode) => ({
        id: compactDesignContextText(mode?.id, 160),
        name: compactDesignContextText(mode?.name, 240),
      })),
      groupCount: Array.isArray(collection.groups) ? collection.groups.length : 0,
      groupsTruncated: Array.isArray(collection.groups) && collection.groups.length > DESIGN_CONTEXT_LIMITS.groupsPerCollection,
      groups: (Array.isArray(collection.groups) ? collection.groups : []).slice(0, DESIGN_CONTEXT_LIMITS.groupsPerCollection).map((group) => ({
        id: compactDesignContextText(group?.id, 160),
        name: compactDesignContextText(group?.name, 240),
      })),
      tokenTypes: uniqueStrings((Array.isArray(collection.tokens) ? collection.tokens : []).map((token) => token?.type)).slice(0, 20).map((type) => compactDesignContextText(type, 80)),
      tokenCount: Array.isArray(collection.tokens) ? collection.tokens.length : 0,
    })),
  };
}

function summarizeDesignContextAssets(registry) {
  const assets = Array.isArray(registry?.assets) ? registry.assets : [];
  const kindCounts = new Map();
  for (const asset of assets) {
    const kind = typeof asset?.kind === 'string' ? asset.kind : 'unknown';
    kindCounts.set(kind, (kindCounts.get(kind) ?? 0) + 1);
  }
  const defaults = isRecord(registry?.extensions?.assetDefaults) ? registry.extensions.assetDefaults : {};
  return {
    total: assets.length,
    truncated: assets.length > DESIGN_CONTEXT_LIMITS.assets,
    kinds: [...kindCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).slice(0, 40).map(([kind, count]) => ({ kind: compactDesignContextText(kind, 80), count })),
    defaults: summarizeDesignContextValue(defaults),
    items: assets.slice(0, DESIGN_CONTEXT_LIMITS.assets).map((asset) => ({
      id: compactDesignContextText(asset?.id, 160),
      name: compactDesignContextText(asset?.name, 240),
      kind: compactDesignContextText(asset?.kind, 80),
      source: compactDesignContextText(asset?.source?.value, 1024),
      tags: uniqueStrings(Array.isArray(asset?.tags) ? asset.tags : []).slice(0, 20).map((tag) => compactDesignContextText(tag, 120)),
      fontFamily: compactDesignContextText(asset?.extensions?.fontFamily, 240),
    })),
  };
}

function normalizeDesignReferenceAnalysis(value) {
  const input = isRecord(value) ? value : {};
  const list = (field) => uniqueStrings(Array.isArray(input[field]) ? input[field] : [])
    .slice(0, DESIGN_CONTEXT_LIMITS.briefItems)
    .map((item) => compactDesignContextText(item, 300));
  return {
    implementationMode: AUTHORING_REFERENCE_IMPLEMENTATION_MODES.has(input.implementationMode)
      ? input.implementationMode
      : 'unresolved',
    sourcePrecedence: compactDesignContextText(input.sourcePrecedence, DESIGN_CONTEXT_LIMITS.string),
    pageLandmarks: list('pageLandmarks'),
    repeatedPatterns: list('repeatedPatterns'),
    hierarchyObservations: list('hierarchyObservations'),
    interactionPatterns: list('interactionPatterns'),
    responsiveBehavior: list('responsiveBehavior'),
    deliberateDeviations: list('deliberateDeviations'),
  };
}

function createDesignBriefReadiness(input) {
  const rawBrief = isRecord(input?.brief) ? input.brief : {};
  const experienceType = ['screen', 'flow', 'service-touchpoint'].includes(rawBrief.experienceType)
    ? rawBrief.experienceType
    : 'screen';
  const brief = {
    experienceType,
    productName: compactDesignContextText(rawBrief.productName, DESIGN_CONTEXT_LIMITS.string),
    servicePurpose: compactDesignContextText(rawBrief.servicePurpose, DESIGN_CONTEXT_LIMITS.string),
    audience: compactDesignContextText(rawBrief.audience, DESIGN_CONTEXT_LIMITS.string),
    journeyMoment: compactDesignContextText(rawBrief.journeyMoment, DESIGN_CONTEXT_LIMITS.string),
    surfaceRole: AUTHORING_SURFACE_ROLES.has(rawBrief.surfaceRole) ? rawBrief.surfaceRole : '',
    defaultState: compactDesignContextText(rawBrief.defaultState, DESIGN_CONTEXT_LIMITS.string),
    healthyState: compactDesignContextText(rawBrief.healthyState, DESIGN_CONTEXT_LIMITS.string),
    exceptionState: compactDesignContextText(rawBrief.exceptionState, DESIGN_CONTEXT_LIMITS.string),
    commonElements: uniqueStrings(Array.isArray(rawBrief.commonElements) ? rawBrief.commonElements : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    pageElements: uniqueStrings(Array.isArray(rawBrief.pageElements) ? rawBrief.pageElements : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    exceptionElements: uniqueStrings(Array.isArray(rawBrief.exceptionElements) ? rawBrief.exceptionElements : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    primaryOutcome: compactDesignContextText(rawBrief.primaryOutcome, DESIGN_CONTEXT_LIMITS.string),
    primaryAction: compactDesignContextText(rawBrief.primaryAction, DESIGN_CONTEXT_LIMITS.string),
    actionConsequence: compactDesignContextText(rawBrief.actionConsequence, DESIGN_CONTEXT_LIMITS.string),
    nextStep: compactDesignContextText(rawBrief.nextStep, DESIGN_CONTEXT_LIMITS.string),
    workflowModel: compactDesignContextText(rawBrief.workflowModel, DESIGN_CONTEXT_LIMITS.string),
    domainObjects: uniqueStrings(Array.isArray(rawBrief.domainObjects) ? rawBrief.domainObjects : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    keyDecisions: uniqueStrings(Array.isArray(rawBrief.keyDecisions) ? rawBrief.keyDecisions : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    actionHierarchy: uniqueStrings(Array.isArray(rawBrief.actionHierarchy) ? rawBrief.actionHierarchy : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    operationalRules: uniqueStrings(Array.isArray(rawBrief.operationalRules) ? rawBrief.operationalRules : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    failureModes: uniqueStrings(Array.isArray(rawBrief.failureModes) ? rawBrief.failureModes : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    sampleContent: uniqueStrings(Array.isArray(rawBrief.sampleContent) ? rawBrief.sampleContent : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    nonGoals: uniqueStrings(Array.isArray(rawBrief.nonGoals) ? rawBrief.nonGoals : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    successSignals: uniqueStrings(Array.isArray(rawBrief.successSignals) ? rawBrief.successSignals : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    dataRequirements: uniqueStrings(Array.isArray(rawBrief.dataRequirements) ? rawBrief.dataRequirements : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    contentPriorities: uniqueStrings(Array.isArray(rawBrief.contentPriorities) ? rawBrief.contentPriorities : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    creativeDirection: compactDesignContextText(rawBrief.creativeDirection, DESIGN_CONTEXT_LIMITS.string),
    visualTargetStatus: AUTHORING_VISUAL_TARGET_STATUSES.has(rawBrief.visualTargetStatus) ? rawBrief.visualTargetStatus : 'unresolved',
    visualTargetReferences: uniqueStrings(Array.isArray(rawBrief.visualTargetReferences) ? rawBrief.visualTargetReferences : []).slice(0, 3).map((value) => compactDesignContextText(value, 500)),
    surfaceModel: AUTHORING_CONTENT_SURFACE_MODELS.has(rawBrief.surfaceModel) ? rawBrief.surfaceModel : '',
    density: AUTHORING_CONTENT_DENSITIES.has(rawBrief.density) ? rawBrief.density : '',
    borderPolicy: AUTHORING_BORDER_POLICIES.has(rawBrief.borderPolicy) ? rawBrief.borderPolicy : '',
    cardPolicy: AUTHORING_CARD_POLICIES.has(rawBrief.cardPolicy) ? rawBrief.cardPolicy : '',
    overlayPolicy: AUTHORING_OVERLAY_POLICIES.has(rawBrief.overlayPolicy) ? rawBrief.overlayPolicy : '',
    dividerPolicy: AUTHORING_DIVIDER_POLICIES.has(rawBrief.dividerPolicy) ? rawBrief.dividerPolicy : '',
    disclosureStrategy: compactDesignContextText(rawBrief.disclosureStrategy, DESIGN_CONTEXT_LIMITS.string),
    persistentRegions: uniqueStrings(Array.isArray(rawBrief.persistentRegions) ? rawBrief.persistentRegions : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    forbiddenPartitions: uniqueStrings(Array.isArray(rawBrief.forbiddenPartitions) ? rawBrief.forbiddenPartitions : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    constraints: uniqueStrings(Array.isArray(rawBrief.constraints) ? rawBrief.constraints : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    responsivePriorities: uniqueStrings(Array.isArray(rawBrief.responsivePriorities) ? rawBrief.responsivePriorities : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    accessibilityRequirements: uniqueStrings(Array.isArray(rawBrief.accessibilityRequirements) ? rawBrief.accessibilityRequirements : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 240)),
    referenceStatus: AUTHORING_REFERENCE_STATUSES.has(rawBrief.referenceStatus) ? rawBrief.referenceStatus : '',
    referenceArtifacts: uniqueStrings(Array.isArray(rawBrief.referenceArtifacts) ? rawBrief.referenceArtifacts : []).slice(0, DESIGN_CONTEXT_LIMITS.briefItems).map((value) => compactDesignContextText(value, 500)),
    referenceAnalysis: normalizeDesignReferenceAnalysis(rawBrief.referenceAnalysis),
  };
  const missingFields = [];
  if (!brief.productName) missingFields.push('productName');
  if (!brief.servicePurpose) missingFields.push('servicePurpose');
  if (!brief.audience) missingFields.push('audience');
  if (!brief.journeyMoment) missingFields.push('journeyMoment');
  if (!brief.surfaceRole) missingFields.push('surfaceRole');
  if (!brief.defaultState) missingFields.push('defaultState');
  if (!brief.healthyState) missingFields.push('healthyState');
  if (!brief.exceptionState) missingFields.push('exceptionState');
  if (brief.commonElements.length === 0) missingFields.push('commonElements');
  if (brief.pageElements.length === 0) missingFields.push('pageElements');
  if (brief.exceptionElements.length === 0) missingFields.push('exceptionElements');
  if (!brief.primaryOutcome) missingFields.push('primaryOutcome');
  if (!brief.primaryAction) missingFields.push('primaryAction');
  if (!brief.actionConsequence) missingFields.push('actionConsequence');
  if (!brief.nextStep) missingFields.push('nextStep');
  if (!brief.workflowModel) missingFields.push('workflowModel');
  if (brief.domainObjects.length === 0) missingFields.push('domainObjects');
  if (brief.keyDecisions.length === 0) missingFields.push('keyDecisions');
  if (brief.actionHierarchy.length === 0) missingFields.push('actionHierarchy');
  if (brief.operationalRules.length === 0) missingFields.push('operationalRules');
  if (brief.failureModes.length === 0) missingFields.push('failureModes');
  if (brief.sampleContent.length < 3) missingFields.push('sampleContent');
  if (brief.nonGoals.length === 0) missingFields.push('nonGoals');
  if (brief.successSignals.length === 0) missingFields.push('successSignals');
  if (brief.dataRequirements.length === 0) missingFields.push('dataRequirements');
  if (brief.contentPriorities.length === 0) missingFields.push('contentPriorities');
  if (!brief.creativeDirection) missingFields.push('creativeDirection');
  if (brief.visualTargetStatus === 'unresolved') missingFields.push('visualTargetStatus');
  if (brief.visualTargetReferences.length === 0) missingFields.push('visualTargetReferences');
  if (!brief.surfaceModel) missingFields.push('surfaceModel');
  if (!brief.density) missingFields.push('density');
  if (!brief.borderPolicy) missingFields.push('borderPolicy');
  if (!brief.cardPolicy) missingFields.push('cardPolicy');
  if (!brief.overlayPolicy) missingFields.push('overlayPolicy');
  if (!brief.dividerPolicy) missingFields.push('dividerPolicy');
  if (!brief.disclosureStrategy) missingFields.push('disclosureStrategy');
  if (brief.responsivePriorities.length === 0) missingFields.push('responsivePriorities');
  if (brief.accessibilityRequirements.length === 0) missingFields.push('accessibilityRequirements');
  if (!brief.referenceStatus) missingFields.push('referenceStatus');
  if (brief.referenceStatus === 'provided') {
    if (brief.referenceArtifacts.length === 0) missingFields.push('referenceArtifacts');
    if (brief.referenceAnalysis.implementationMode === 'unresolved') missingFields.push('referenceAnalysis.implementationMode');
    for (const field of ['sourcePrecedence', 'pageLandmarks', 'repeatedPatterns', 'hierarchyObservations', 'interactionPatterns', 'responsiveBehavior', 'deliberateDeviations']) {
      const value = brief.referenceAnalysis[field];
      if ((Array.isArray(value) && value.length === 0) || (!Array.isArray(value) && !value)) missingFields.push(`referenceAnalysis.${field}`);
    }
  }
  const materialFields = missingFields.filter((field) => !['creativeDirection', 'visualTargetStatus', 'visualTargetReferences'].includes(field));
  const visualDirectionReadiness = createVisualDirectionReadiness(brief);

  const questions = [];
  if (brief.referenceStatus === 'provided' && brief.referenceAnalysis.implementationMode === 'unresolved') {
    questions.push({
      id: 'reference-implementation-intent',
      fields: ['referenceAnalysis.implementationMode'],
      question: 'Should the supplied Figma or visual artifact be implemented as an exact conversion, or adapted into the existing project structure and design language?',
      reason: 'This decision changes which source owns layout, composition, responsive behavior, and deliberate deviations. It must be resolved before implementation begins.',
      suggestedDefault: 'Resolve the intent from explicit user wording, the project handoff, active source, and adjacent page patterns. If those sources do not agree, ask the user instead of guessing.',
    });
  }
  const productSurfaceFields = ['productName', 'servicePurpose', 'audience', 'journeyMoment', 'surfaceRole', 'successSignals']
    .filter((field) => missingFields.includes(field));
  if (productSurfaceFields.length > 0) {
    questions.push({
      id: 'product-surface-boundary',
      fields: productSurfaceFields,
      question: 'What product or service is this, who is the primary user, when do they arrive here, and is this the default workspace, an entity detail, a task flow, or an exception-only workspace?',
      reason: 'Product identity, user situation, and surface role decide what belongs to the global shell and what this page uniquely owns.',
      suggestedDefault: 'Do not assume these fields. Confirm them from the user, project source, notes, or a supplied artifact.',
    });
  }
  const stateOwnershipFields = [
    'defaultState', 'healthyState', 'exceptionState', 'commonElements', 'pageElements', 'exceptionElements',
    'primaryOutcome', 'primaryAction', 'actionConsequence', 'nextStep', 'workflowModel', 'domainObjects',
    'keyDecisions', 'actionHierarchy', 'operationalRules', 'failureModes', 'sampleContent', 'nonGoals',
    'dataRequirements', 'contentPriorities',
  ]
    .filter((field) => missingFields.includes(field));
  if (stateOwnershipFields.length > 0) {
    questions.push({
      id: 'states-ownership-decision-data',
      fields: stateOwnershipFields,
      question: 'What real workflow and domain objects does the page represent, what decisions and action hierarchy exist, what happens after action or non-response, which failure modes matter, and what realistic sample content proves the model?',
      reason: 'Workflow, state, operational rules, and realistic content must agree before information hierarchy or progressive disclosure can be designed credibly.',
      suggestedDefault: 'Do not invent approval dependencies, collapse states, or use placeholder content where an operational rule is required.',
    });
  }
  const visualCompositionFields = [
    'surfaceModel', 'density', 'borderPolicy', 'cardPolicy', 'overlayPolicy', 'dividerPolicy', 'disclosureStrategy',
    'responsivePriorities', 'accessibilityRequirements', 'referenceStatus', 'referenceArtifacts',
  ]
    .filter((field) => missingFields.includes(field));
  visualCompositionFields.push(...missingFields.filter((field) => field.startsWith('referenceAnalysis.')));
  if (visualCompositionFields.length > 0) {
    questions.push({
      id: 'visual-composition-and-disclosure',
      fields: visualCompositionFields,
      question: 'Deconstruct any supplied reference into landmarks, repeated patterns, hierarchy, interactions, and responsive behavior; then confirm surface topology, density, border/card/divider rules, disclosure ownership, and compact-screen priorities.',
      reason: 'A reference is structural evidence, not a mood sample. Its applicable patterns and deliberate deviations must be explicit before composition.',
      suggestedDefault: 'Do not infer a generic dashboard or copy reference content; record exactly what transfers and what must change for this product.',
    });
  }

  const assumptionPolicy = input?.assumptionPolicy === 'agent-may-assume' ? 'agent-may-assume' : 'ask';
  const status = materialFields.length > 0
    ? 'needs-clarification'
    : missingFields.length > 0 && assumptionPolicy === 'agent-may-assume'
      ? 'ready-with-assumptions'
      : 'ready';
  const requirementChecklist = createRequirementReadinessChecklist(brief, missingFields);
  return {
    status,
    assumptionPolicy,
    referenceIntent: brief.referenceStatus === 'provided'
      ? {
          status: brief.referenceAnalysis.implementationMode === 'unresolved' ? 'needs-clarification' : 'resolved',
          implementationMode: brief.referenceAnalysis.implementationMode,
          sourcePrecedence: brief.referenceAnalysis.sourcePrecedence,
          instruction: brief.referenceAnalysis.implementationMode === 'unresolved'
            ? 'Do not implement yet. Determine exact conversion versus adaptation from explicit evidence; ask the user when it remains ambiguous.'
            : brief.referenceAnalysis.implementationMode === 'exact-conversion'
              ? 'Preserve the supplied artifact observable structure and composition unless a named Workbench limitation requires a deliberate deviation.'
              : 'Preserve the existing project page/frame structure and use the supplied artifact for the explicitly transferred content and visual properties.',
        }
      : { status: 'not-applicable', implementationMode: 'not-applicable', sourcePrecedence: '', instruction: 'No supplied reference requires an implementation-mode decision.' },
    brief,
    missingFields,
    materialFields,
    requirementChecklist,
    visualDirectionReadiness,
    designCapabilityRouting: createDesignCapabilityRouting(visualDirectionReadiness),
    questions: status === 'needs-clarification' ? questions.slice(0, 3) : [],
    suggestedAssumptions: status === 'ready-with-assumptions'
      ? [{ id: 'creative-direction', fields: missingFields, value: 'Use the existing project language and make no new product or state assumptions.' }]
      : [],
    instruction: status === 'needs-clarification'
      ? brief.referenceStatus === 'provided' && brief.referenceAnalysis.implementationMode === 'unresolved'
        ? 'Do not implement yet. First determine whether the supplied Figma or visual artifact is an exact conversion target or must be adapted into the existing project structure. Resolve this from explicit user wording, project handoff, active source, and adjacent source patterns; if it remains ambiguous, ask the reference-implementation-intent question. agent-may-assume cannot bypass this decision.'
        : 'Treat these as candidate questions. Resolve fields from the request, active selection, source, notes, assets, or supplied artifacts first, then ask the remaining high-impact questions in one round. agent-may-assume cannot bypass missing product, surface, state, ownership, decision, or data facts. After answers are grounded, continue to page planning; a full-profile requirements record is optional when that helper is available.'
      : status === 'ready-with-assumptions'
        ? 'Product requirements are ready, but art direction still needs confirmation. Inspect current product evidence, propose one recommended direction with explicit reasoning, and ask only the remaining high-impact questions before planning. Do not auto-generate alternatives.'
        : 'The high-impact brief fields are present. Continue to ideation or page planning; a full-profile requirements record is optional when the task benefits from it.',
  };
}

function createVisualDirectionReadiness(brief) {
  const grounded = brief.visualTargetStatus !== 'unresolved' && brief.visualTargetReferences.length > 0;
  return {
    status: grounded ? 'grounded' : 'clarification-required',
    targetStatus: grounded ? brief.visualTargetStatus : 'unresolved',
    references: grounded ? brief.visualTargetReferences : [],
    creativeDirection: brief.creativeDirection,
    rationale: grounded
      ? 'A user, project, or artifact-backed visible target is available. Focused product ideation may proceed if the experience hypothesis is also settled.'
      : 'Art direction is not grounded yet. Inspect the current product, project design system, and supplied artifacts; infer one recommended direction with explicit reasoning; then ask only the remaining high-impact questions before page planning.',
  };
}

function createDesignCapabilityRouting(visualDirectionReadiness) {
  return {
    required: false,
    boundary: 'Workbench MCP supplies context, validates evidence, and performs protected writes; it cannot invoke host plugins or choose aesthetics.',
    hosts: [
      {
        host: 'codex',
        provider: 'codex-product-design',
        preferredSkills: ['product-design:index'],
        instruction: 'Inspect current product evidence, infer one recommended visual direction with explicit reasoning, and ask one to three grouped high-impact questions only where the answer would materially change the result. Use visual ideation only when the user explicitly requests alternatives.',
      },
      {
        host: 'claude',
        provider: 'claude-frontend-design',
        preferredSkills: ['frontend-design'],
        instruction: 'Inspect current product evidence, infer one recommended visual direction with explicit reasoning, and ask one to three grouped high-impact questions only where the answer would materially change the result. Generate alternatives only when the user explicitly requests them.',
      },
      {
        host: 'other',
        provider: 'host-design-plugin',
        preferredSkills: ['host visual-design or ideation plugin'],
        instruction: 'Inspect current product evidence, infer one recommended visual direction with explicit reasoning, and ask one to three grouped high-impact questions only where the answer would materially change the result. Generate alternatives only when the user explicitly requests them.',
      },
    ],
    fallbackPolicy: visualDirectionReadiness.status === 'clarification-required'
      ? 'The host model may infer and recommend one direction from inspected evidence, but planning requires explicit user confirmation recorded as selection evidence. Do not auto-generate images or multiple options.'
      : 'Model judgment may translate the grounded visual target while preserving its evidence and constraints.',
  };
}

function createRequirementReadinessChecklist(brief, missingFields) {
  const groups = [
    { id: 'product', label: 'Product or service identity, purpose, and success signals', fields: ['productName', 'servicePurpose', 'successSignals'], highImpact: true },
    { id: 'audience', label: 'Primary user and journey situation', fields: ['audience', 'journeyMoment', 'workflowModel'], highImpact: true },
    { id: 'surface', label: 'Surface role and entry point', fields: ['surfaceRole'], highImpact: true },
    { id: 'states', label: 'Default, healthy, and exception states', fields: ['defaultState', 'healthyState', 'exceptionState'], highImpact: true },
    { id: 'ownership', label: 'Global common, page-owned, and exception-only elements', fields: ['commonElements', 'pageElements', 'exceptionElements'], highImpact: true },
    { id: 'domain', label: 'Domain objects, real data, and sample content', fields: ['domainObjects', 'dataRequirements', 'sampleContent'], highImpact: true },
    { id: 'outcome', label: 'Primary outcome, action, consequence, and next step', fields: ['primaryOutcome', 'primaryAction', 'actionConsequence', 'nextStep'], highImpact: true },
    { id: 'decision-rules', label: 'Key decisions, action hierarchy, operational rules, and failure modes', fields: ['keyDecisions', 'actionHierarchy', 'operationalRules', 'failureModes'], highImpact: true },
    { id: 'data', label: 'Required information, source, freshness, and fallback', fields: ['dataRequirements'], highImpact: true },
    { id: 'content', label: 'Information priority, hierarchy, and explicit non-goals', fields: ['contentPriorities', 'nonGoals'], highImpact: true },
    { id: 'reference', label: 'Reference precedence, structure, hierarchy, interaction, responsive behavior, and deliberate deviations', fields: ['referenceStatus', 'referenceArtifacts', 'referenceAnalysis.sourcePrecedence', 'referenceAnalysis.pageLandmarks', 'referenceAnalysis.repeatedPatterns', 'referenceAnalysis.hierarchyObservations', 'referenceAnalysis.interactionPatterns', 'referenceAnalysis.responsiveBehavior', 'referenceAnalysis.deliberateDeviations'], highImpact: true, conditional: brief.referenceStatus === 'provided' },
    { id: 'visual-composition', label: 'Surface topology, density, borders, cards, overlays, dividers, and disclosure ownership', fields: ['surfaceModel', 'density', 'borderPolicy', 'cardPolicy', 'overlayPolicy', 'dividerPolicy', 'disclosureStrategy'], highImpact: true },
    { id: 'responsive-accessibility', label: 'Compact priorities and accessibility requirements', fields: ['responsivePriorities', 'accessibilityRequirements'], highImpact: true },
    { id: 'visual', label: 'Brand art direction and selected visible target', fields: ['creativeDirection', 'visualTargetStatus', 'visualTargetReferences'], highImpact: false },
    { id: 'constraints', label: 'Responsive, accessibility, technical, and operational constraints', fields: ['constraints'], highImpact: false },
  ];
  return groups.filter((group) => group.conditional !== false).map((group) => ({
    id: group.id,
    label: group.label,
    fields: group.fields,
    highImpact: group.highImpact,
    status: group.fields.some((field) => missingFields.includes(field)) ? 'missing' : 'confirmed',
    values: Object.fromEntries(group.fields.map((field) => {
      const [root, child] = field.split('.');
      return [field, child ? brief[root]?.[child] : brief[field]];
    })),
  }));
}

function createDesignIntelligenceReport(context) {
  const brief = context.briefReadiness?.brief ?? {};
  const missing = new Set(context.briefReadiness?.missingFields ?? []);
  const stage = (order, id, goal, fields, informationNeeded, sourcePriority, options = {}) => {
    const missingFields = fields.filter((field) => missing.has(field) || [...missing].some((value) => value.startsWith(`${field}.`)));
    return {
      order,
      id,
      goal,
      status: options.status ?? (missingFields.length > 0 ? 'missing' : 'collected'),
      blocking: options.blocking === true,
      fields,
      missingFields,
      informationNeeded,
      sourcePriority,
      collected: options.collected ?? Object.fromEntries(fields.map((field) => [field, brief[field]])),
      nextCollectionAction: missingFields.length > 0 ? options.nextCollectionAction : 'Use this evidence when it helps the implementation.',
    };
  };
  const referenceFields = brief.referenceStatus === 'provided'
    ? ['referenceStatus', 'referenceArtifacts', 'referenceAnalysis']
    : ['referenceStatus'];
  const stages = [
    stage(1, 'evidence-inventory', 'Inventory user statements, supplied artifacts, active source, project notes, components, tokens, and assets before interpreting the design.', ['referenceStatus'], ['Evidence sources and precedence'], ['user', 'artifact', 'active-source', 'project-notes'], {
      collected: {
        referenceStatus: brief.referenceStatus,
        referenceArtifacts: brief.referenceArtifacts,
        activeSource: context.activeSource?.sourceFile ?? null,
        noteCount: context.notes?.items?.length ?? 0,
        componentRoleCount: context.components?.roles?.length ?? 0,
        tokenCollectionCount: context.tokens?.collections?.length ?? 0,
        assetCount: context.assets?.total ?? 0,
      },
      nextCollectionAction: 'Identify whether a reference exists and inspect the active source and project evidence before asking the user.',
    }),
    stage(2, 'product-and-user', 'Define the product, primary user, situation, and measurable success before choosing a page pattern.', ['productName', 'servicePurpose', 'audience', 'journeyMoment', 'successSignals'], ['Product purpose', 'primary user', 'entry situation', 'success signals'], ['user', 'project-notes', 'active-source']),
    stage(3, 'workflow-and-domain', 'Model the real workflow and domain objects so the page structure follows the work instead of a generic dashboard.', ['workflowModel', 'domainObjects', 'dataRequirements', 'sampleContent'], ['Workflow sequence', 'domain objects', 'data sources', 'realistic example content'], ['user', 'artifact', 'project-source']),
    stage(4, 'decisions-and-rules', 'Define decisions, action hierarchy, consequences, non-response behavior, and failure modes.', ['primaryOutcome', 'primaryAction', 'actionConsequence', 'nextStep', 'keyDecisions', 'actionHierarchy', 'operationalRules', 'failureModes'], ['Primary and secondary actions', 'action consequence', 'fallback/non-response rule', 'failure modes'], ['user', 'service-policy', 'project-notes']),
    stage(5, 'states-and-recovery', 'Separate normal, healthy, warning, incident, loading, empty, and error behavior before composing one state.', ['defaultState', 'healthyState', 'exceptionState', 'failureModes'], ['State triggers', 'visible changes', 'recovery'], ['user', 'service-policy', 'project-source']),
    stage(6, 'reference-deconstruction', 'First decide whether each supplied reference is an exact conversion target or evidence to adapt into the project, then deconstruct only the properties that transfer.', referenceFields, ['Implementation mode', 'source precedence', 'page landmarks', 'repeated units', 'hierarchy', 'interactions', 'responsive behavior', 'deliberate deviations'], ['user', 'project-handoff', 'active-source', 'adjacent-source', 'artifact'], {
      blocking: false,
      collected: { referenceStatus: brief.referenceStatus, referenceArtifacts: brief.referenceArtifacts, referenceAnalysis: brief.referenceAnalysis },
      nextCollectionAction: 'Resolve exact conversion versus adaptation from explicit evidence. If ambiguous, ask the user before planning; otherwise inspect the supplied artifact and record what transfers and what stays project-owned.',
    }),
    stage(7, 'information-architecture', 'Define ownership, information priority, and non-goals so visible density follows user intent.', ['surfaceRole', 'commonElements', 'pageElements', 'exceptionElements', 'contentPriorities', 'nonGoals'], ['Surface boundary', 'region ownership', 'attention order', 'explicit exclusions'], ['user', 'artifact', 'active-source']),
    stage(8, 'composition-and-hierarchy', 'Set the surface, density, border/card/divider/overlay policies, disclosure owners, and size hierarchy.', ['surfaceModel', 'density', 'borderPolicy', 'cardPolicy', 'overlayPolicy', 'dividerPolicy', 'disclosureStrategy', 'actionHierarchy'], ['Surface topology', 'container policy', 'disclosure ownership', 'type and action hierarchy'], ['user', 'artifact', 'tokens']),
    stage(9, 'responsive-and-accessibility', 'Decide compact ordering and accessibility behavior before implementation.', ['responsivePriorities', 'accessibilityRequirements'], ['Wide/compact reading order', 'keyboard', 'screen reader', 'focus'], ['user', 'artifact', 'project-conventions']),
    stage(10, 'authoring-feasibility', 'Check active source, registered components, tokens, and assets before composing.', [], ['Editable source boundary', 'semantic component coverage', 'token and asset availability'], ['active-source', 'component-catalog', 'tokens', 'assets'], {
      collected: {
        activeSourceStatus: context.activeSource?.status ?? 'unavailable',
        componentRoles: context.components?.roles?.map((entry) => entry.role) ?? [],
        tokenCollections: context.tokens?.collections?.map((entry) => entry.id) ?? [],
        assetKinds: context.assets?.kinds ?? [],
      },
      blocking: false,
    }),
    stage(11, 'optional-design-brief', 'Create or review a detailed design brief only when it will materially improve the result.', [], ['Structure', 'content', 'interaction rules', 'responsive order'], ['user', 'project', 'artifact'], { blocking: false, status: 'optional' }),
    stage(12, 'practical-render-review', 'Render the implemented source and verify Workbench editability plus request-relevant visual behavior.', [], ['Design canvas', 'representative selection', 'obvious visual defects'], ['rendered-page', 'workbench-canvas'], { blocking: false, status: 'pending-after-apply' }),
  ];
  const collectionQueue = stages
    .filter((item) => item.status === 'missing' && item.blocking)
    .map((item) => ({ stageId: item.id, missingFields: item.missingFields, nextCollectionAction: item.nextCollectionAction }));
  return {
    status: collectionQueue.length > 0 ? 'needs-collection' : 'ready-for-authoring',
    stages,
    collectionQueue,
    promptPolicy: {
      imageGeneration: 'optional-and-user-authorized-only',
      sourceComposition: 'preferred',
      approvalRequiredBeforePlanning: false,
      instruction: 'Use a generated prompt or explicit approval only when the user requests a design checkpoint or a genuinely consequential decision remains unresolved.',
    },
  };
}

function createAuthoringProcedureChecklist() {
  return [
    { order: 1, id: 'project-binding', requirement: 'Bind the authoring session to the exact Workbench project requested by the user.' },
    { order: 2, id: 'product-thinking', requirement: 'Ground the page in product mechanics first: name the core loop, decide which few elements deserve the surface, and move secondary actions into popovers, sheets, dropdowns, or drawers instead of stacking them on screen.' },
    { order: 3, id: 'source-composition', requirement: 'Implement the design in project source using native HTML, primitives, ordinary React patterns, or registered components as appropriate.' },
    { order: 4, id: 'design-identity', requirement: 'Default to borderless composition: separate regions with surface tone, shadow, and spacing rather than border or divider lines. Establish one deliberate identity (a signature color, a typographic anchor, or an oversized motif) and include at least one visual-relief element so the page does not read flat.' },
    { order: 5, id: 'workbench-editability', requirement: 'Confirm the page renders in Workbench and that representative structure is selectable or exposed through honest Inspector, Binding, or source boundaries.' },
    { order: 6, id: 'practical-review', requirement: 'Fix obvious overflow, clipping, unreadable contrast, broken interactions, and request-specific responsive or fidelity issues. Treat every verify_page violation and warning as work: resolve it or report it to the user with a reason — never silently accept it. Extra visual evidence and approval are optional.' },
  ];
}

function normalizeRequirementsInput(input) {
  if (!isRecord(input)) {
    throw createAuthoringError('WB-AUTH-REQUIREMENTS-INVALID', 'Requirements confirmation must be an object.');
  }
  const unresolvedQuestions = uniqueStrings(Array.isArray(input.unresolvedQuestions) ? input.unresolvedQuestions : []);
  if (unresolvedQuestions.length > 0) {
    throw createAuthoringError('WB-AUTH-REQUIREMENTS-UNRESOLVED', 'High-impact requirements cannot be confirmed while unresolvedQuestions is non-empty. Ask the user or inspect project evidence first.');
  }

  const productInput = isRecord(input.product) ? input.product : {};
  const surfaceInput = isRecord(input.surface) ? input.surface : {};
  const ownershipInput = isRecord(input.ownership) ? input.ownership : {};
  const product = {
    name: getRequiredString(productInput, 'name'),
    purpose: getRequiredString(productInput, 'purpose'),
    primaryUser: getRequiredString(productInput, 'primaryUser'),
  };
  const role = getRequiredString(surfaceInput, 'role');
  if (!AUTHORING_SURFACE_ROLES.has(role)) {
    throw createAuthoringError('WB-AUTH-SURFACE-ROLE', `surface.role must be one of: ${[...AUTHORING_SURFACE_ROLES].join(', ')}.`);
  }
  const surface = {
    role,
    entryContext: getRequiredString(surfaceInput, 'entryContext'),
    primaryOutcome: getRequiredString(surfaceInput, 'primaryOutcome'),
    primaryAction: getRequiredString(surfaceInput, 'primaryAction'),
    actionConsequence: getRequiredString(surfaceInput, 'actionConsequence'),
    nextStep: getRequiredString(surfaceInput, 'nextStep'),
  };
  const ownership = {
    common: normalizeRequirementStringList(ownershipInput.common, 'ownership.common', { min: 1 }),
    page: normalizeRequirementStringList(ownershipInput.page, 'ownership.page', { min: 1 }),
    exception: normalizeRequirementStringList(ownershipInput.exception, 'ownership.exception', { min: 0 }),
  };
  const ownershipDuplicates = findDuplicateStringsAcrossGroups(ownership);
  if (ownershipDuplicates.length > 0) {
    throw createAuthoringError('WB-AUTH-OWNERSHIP-OVERLAP', `Elements may not belong to more than one ownership group: ${ownershipDuplicates.join(', ')}.`);
  }

  if (!isRecord(input.states)) {
    throw createAuthoringError('WB-AUTH-STATES-MISSING', 'Requirements must explicitly classify every screen state.');
  }
  const states = Object.fromEntries([...AUTHORING_SCREEN_STATES].map((state) => [state, normalizeRequirementState(input.states[state], state)]));
  if (states.default.applicability !== 'required') {
    throw createAuthoringError('WB-AUTH-DEFAULT-STATE', 'The default state must be required and described.');
  }
  const hasRequiredExceptionState = states.warning.applicability === 'required' || states.incident.applicability === 'required';
  if (hasRequiredExceptionState && ownership.exception.length === 0) {
    throw createAuthoringError('WB-AUTH-EXCEPTION-OWNERSHIP', 'Required warning or incident states need at least one exception-only element.');
  }
  if (!hasRequiredExceptionState && ownership.exception.length > 0) {
    throw createAuthoringError('WB-AUTH-EXCEPTION-STATE', 'Exception-only elements require warning or incident to be marked required.');
  }

  const sectionsInput = Array.isArray(input.sections) ? input.sections : [];
  if (sectionsInput.length < 1 || sectionsInput.length > 12) {
    throw createAuthoringError('WB-AUTH-SECTIONS', 'Requirements need between one and twelve intentional sections.');
  }
  const sections = sectionsInput.map((section, index) => normalizeRequirementSection(section, index));
  if (new Set(sections.map((section) => section.id)).size !== sections.length) {
    throw createAuthoringError('WB-AUTH-SECTION-DUPLICATE', 'Section ids must be unique.');
  }
  for (const section of sections) {
    for (const state of section.visibleStates) {
      if (states[state].applicability !== 'required') {
        throw createAuthoringError('WB-AUTH-SECTION-STATE', `Section ${section.id} cannot be visible in ${state}, because that state is marked not-applicable.`);
      }
    }
  }
  if (hasRequiredExceptionState && !sections.some((section) => section.ownership === 'exception' && section.visibleStates.some((state) => state === 'warning' || state === 'incident'))) {
    throw createAuthoringError('WB-AUTH-EXCEPTION-SECTION', 'A required warning or incident state needs an exception-owned section visible in that state.');
  }

  const dataInput = Array.isArray(input.dataRequirements) ? input.dataRequirements : [];
  if (dataInput.length < 1 || dataInput.length > 20) {
    throw createAuthoringError('WB-AUTH-DATA-REQUIREMENTS', 'Requirements need between one and twenty data requirements.');
  }
  const dataRequirements = dataInput.map((item, index) => normalizeDataRequirement(item, index, states));
  if (new Set(dataRequirements.map((item) => item.id)).size !== dataRequirements.length) {
    throw createAuthoringError('WB-AUTH-DATA-DUPLICATE', 'Data requirement ids must be unique.');
  }

  const designIntelligence = normalizeDesignIntelligence(input.designIntelligence);
  const visualComposition = normalizeVisualComposition(input.visualComposition);

  const responsiveInput = isRecord(input.responsiveAccessibility) ? input.responsiveAccessibility : {};
  const responsiveAccessibility = {
    wide: getRequiredString(responsiveInput, 'wide'),
    compact: getRequiredString(responsiveInput, 'compact'),
    keyboard: getRequiredString(responsiveInput, 'keyboard'),
    screenReader: getRequiredString(responsiveInput, 'screenReader'),
  };

  const evidenceInput = Array.isArray(input.fieldEvidence) ? input.fieldEvidence : [];
  const fieldEvidence = evidenceInput.map((item, index) => {
    if (!isRecord(item)) throw createAuthoringError('WB-AUTH-EVIDENCE', `Field evidence ${index + 1} must be an object.`);
    const field = getRequiredString(item, 'field');
    const source = getRequiredString(item, 'source');
    if (!AUTHORING_REQUIREMENT_EVIDENCE_SOURCES.has(source)) {
      throw createAuthoringError('WB-AUTH-EVIDENCE-SOURCE', `Evidence source for ${field} must be user, project, or artifact. Agent assumptions cannot confirm high-impact facts.`);
    }
    return { field, source, reference: getRequiredString(item, 'reference') };
  });
  const evidenceFields = new Set(fieldEvidence.map((item) => item.field));
  const missingEvidence = AUTHORING_REQUIRED_EVIDENCE_FIELDS.filter((field) => !evidenceFields.has(field));
  if (missingEvidence.length > 0) {
    throw createAuthoringError('WB-AUTH-EVIDENCE-MISSING', `Requirements are missing grounded evidence for: ${missingEvidence.join(', ')}.`);
  }

  return {
    product,
    surface,
    ownership,
    states,
    sections,
    dataRequirements,
    designIntelligence,
    visualComposition,
    responsiveAccessibility,
    fieldEvidence,
    unresolvedQuestions,
  };
}

function normalizeDesignIntelligence(value) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-DESIGN-INTELLIGENCE-MISSING', 'Requirements must include the collected workflow, decision rules, realistic content, and reference analysis.');
  }
  const workflowInput = isRecord(value.workflow) ? value.workflow : {};
  const decisionsInput = isRecord(value.decisions) ? value.decisions : {};
  const contentInput = isRecord(value.content) ? value.content : {};
  const referenceInput = isRecord(value.reference) ? value.reference : {};
  const workflow = {
    model: getRequiredString(workflowInput, 'model'),
    domainObjects: normalizeRequirementStringList(workflowInput.domainObjects, 'designIntelligence.workflow.domainObjects', { min: 1 }),
    failureModes: normalizeRequirementStringList(workflowInput.failureModes, 'designIntelligence.workflow.failureModes', { min: 1 }),
  };
  const decisions = {
    keyDecisions: normalizeRequirementStringList(decisionsInput.keyDecisions, 'designIntelligence.decisions.keyDecisions', { min: 1 }),
    actionHierarchy: normalizeRequirementStringList(decisionsInput.actionHierarchy, 'designIntelligence.decisions.actionHierarchy', { min: 1 }),
    operationalRules: normalizeRequirementStringList(decisionsInput.operationalRules, 'designIntelligence.decisions.operationalRules', { min: 1 }),
  };
  const content = {
    sampleContent: normalizeRequirementStringList(contentInput.sampleContent, 'designIntelligence.content.sampleContent', { min: 3 }),
    nonGoals: normalizeRequirementStringList(contentInput.nonGoals, 'designIntelligence.content.nonGoals', { min: 1 }),
    successSignals: normalizeRequirementStringList(contentInput.successSignals, 'designIntelligence.content.successSignals', { min: 1 }),
  };
  const status = getRequiredString(referenceInput, 'status');
  if (!AUTHORING_REFERENCE_STATUSES.has(status)) {
    throw createAuthoringError('WB-AUTH-REFERENCE-STATUS', 'designIntelligence.reference.status must be none or provided.');
  }
  const implementationMode = getRequiredString(referenceInput, 'implementationMode');
  if (status === 'provided' && !AUTHORING_REFERENCE_IMPLEMENTATION_MODES.has(implementationMode)) {
    throw createAuthoringError('WB-AUTH-REFERENCE-IMPLEMENTATION-MODE', 'A provided reference must use exact-conversion or adapt-to-project. Resolve the user intent before confirming requirements.');
  }
  if (status === 'none' && implementationMode !== 'not-applicable') {
    throw createAuthoringError('WB-AUTH-REFERENCE-IMPLEMENTATION-MODE', 'A missing reference must use implementationMode not-applicable.');
  }
  const reference = {
    status,
    implementationMode,
    artifacts: normalizeRequirementStringList(referenceInput.artifacts, 'designIntelligence.reference.artifacts', { min: status === 'provided' ? 1 : 0 }),
    sourcePrecedence: getRequiredString(referenceInput, 'sourcePrecedence'),
    pageLandmarks: normalizeRequirementStringList(referenceInput.pageLandmarks, 'designIntelligence.reference.pageLandmarks', { min: status === 'provided' ? 1 : 0 }),
    repeatedPatterns: normalizeRequirementStringList(referenceInput.repeatedPatterns, 'designIntelligence.reference.repeatedPatterns', { min: status === 'provided' ? 1 : 0 }),
    hierarchyObservations: normalizeRequirementStringList(referenceInput.hierarchyObservations, 'designIntelligence.reference.hierarchyObservations', { min: status === 'provided' ? 1 : 0 }),
    interactionPatterns: normalizeRequirementStringList(referenceInput.interactionPatterns, 'designIntelligence.reference.interactionPatterns', { min: status === 'provided' ? 1 : 0 }),
    responsiveBehavior: normalizeRequirementStringList(referenceInput.responsiveBehavior, 'designIntelligence.reference.responsiveBehavior', { min: status === 'provided' ? 1 : 0 }),
    deliberateDeviations: normalizeRequirementStringList(referenceInput.deliberateDeviations, 'designIntelligence.reference.deliberateDeviations', { min: status === 'provided' ? 1 : 0 }),
  };
  if (status === 'none' && reference.artifacts.length > 0) {
    throw createAuthoringError('WB-AUTH-REFERENCE-CONFLICT', 'Reference artifacts require designIntelligence.reference.status to be provided.');
  }
  return { workflow, decisions, content, reference };
}

function normalizeVisualComposition(value) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-VISUAL-COMPOSITION-MISSING', 'Requirements must confirm surface topology, density, border/card/divider policy, overlays, and disclosure ownership.');
  }
  const surfaceModel = getRequiredString(value, 'surfaceModel');
  const density = getRequiredString(value, 'density');
  const borderPolicy = getRequiredString(value, 'borderPolicy');
  const cardPolicy = getRequiredString(value, 'cardPolicy');
  const overlayPolicy = getRequiredString(value, 'overlayPolicy');
  const dividerPolicy = getRequiredString(value, 'dividerPolicy');
  if (!AUTHORING_CONTENT_SURFACE_MODELS.has(surfaceModel)) throw createAuthoringError('WB-AUTH-SURFACE-MODEL', `visualComposition.surfaceModel must be one of: ${[...AUTHORING_CONTENT_SURFACE_MODELS].join(', ')}.`);
  if (!AUTHORING_CONTENT_DENSITIES.has(density)) throw createAuthoringError('WB-AUTH-DENSITY', `visualComposition.density must be one of: ${[...AUTHORING_CONTENT_DENSITIES].join(', ')}.`);
  if (!AUTHORING_BORDER_POLICIES.has(borderPolicy)) throw createAuthoringError('WB-AUTH-BORDER-POLICY', `visualComposition.borderPolicy must be one of: ${[...AUTHORING_BORDER_POLICIES].join(', ')}.`);
  if (!AUTHORING_CARD_POLICIES.has(cardPolicy)) throw createAuthoringError('WB-AUTH-CARD-POLICY', `visualComposition.cardPolicy must be one of: ${[...AUTHORING_CARD_POLICIES].join(', ')}.`);
  if (!AUTHORING_OVERLAY_POLICIES.has(overlayPolicy)) throw createAuthoringError('WB-AUTH-OVERLAY-POLICY', `visualComposition.overlayPolicy must be one of: ${[...AUTHORING_OVERLAY_POLICIES].join(', ')}.`);
  if (!AUTHORING_DIVIDER_POLICIES.has(dividerPolicy)) throw createAuthoringError('WB-AUTH-DIVIDER-POLICY', `visualComposition.dividerPolicy must be one of: ${[...AUTHORING_DIVIDER_POLICIES].join(', ')}.`);

  const limitsInput = isRecord(value.limits) ? value.limits : {};
  const readLimit = (field, min, max) => {
    const number = Number(limitsInput[field]);
    if (!Number.isInteger(number) || number < min || number > max) {
      throw createAuthoringError('WB-AUTH-VISUAL-LIMIT', `visualComposition.limits.${field} must be an integer between ${min} and ${max}.`);
    }
    return number;
  };
  const limits = {
    contentSurfaceCount: readLimit('contentSurfaceCount', 1, 8),
    persistentRegionCount: readLimit('persistentRegionCount', 0, 8),
    outlinedContainerCount: readLimit('outlinedContainerCount', 0, 40),
    cardCount: readLimit('cardCount', 0, 40),
    fullHeightPartitionCount: readLimit('fullHeightPartitionCount', 0, 8),
  };
  if (surfaceModel === 'single-surface' && limits.contentSurfaceCount !== 1) {
    throw createAuthoringError('WB-AUTH-SINGLE-SURFACE-LIMIT', 'single-surface composition requires limits.contentSurfaceCount to equal 1.');
  }
  if (borderPolicy === 'borderless' && limits.outlinedContainerCount !== 0) {
    throw createAuthoringError('WB-AUTH-BORDERLESS-LIMIT', 'borderless composition requires limits.outlinedContainerCount to equal 0.');
  }
  if (cardPolicy === 'avoid' && limits.cardCount !== 0) {
    throw createAuthoringError('WB-AUTH-CARD-LIMIT', 'cardPolicy avoid requires limits.cardCount to equal 0.');
  }

  const persistentRegions = normalizeRequirementStringList(value.persistentRegions, 'visualComposition.persistentRegions', { min: 0, max: 12 });
  const forbiddenPartitions = normalizeRequirementStringList(value.forbiddenPartitions, 'visualComposition.forbiddenPartitions', { min: 0, max: 12 });
  if (persistentRegions.length > limits.persistentRegionCount) {
    throw createAuthoringError('WB-AUTH-PERSISTENT-REGION-LIMIT', 'Named persistent regions exceed visualComposition.limits.persistentRegionCount.');
  }

  const disclosureInput = Array.isArray(value.disclosures) ? value.disclosures : [];
  if (disclosureInput.length < 1 || disclosureInput.length > 20) {
    throw createAuthoringError('WB-AUTH-DISCLOSURES', 'visualComposition.disclosures requires between one and twenty contextual information owners.');
  }
  const disclosures = disclosureInput.map((item, index) => {
    if (!isRecord(item)) throw createAuthoringError('WB-AUTH-DISCLOSURE', `Disclosure ${index + 1} must be an object.`);
    const owner = getRequiredString(item, 'owner');
    if (!AUTHORING_DISCLOSURE_OWNERS.has(owner)) throw createAuthoringError('WB-AUTH-DISCLOSURE-OWNER', `Disclosure owner must be one of: ${[...AUTHORING_DISCLOSURE_OWNERS].join(', ')}.`);
    return {
      content: getRequiredString(item, 'content'),
      owner,
      trigger: getRequiredString(item, 'trigger'),
      rationale: getRequiredString(item, 'rationale'),
    };
  });
  if (new Set(disclosures.map((item) => item.content)).size !== disclosures.length) {
    throw createAuthoringError('WB-AUTH-DISCLOSURE-DUPLICATE', 'Each secondary information group must have one disclosure owner.');
  }
  if (overlayPolicy === 'none' && disclosures.some((item) => ['dialog', 'drawer'].includes(item.owner))) {
    throw createAuthoringError('WB-AUTH-DISCLOSURE-OVERLAY', 'overlayPolicy none cannot assign disclosure content to a dialog or drawer.');
  }

  const constraintInput = Array.isArray(value.constraints) ? value.constraints : [];
  if (constraintInput.length < 1 || constraintInput.length > 20) {
    throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINTS', 'visualComposition.constraints requires between one and twenty verifiable visual rules.');
  }
  const constraints = constraintInput.map((item, index) => {
    if (!isRecord(item)) throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT', `Visual constraint ${index + 1} must be an object.`);
    return {
      id: getRequiredString(item, 'id'),
      requirement: getRequiredString(item, 'requirement'),
      verification: getRequiredString(item, 'verification'),
    };
  });
  if (new Set(constraints.map((item) => item.id)).size !== constraints.length) {
    throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT-DUPLICATE', 'visualComposition constraint ids must be unique.');
  }

  return {
    surfaceModel,
    density,
    borderPolicy,
    cardPolicy,
    overlayPolicy,
    dividerPolicy,
    limits,
    persistentRegions,
    forbiddenPartitions,
    disclosures,
    constraints,
  };
}

function normalizeRequirementStringList(value, label, { min = 1, max = 20 } = {}) {
  const items = uniqueStrings(Array.isArray(value) ? value : []);
  if (items.length < min || items.length > max) {
    throw createAuthoringError('WB-AUTH-REQUIREMENT-LIST', `${label} requires between ${min} and ${max} items.`);
  }
  return items;
}

function normalizeRequirementState(value, state) {
  if (!isRecord(value)) throw createAuthoringError('WB-AUTH-STATE', `states.${state} must be an object.`);
  const applicability = getRequiredString(value, 'applicability');
  if (!AUTHORING_STATE_APPLICABILITY.has(applicability)) {
    throw createAuthoringError('WB-AUTH-STATE-APPLICABILITY', `states.${state}.applicability must be required or not-applicable.`);
  }
  const rationale = getRequiredString(value, 'rationale');
  if (applicability === 'not-applicable') {
    return { applicability, rationale, description: '', trigger: '', visibleChanges: [], recovery: '' };
  }
  return {
    applicability,
    rationale,
    description: getRequiredString(value, 'description'),
    trigger: state === 'default' ? optionalString(value.trigger) ?? 'Surface entry' : getRequiredString(value, 'trigger'),
    visibleChanges: normalizeRequirementStringList(value.visibleChanges, `states.${state}.visibleChanges`, { min: 1, max: 12 }),
    recovery: state === 'default' ? optionalString(value.recovery) ?? 'Remain in the default state' : getRequiredString(value, 'recovery'),
  };
}

function normalizeRequirementSection(value, index) {
  if (!isRecord(value)) throw createAuthoringError('WB-AUTH-SECTION', `Section ${index + 1} must be an object.`);
  const ownership = getRequiredString(value, 'ownership');
  if (!AUTHORING_SECTION_OWNERSHIP.has(ownership)) {
    throw createAuthoringError('WB-AUTH-SECTION-OWNERSHIP', `Section ${index + 1} ownership must be common, page, or exception.`);
  }
  const emphasis = getRequiredString(value, 'emphasis');
  if (!AUTHORING_SECTION_EMPHASIS.has(emphasis)) {
    throw createAuthoringError('WB-AUTH-SECTION-EMPHASIS', `Section ${index + 1} emphasis must be high, medium, or low.`);
  }
  const visibleStates = normalizeRequirementStringList(value.visibleStates, `sections[${index}].visibleStates`, { min: 1, max: AUTHORING_SCREEN_STATES.size });
  if (visibleStates.some((state) => !AUTHORING_SCREEN_STATES.has(state))) {
    throw createAuthoringError('WB-AUTH-SECTION-STATE', `Section ${index + 1} contains an unknown visible state.`);
  }
  return {
    id: getRequiredString(value, 'id'),
    name: getRequiredString(value, 'name'),
    intent: getRequiredString(value, 'intent'),
    ownership,
    visibleStates,
    requiredInformation: normalizeRequirementStringList(value.requiredInformation, `sections[${index}].requiredInformation`, { min: 1, max: 20 }),
    decisionSupported: getRequiredString(value, 'decisionSupported'),
    primaryAction: getRequiredString(value, 'primaryAction'),
    nextStep: getRequiredString(value, 'nextStep'),
    emphasis,
  };
}

function normalizeDataRequirement(value, index, states) {
  if (!isRecord(value)) throw createAuthoringError('WB-AUTH-DATA', `Data requirement ${index + 1} must be an object.`);
  const requiredStates = normalizeRequirementStringList(value.requiredStates, `dataRequirements[${index}].requiredStates`, { min: 1, max: AUTHORING_SCREEN_STATES.size });
  for (const state of requiredStates) {
    if (!AUTHORING_SCREEN_STATES.has(state) || states[state].applicability !== 'required') {
      throw createAuthoringError('WB-AUTH-DATA-STATE', `Data requirement ${index + 1} references an unknown or not-applicable state: ${state}.`);
    }
  }
  return {
    id: getRequiredString(value, 'id'),
    name: getRequiredString(value, 'name'),
    source: getRequiredString(value, 'source'),
    freshness: getRequiredString(value, 'freshness'),
    requiredStates,
    fallback: getRequiredString(value, 'fallback'),
  };
}

function findDuplicateStringsAcrossGroups(groups) {
  const seen = new Map();
  for (const [group, values] of Object.entries(groups)) {
    for (const value of values) {
      const key = value.toLowerCase();
      const owners = seen.get(key) ?? [];
      owners.push(group);
      seen.set(key, owners);
    }
  }
  return [...seen.entries()].filter(([, owners]) => owners.length > 1).map(([value]) => value);
}

async function readDesignContextNotes(project, selectionRegistry) {
  const registries = [{ sourceFile: null, registry: await readOptionalJson(project.notesPath, null) }];
  const activeSourceFile = getActiveDesignSourceFile(selectionRegistry);
  const pages = (Array.isArray(project.pages?.pages) ? [...project.pages.pages] : [])
    .sort((left, right) => Number(getPageSourceFile(right) === activeSourceFile) - Number(getPageSourceFile(left) === activeSourceFile))
    .slice(0, 24);
  const sidecars = await Promise.all(pages.map(async (page) => {
    if (typeof page?.sourceFile !== 'string' || !page.sourceFile.trim()) return null;
    const sourceFile = normalizeProjectPath(page.sourceFile);
    let pagePath;
    try {
      pagePath = resolveAuthoringPagePath(project.root, sourceFile, project.pages);
    } catch {
      return null;
    }
    const sidecarPath = pagePath.replace(/(\.[^./]+)?$/, '.workbench-notes.json');
    return { sourceFile, registry: await readOptionalJson(sidecarPath, null) };
  }));
  registries.push(...sidecars.filter(Boolean));

  const items = [];
  let total = 0;
  let open = 0;
  for (const { sourceFile, registry } of registries) {
    const notes = Array.isArray(registry?.comments)
      ? registry.comments
      : Array.isArray(registry?.notes)
        ? registry.notes
        : [];
    total += notes.length;
    open += notes.filter((note) => note?.status !== 'resolved').length;
    for (const note of notes) {
      if (items.length >= 40) break;
      const extensions = isRecord(note?.extensions) ? note.extensions : {};
      items.push({
        id: compactDesignContextText(note?.id, 160),
        sourceFile: compactDesignContextText(sourceFile, 500),
        title: compactDesignContextText(extensions.title ?? note?.title, 240),
        type: compactDesignContextText(extensions.type ?? note?.type, 80),
        status: compactDesignContextText(note?.status, 80),
        body: compactDesignContextText(note?.body, 280),
      });
    }
  }
  return { total, open, truncated: total > items.length, items };
}

const ORGANIZATIONAL_CONTEXT_SECTIONS = Object.freeze({
  'Purpose and product principles': 'principles',
  'Decision rationale': 'decisions',
  'Known constraints': 'constraints',
  'Known limitations': 'limitations',
  'Lessons learned': 'lessons',
  'Improvement priorities': 'improvements',
  'Non-goals': 'nonGoals',
});

const UNSAFE_ORGANIZATIONAL_CONTEXT_PATTERNS = [
  /(?:^|\s)\/Users\//i,
  /[A-Za-z]:\\Users\\/i,
  /\bfile:\/\//i,
  /\b(?:sk-[A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._~+/-]{12,})\b/i,
  /\b(?:password|passwd|api[_-]?key|access[_-]?token|secret)\s*[:=]\s*\S+/i,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
];

async function readOrganizationalContext(project) {
  const sourceFile = AUTHORING_ORGANIZATIONAL_CONTEXT_PATH;
  const filePath = resolve(project.root, sourceFile);
  let contents;
  try {
    const [realProjectRoot, realContextPath] = await Promise.all([
      realpath(project.root),
      realpath(filePath),
    ]);
    const realRelativePath = relative(realProjectRoot, realContextPath);
    if (!realRelativePath || realRelativePath === '..' || realRelativePath.startsWith(`..${sep}`)) {
      return {
        status: 'excluded',
        audience: null,
        sourceFile,
        reason: 'The organizational context path resolves outside the project root.',
        sections: emptyOrganizationalContextSections(),
        filteredItemCount: 0,
      };
    }
    contents = await readFile(realContextPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        status: 'unavailable',
        audience: null,
        sourceFile,
        reason: 'No curated public organizational context is present for this project.',
        sections: emptyOrganizationalContextSections(),
        filteredItemCount: 0,
      };
    }
    throw error;
  }

  if (contents.length > 64_000) {
    return {
      status: 'excluded',
      audience: null,
      sourceFile,
      reason: 'The organizational context exceeds the bounded public-context size limit.',
      sections: emptyOrganizationalContextSections(),
      filteredItemCount: 0,
    };
  }

  const audience = readOrganizationalContextMetadata(contents, 'Audience');
  const reviewStatus = readOrganizationalContextMetadata(contents, 'Status');
  if (audience !== 'public' || reviewStatus !== 'curated') {
    return {
      status: 'excluded',
      audience,
      sourceFile,
      reason: 'Organizational context is returned only when Audience is public and Status is curated.',
      sections: emptyOrganizationalContextSections(),
      filteredItemCount: 0,
    };
  }

  const sections = emptyOrganizationalContextSections();
  let activeSection = null;
  let filteredItemCount = 0;
  for (const rawLine of contents.split(/\r?\n/)) {
    const heading = rawLine.match(/^##\s+(.+?)\s*$/)?.[1];
    if (heading) {
      activeSection = ORGANIZATIONAL_CONTEXT_SECTIONS[heading] ?? null;
      continue;
    }
    const item = rawLine.match(/^\s*-\s+(.+?)\s*$/)?.[1];
    if (!activeSection || !item) continue;
    if (UNSAFE_ORGANIZATIONAL_CONTEXT_PATTERNS.some((pattern) => pattern.test(item))) {
      filteredItemCount += 1;
      continue;
    }
    const compact = compactDesignContextText(item, DESIGN_CONTEXT_LIMITS.string);
    if (compact && sections[activeSection].length < 20) sections[activeSection].push(compact);
  }

  return {
    status: 'collected',
    audience,
    reviewStatus,
    sourceFile,
    disclosureBoundary: 'Only reviewed bullets from allowlisted public sections are returned; private history and unstructured text are not inspected.',
    sections,
    filteredItemCount,
  };
}

function emptyOrganizationalContextSections() {
  return {
    principles: [],
    decisions: [],
    constraints: [],
    limitations: [],
    lessons: [],
    improvements: [],
    nonGoals: [],
  };
}

function readOrganizationalContextMetadata(contents, key) {
  const match = contents.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'im'));
  return match ? compactDesignContextText(match[1], 80)?.toLowerCase() ?? null : null;
}

function getPageSourceFile(page) {
  return typeof page?.sourceFile === 'string' ? normalizeProjectPath(page.sourceFile) : null;
}

function getActiveDesignSourceFile(selectionRegistry) {
  const activeTarget = isRecord(selectionRegistry?.activeTarget) ? selectionRegistry.activeTarget : {};
  const extensions = isRecord(selectionRegistry?.extensions) ? selectionRegistry.extensions : {};
  const sourceFile = optionalString(activeTarget.sourceFile) ?? optionalString(extensions.activeDesignSourceFile);
  return sourceFile ? normalizeProjectPath(sourceFile) : null;
}

function summarizeDesignContextValue(value, depth = 0) {
  if (typeof value === 'string') return compactDesignContextText(value, 240);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (depth >= 3) return null;
  if (Array.isArray(value)) return value.slice(0, 20).map((entry) => summarizeDesignContextValue(entry, depth + 1));
  if (!isRecord(value)) return null;
  return Object.fromEntries(Object.entries(value)
    .slice(0, 20)
    .map(([key, entry]) => [compactDesignContextText(key, 120), summarizeDesignContextValue(entry, depth + 1)])
    .filter(([key]) => key));
}

function compactDesignContextText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const compact = value.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength - 1)}…`;
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function applyLayeredTokenOperation(registry, operation) {
  const layer = getRequiredString(operation, 'layer');
  const token = operation?.token;
  if (!isRecord(token)) throw createAuthoringError('WB-AUTH-TOKEN-INVALID', 'Token operation requires a token object.');
  const collectionId = getRequiredString(operation, 'collectionId');
  const collection = registry.collections?.find((candidate) => candidate.id === collectionId);
  if (!collection) throw createAuthoringError('WB-AUTH-TOKEN-COLLECTION', `Token collection ${collectionId} was not found.`);
  const expectedLayer = layer === 'primitive' ? 'primitive' : layer === 'semantic' ? 'semantic' : layer === 'component' ? 'component' : null;
  if (!expectedLayer) throw createAuthoringError('WB-AUTH-TOKEN-LAYER', 'Token layer must be primitive, semantic, or component.');
  const values = isRecord(token.values) ? token.values : {};
  const entries = Object.values(values);
  if (entries.length === 0) throw createAuthoringError('WB-AUTH-TOKEN-VALUES', 'Token values are required.');
  if (!collection.groups?.some((group) => group.id === token.groupId)) {
    throw createAuthoringError('WB-AUTH-TOKEN-GROUP', `Token group ${token.groupId} was not found in ${collectionId}.`);
  }
  const collectionLayer = getTokenCollectionLayer(collection);
  if (collectionLayer !== expectedLayer) {
    throw createAuthoringError('WB-AUTH-TOKEN-LAYER', `Collection ${collectionId} is ${collectionLayer}, not ${expectedLayer}.`);
  }
  if (expectedLayer === 'primitive') {
    if (!entries.every((value) => isRecord(value) && value.kind === 'raw')) throw createAuthoringError('WB-AUTH-TOKEN-CHAIN', 'Primitive tokens must own raw values.');
    const duplicate = collection.tokens?.find((candidate) => candidate.id !== token.id && candidate.type === token.type && rawTokenValuesEqual(candidate.values, values));
    if (duplicate) throw createAuthoringError('WB-AUTH-TOKEN-DUPLICATE', `Reuse primitive ${collectionId}/${duplicate.id} instead of creating a duplicate raw value.`);
  } else {
    const requiredPrefix = expectedLayer === 'component' ? 'workbench-semantic-' : null;
    if (!entries.every((value) => isRecord(value) && value.kind === 'ref' && (!requiredPrefix || String(value.collectionId).startsWith(requiredPrefix)))) {
      throw createAuthoringError('WB-AUTH-TOKEN-CHAIN', expectedLayer === 'component' ? 'Component tokens must reference a workbench-semantic-* collection.' : 'Semantic tokens must reference primitive tokens.');
    }
    if (expectedLayer === 'semantic' && !entries.every((value) => String(value.collectionId).includes('primitive'))) {
      throw createAuthoringError('WB-AUTH-TOKEN-CHAIN', 'Semantic tokens must reference a primitive collection.');
    }
    for (const value of entries) {
      const referencedCollection = registry.collections?.find((candidate) => candidate.id === value.collectionId);
      const referencedToken = referencedCollection?.tokens?.find((candidate) => candidate.id === value.tokenId);
      if (!referencedCollection || !referencedToken) {
        throw createAuthoringError('WB-AUTH-TOKEN-REFERENCE', `Token reference ${value.collectionId}/${value.tokenId} was not found.`);
      }
      if (referencedToken.type !== token.type) {
        throw createAuthoringError('WB-AUTH-TOKEN-TYPE', `Token ${token.id} (${token.type}) cannot reference ${value.collectionId}/${value.tokenId} (${referencedToken.type}).`);
      }
    }
  }
  const normalized = { ...token, id: getRequiredString(token, 'id'), name: getRequiredString(token, 'name'), type: getRequiredString(token, 'type'), groupId: getRequiredString(token, 'groupId'), values };
  const index = collection.tokens.findIndex((candidate) => candidate.id === normalized.id);
  if (index >= 0) collection.tokens[index] = { ...collection.tokens[index], ...normalized };
  else collection.tokens.push({ ...normalized, sortOrder: Number.isFinite(normalized.sortOrder) ? normalized.sortOrder : collection.tokens.length });
}

function getTokenCollectionLayer(collection) {
  if (String(collection.id).includes('primitive')) return 'primitive';
  if (String(collection.id).startsWith('workbench-semantic-')) return 'semantic';
  return 'component';
}

function rawTokenValuesEqual(left, right) {
  const normalize = (values) => Object.entries(values ?? {})
    .map(([modeId, entry]) => [modeId, entry?.kind, entry?.value, entry?.unit ?? null])
    .sort(([leftMode], [rightMode]) => String(leftMode).localeCompare(String(rightMode)));
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

async function createComponentCatalog(registry, projectRoot) {
  const components = Array.isArray(registry?.components) ? registry.components : [];
  const catalog = await Promise.all(components
    .filter((component) => isRecord(component) && typeof component.id === 'string' && typeof component.name === 'string' && typeof component.sourceFile === 'string')
    .filter((component) => component.extensions?.hiddenFromInsert !== true)
    .map(async (component) => {
      const extensions = isRecord(component.extensions) ? component.extensions : {};
      const importName = firstNonEmptyString(extensions.importName, extensions.sourceExportName, toComponentIdentifier(component.name));
      const storyContract = await readStoryAuthoringContract(projectRoot, extensions.storySourceFile);
      const explicit = normalizeAuthoringMetadata(storyContract?.authoring ?? extensions.authoring);
      const inferred = inferAuthoringMetadata(importName || component.name);
      return {
        id: component.id,
        name: component.name,
        sourceFile: normalizeProjectPath(component.sourceFile),
        importName,
        props: normalizeComponentPropContract(storyContract),
        sourceInsert: normalizeComponentSourceInsert(storyContract?.sourceInsert),
        childrenSlotKind: extensions.childrenSlotKind === 'block' || extensions.childrenSlotKind === 'inline'
          ? extensions.childrenSlotKind
          : null,
        authoring: {
          allowedChildren: explicit.allowedChildren,
          capabilities: uniqueStrings([...explicit.capabilities, ...inferred.capabilities]),
          nativeReplacements: uniqueStrings([...explicit.nativeReplacements, ...inferred.nativeReplacements]),
          priority: explicit.priority,
          roles: uniqueStrings([...explicit.roles, ...inferred.roles]),
          runtimeClass: explicit.runtimeClass,
        },
      };
    }));
  return catalog
    .filter((component) => (
      AUTHORING_COMPONENT_NAME_PATTERN.test(component.importName) &&
      AUTHORING_SOURCE_EXTENSION_PATTERN.test(component.sourceFile) &&
      !component.sourceFile.split('/').includes('..') &&
      component.sourceFile !== AUTHORING_PAGE_ROOT &&
      !component.sourceFile.startsWith(`${AUTHORING_PAGE_ROOT}/`)
    ))
    .sort((left, right) => right.authoring.priority - left.authoring.priority || left.name.localeCompare(right.name));
}

async function readStoryAuthoringContract(projectRoot, storySourceFile) {
  if (typeof storySourceFile !== 'string' || !storySourceFile.trim()) return null;
  const normalized = normalizeProjectPath(storySourceFile);
  const filePath = resolve(projectRoot, normalized);
  const relativePath = relative(projectRoot, filePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || !AUTHORING_SOURCE_EXTENSION_PATTERN.test(normalized)) return null;
  let contents;
  try {
    contents = await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
  let ast;
  try {
    ast = parse(contents, { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: false });
  } catch {
    return null;
  }

  const bindings = new Map();
  let metaObject = null;
  for (const statement of ast.program.body) {
    if (statement.type === 'VariableDeclaration') {
      for (const declaration of statement.declarations) {
        if (declaration.id?.type === 'Identifier' && declaration.init) {
          bindings.set(declaration.id.name, declaration.init);
          if (declaration.id.name === 'meta') {
            const resolved = unwrapStaticExpression(declaration.init);
            if (resolved?.type === 'ObjectExpression') metaObject = resolved;
          }
        }
      }
    }
    if (statement.type === 'ExportDefaultDeclaration') {
      const resolved = resolveStaticExpression(statement.declaration, bindings);
      if (resolved?.type === 'ObjectExpression') metaObject = resolved;
    }
  }
  if (!metaObject) return null;
  const metaValue = readStaticAuthoringValue(metaObject, bindings);
  if (!isRecord(metaValue)) return null;
  return {
    args: isRecord(metaValue.args) ? metaValue.args : {},
    argTypes: isRecord(metaValue.argTypes) ? metaValue.argTypes : {},
    authoring: isRecord(metaValue.authoring) ? metaValue.authoring : null,
    sourceInsert: isRecord(metaValue.sourceInsert) ? metaValue.sourceInsert : {},
  };
}

function readStaticAuthoringValue(node, bindings = new Map(), resolving = new Set()) {
  const resolved = resolveStaticExpression(node, bindings, resolving);
  if (!resolved) return undefined;
  if (resolved.type === 'StringLiteral' || resolved.type === 'NumericLiteral' || resolved.type === 'BooleanLiteral') return resolved.value;
  if (resolved.type === 'NullLiteral') return null;
  if (resolved.type === 'UnaryExpression' && resolved.operator === '-' && resolved.argument?.type === 'NumericLiteral') return -resolved.argument.value;
  if (resolved.type === 'ArrayExpression') return resolved.elements.map((element) => readStaticAuthoringValue(element, bindings, resolving)).filter((value) => value !== undefined);
  if (resolved.type === 'MemberExpression' && !resolved.computed && resolved.property?.type === 'Identifier') {
    const objectValue = readStaticAuthoringValue(resolved.object, bindings, resolving);
    return isRecord(objectValue) ? objectValue[resolved.property.name] : undefined;
  }
  if (resolved.type === 'MemberExpression' && resolved.computed && resolved.property?.type === 'StringLiteral') {
    const objectValue = readStaticAuthoringValue(resolved.object, bindings, resolving);
    return isRecord(objectValue) ? objectValue[resolved.property.value] : undefined;
  }
  if (resolved.type === 'ObjectExpression') {
    return Object.fromEntries(resolved.properties.flatMap((property) => {
      if (property.type === 'SpreadElement') {
        const spread = readStaticAuthoringValue(property.argument, bindings, resolving);
        return isRecord(spread) ? Object.entries(spread) : [];
      }
      if (property.type !== 'ObjectProperty') return [];
      const key = getStaticObjectKey(property.key);
      const value = readStaticAuthoringValue(property.value, bindings, resolving);
      return key && value !== undefined ? [[key, value]] : [];
    }));
  }
  return undefined;
}

function unwrapStaticExpression(node) {
  let current = node;
  while (
    current?.type === 'TSAsExpression'
    || current?.type === 'TSSatisfiesExpression'
    || current?.type === 'TypeCastExpression'
    || current?.type === 'ParenthesizedExpression'
  ) {
    current = current.expression;
  }
  return current;
}

function resolveStaticExpression(node, bindings, resolving = new Set()) {
  const unwrapped = unwrapStaticExpression(node);
  if (unwrapped?.type !== 'Identifier') return unwrapped;
  if (!bindings.has(unwrapped.name) || resolving.has(unwrapped.name)) return unwrapped;
  resolving.add(unwrapped.name);
  const resolved = resolveStaticExpression(bindings.get(unwrapped.name), bindings, resolving);
  resolving.delete(unwrapped.name);
  return resolved;
}

function normalizeComponentSourceInsert(value) {
  if (!isRecord(value)) return { props: {} };
  const props = isRecord(value.props)
    ? Object.fromEntries(Object.entries(value.props).filter(([, propValue]) => isAuthoringLiteral(propValue)))
    : {};
  return {
    props,
    ...(typeof value.jsxChildren === 'string' ? { jsxChildren: value.jsxChildren.slice(0, 2000) } : {}),
  };
}

function normalizeComponentPropContract(storyContract) {
  const sourceProps = isRecord(storyContract?.sourceInsert?.props) ? storyContract.sourceInsert.props : {};
  const argTypes = isRecord(storyContract?.argTypes) ? storyContract.argTypes : {};
  return Object.keys(sourceProps).sort().map((name) => {
    const argType = isRecord(argTypes[name]) ? argTypes[name] : {};
    const options = Array.isArray(argType.options)
      ? argType.options.filter((value) => isAuthoringLiteral(value))
      : [];
    const defaultValue = sourceProps[name];
    return {
      name,
      required: argType.required === true,
      defaultValue,
      valueTypes: uniqueStrings(
        [...options, defaultValue]
          .filter((value) => value !== undefined && value !== null)
          .map((value) => typeof value),
      ),
      ...(options.length > 0 ? { options } : {}),
      ...(typeof argType.description === 'string' && argType.description.trim()
        ? { description: argType.description.trim() }
        : {}),
    };
  });
}

function isAuthoringLiteral(value) {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function getStaticObjectKey(node) {
  if (node?.type === 'Identifier' || node?.type === 'StringLiteral') return node.name ?? node.value;
  return null;
}

function normalizeAuthoringMetadata(value) {
  const metadata = isRecord(value) ? value : {};
  return {
    allowedChildren: uniqueStrings(Array.isArray(metadata.allowedChildren) ? metadata.allowedChildren : []),
    capabilities: uniqueStrings(Array.isArray(metadata.capabilities) ? metadata.capabilities : []),
    nativeReplacements: uniqueStrings(Array.isArray(metadata.nativeReplacements) ? metadata.nativeReplacements : []).map((value) => value.toLowerCase()),
    priority: Number.isFinite(metadata.priority) ? Number(metadata.priority) : 0,
    roles: uniqueStrings(Array.isArray(metadata.roles) ? metadata.roles : []),
    runtimeClass: typeof metadata.runtimeClass === 'string' && AUTHORING_RUNTIME_CLASSES.has(metadata.runtimeClass)
      ? metadata.runtimeClass
      : null,
  };
}

function inferAuthoringMetadata(componentName) {
  const match = AUTHORING_COMPONENT_ROLE_RULES.find((rule) => rule.pattern.test(componentName));
  return match
    ? { capabilities: [], nativeReplacements: match.nativeReplacements, roles: match.roles }
    : { capabilities: [], nativeReplacements: [], roles: [] };
}

function searchComponentCatalog(catalog, input) {
  const query = typeof input?.query === 'string' ? input.query.trim().toLowerCase() : '';
  const roles = uniqueStrings(Array.isArray(input?.roles) ? input.roles : []);
  const rawLimit = Number(input?.limit ?? 24);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 24;
  const scored = catalog.map((component) => {
    const haystack = [component.id, component.name, component.importName, ...component.authoring.roles, ...component.authoring.capabilities]
      .join(' ')
      .toLowerCase();
    if (query && !haystack.includes(query)) return null;
    if (roles.length > 0 && !roles.some((role) => component.authoring.roles.includes(role))) return null;
    let score = component.authoring.priority;
    if (query && component.name.toLowerCase() === query) score += 1000;
    if (query && component.importName.toLowerCase() === query) score += 900;
    score += roles.filter((role) => component.authoring.roles.includes(role)).length * 100;
    return { component, score };
  }).filter(Boolean);

  scored.sort((left, right) => right.score - left.score || left.component.name.localeCompare(right.component.name));
  return {
    ok: true,
    components: scored.slice(0, limit).map(({ component }) => component),
    total: scored.length,
  };
}

function getActiveRequirement(requirementStore, requirementsId, project, projectRoot) {
  const requirement = requirementStore.get(requirementsId);
  if (!requirement) {
    throw createAuthoringError('WB-AUTH-REQUIREMENTS-MISSING', 'A confirmed requirements contract was not found or has expired. Run workbench_confirm_design_requirements before continuing.');
  }
  if (Date.parse(requirement.expiresAt) <= Date.now()) {
    requirementStore.delete(requirement.id);
    throw createAuthoringError('WB-AUTH-REQUIREMENTS-EXPIRED', 'The confirmed requirements contract expired. Inspect and confirm requirements again.');
  }
  if (requirement.projectRoot !== resolve(projectRoot) || requirement.projectId !== project.config.projectId) {
    throw createAuthoringError('WB-AUTH-REQUIREMENTS-STALE', 'The active project changed after requirements confirmation. Inspect the intended project before continuing.');
  }
  return requirement;
}

function normalizeExecutionPromptInput(input, pages) {
  if (!isRecord(input)) throw createAuthoringError('WB-AUTH-EXECUTION-PROMPT-INVALID', 'Execution prompt input must be an object.');
  const requirementsId = getRequiredString(input, 'requirementsId');
  const pageName = getRequiredString(input, 'pageName');
  const route = normalizeRoute(getRequiredString(input, 'route'));
  const sourceFile = normalizeProjectPath(getRequiredString(input, 'sourceFile'));
  resolveAuthoringPagePath('.', sourceFile, pages, { validateOnly: true });
  return {
    requirementsId,
    pageName,
    route,
    sourceFile,
    compositionApproach: getRequiredString(input, 'compositionApproach'),
    contentOutline: normalizeRequirementStringList(input.contentOutline, 'contentOutline', { min: 3 }),
    interactionOutline: normalizeRequirementStringList(input.interactionOutline, 'interactionOutline', { min: 1 }),
    responsiveOutline: normalizeRequirementStringList(input.responsiveOutline, 'responsiveOutline', { min: 2 }),
    authoringConstraints: normalizeRequirementStringList(input.authoringConstraints, 'authoringConstraints', { min: 1 }),
  };
}

function createPageExecutionPrompt(contract, request) {
  const list = (values) => values.map((value) => `- ${value}`).join('\n');
  const requiredStates = Object.entries(contract.states ?? {})
    .filter(([, state]) => state?.applicability === 'required')
    .map(([name, state]) => `${name}: ${state.description}; trigger=${state.trigger}; recovery=${state.recovery}`);
  const sections = (contract.sections ?? []).map((section) => `${section.name} [${section.ownership}/${section.emphasis}] — ${section.intent}; action=${section.primaryAction}; next=${section.nextStep}`);
  const data = (contract.dataRequirements ?? []).map((item) => `${item.name} — source=${item.source}; freshness=${item.freshness}; fallback=${item.fallback}`);
  const disclosures = (contract.visualComposition?.disclosures ?? []).map((item) => `${item.content} -> ${item.owner} via ${item.trigger}; ${item.rationale}`);
  const reference = contract.designIntelligence?.reference ?? {};
  return [
    `Build the Workbench page "${request.pageName}" at ${request.route} in ${request.sourceFile}.`,
    '',
    'Execution mode',
    '- Compose source directly and verify the real render. Do not generate design images unless the user separately asks for them.',
    '- This prompt must be approved by the user before page planning or writes.',
    '',
    'Product and user',
    `- Product: ${contract.product.name}`,
    `- Purpose: ${contract.product.purpose}`,
    `- Primary user: ${contract.product.primaryUser}`,
    `- Entry: ${contract.surface.entryContext}`,
    `- Outcome: ${contract.surface.primaryOutcome}`,
    '',
    'Workflow and operational truth',
    `- Workflow: ${contract.designIntelligence.workflow.model}`,
    list(contract.designIntelligence.workflow.domainObjects),
    `- Primary action: ${contract.surface.primaryAction}`,
    `- Action consequence: ${contract.surface.actionConsequence}`,
    `- Next step: ${contract.surface.nextStep}`,
    list(contract.designIntelligence.decisions.operationalRules),
    '',
    'Action hierarchy',
    list(contract.designIntelligence.decisions.actionHierarchy),
    '',
    'Required states and recovery',
    list(requiredStates),
    '',
    'Information architecture',
    list(sections),
    '',
    'Realistic content and data',
    list(contract.designIntelligence.content.sampleContent),
    list(data),
    '',
    'Reference transfer',
    `- Status: ${reference.status}`,
    `- Implementation mode: ${reference.implementationMode}`,
    `- Precedence: ${reference.sourcePrecedence}`,
    list(reference.pageLandmarks ?? []),
    list(reference.hierarchyObservations ?? []),
    list(reference.deliberateDeviations ?? []),
    '',
    'Composition',
    `- Approach: ${request.compositionApproach}`,
    `- Surface=${contract.visualComposition.surfaceModel}; density=${contract.visualComposition.density}; border=${contract.visualComposition.borderPolicy}; cards=${contract.visualComposition.cardPolicy}; dividers=${contract.visualComposition.dividerPolicy}; overlays=${contract.visualComposition.overlayPolicy}`,
    list(request.contentOutline),
    '',
    'Interactions and disclosure',
    list(request.interactionOutline),
    list(disclosures),
    '',
    'Responsive and accessibility',
    list(request.responsiveOutline),
    `- Wide: ${contract.responsiveAccessibility.wide}`,
    `- Compact: ${contract.responsiveAccessibility.compact}`,
    `- Keyboard: ${contract.responsiveAccessibility.keyboard}`,
    `- Screen reader: ${contract.responsiveAccessibility.screenReader}`,
    '',
    'Workbench authoring constraints',
    list(request.authoringConstraints),
    '- Implement the result in real project source and keep it editable through Workbench Layers, Inspector, Binding, or source boundaries.',
    '- Native semantic HTML, project primitives, ordinary React patterns, and registered components are all valid; a catalog match never forces replacement.',
    '- Use explicit JSX when direct per-item layer manipulation matters. Otherwise local helpers, .map(), callbacks, data props, and conditional rendering are allowed.',
    '- Keep routes, preview CSS, assets, and page metadata coherent. Verify the exact requested view and fix practical render, interaction, accessibility, fidelity, and responsive defects.',
    '',
    'Explicit non-goals',
    list(contract.designIntelligence.content.nonGoals),
  ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n').trim();
}

function normalizePlanInput(input, pages) {
  if (!isRecord(input)) throw createAuthoringError('WB-AUTH-PLAN-INVALID', 'Authoring plan input must be an object.');
  const requirementsId = typeof input.requirementsId === 'string' && input.requirementsId.trim()
    ? input.requirementsId.trim()
    : null;
  const pageName = getRequiredString(input, 'pageName');
  const intents = uniqueStrings(Array.isArray(input.intents) ? input.intents : []);
  const sourceFile = normalizeProjectPath(getRequiredString(input, 'sourceFile'));
  const exportName = typeof input.exportName === 'string' && input.exportName.trim()
    ? input.exportName.trim()
    : toComponentIdentifier(pageName.endsWith('Page') ? pageName : `${pageName}Page`);
  if (!AUTHORING_COMPONENT_NAME_PATTERN.test(exportName)) {
    throw createAuthoringError('WB-AUTH-EXPORT-INVALID', 'Page exportName must be a PascalCase JavaScript identifier.');
  }
  const route = normalizeRoute(getRequiredString(input, 'route'));
  resolveAuthoringPagePath('.', sourceFile, pages, { validateOnly: true });
  const designEvidence = isRecord(input.designEvidence) ? structuredClone(input.designEvidence) : null;
  const visualHierarchy = isRecord(input.visualHierarchy) ? normalizeVisualHierarchy(input.visualHierarchy) : null;
  const geometryContract = isRecord(input.geometryContract) ? normalizeGeometryContract(input.geometryContract) : null;
  const approvedPromptId = typeof input.approvedPromptId === 'string' && input.approvedPromptId.trim()
    ? input.approvedPromptId.trim()
    : null;
  return {
    authoringSessionId: typeof input.authoringSessionId === 'string' && input.authoringSessionId.trim()
      ? input.authoringSessionId.trim()
      : null,
    designEvidence,
    exportName,
    intents,
    pageName,
    approvedPromptId,
    requirementsId,
    route,
    sourceFile,
    visualHierarchy,
    geometryContract,
  };
}

function normalizeGeometryContract(value) {
  return isRecord(value) ? structuredClone(value) : null;
}

function normalizeDesignEvidence(value) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-DESIGN-EVIDENCE-MISSING', 'Page plans require evidence that a host visual-design or ideation skill explored and selected a visual target.');
  }
  const skill = getRequiredString(value, 'skill');
  const capability = normalizeDesignCapability(value.capability, skill);
  const visualExploration = normalizeVisualExploration(value.visualExploration);
  const mode = getRequiredString(value, 'mode');
  if (!AUTHORING_IDEATION_MODES.has(mode)) {
    throw createAuthoringError('WB-AUTH-DESIGN-MODE', 'Design evidence mode must be focused or divergent.');
  }
  const presentationSetId = getRequiredString(value, 'presentationSetId');
  const modeRationale = getRequiredString(value, 'modeRationale');
  const rawOptions = Array.isArray(value.options) ? value.options : [];
  if (mode === 'focused' && rawOptions.length !== 1) {
    throw createAuthoringError('WB-AUTH-DESIGN-FOCUSED-COUNT', 'Focused design evidence requires exactly one resolved visual target.');
  }
  if (mode === 'divergent' && (rawOptions.length < 2 || rawOptions.length > 6)) {
    throw createAuthoringError('WB-AUTH-DESIGN-DIVERGENT-COUNT', 'Explicit divergent design evidence requires two to six materially different visible options.');
  }
  const options = rawOptions.map((option, index) => {
    if (!isRecord(option)) throw createAuthoringError('WB-AUTH-DESIGN-OPTION', `Design option ${index + 1} must be an object.`);
    const interactionModel = getRequiredString(option, 'interactionModel');
    if (!AUTHORING_INTERACTION_MODELS.has(interactionModel)) {
      throw createAuthoringError('WB-AUTH-DESIGN-INTERACTION-MODEL', `Design option ${index + 1} interactionModel is unsupported.`);
    }
    const disclosureModel = getRequiredString(option, 'disclosureModel');
    if (!AUTHORING_DISCLOSURE_MODELS.has(disclosureModel)) {
      throw createAuthoringError('WB-AUTH-DESIGN-DISCLOSURE-MODEL', `Design option ${index + 1} disclosureModel is unsupported.`);
    }
    const informationArchitecture = uniqueStrings(Array.isArray(option.informationArchitecture) ? option.informationArchitecture : []);
    if (informationArchitecture.length < 3 || informationArchitecture.length > 7) {
      throw createAuthoringError('WB-AUTH-DESIGN-INFORMATION-ARCHITECTURE', `Design option ${index + 1} requires three to seven named information regions.`);
    }
    return {
      id: getRequiredString(option, 'id'),
      displayOrder: getBoundedInteger(option.displayOrder, `Design option ${index + 1} displayOrder`, 1, rawOptions.length),
      experienceHypothesis: getRequiredString(option, 'experienceHypothesis'),
      primaryDecision: getRequiredString(option, 'primaryDecision'),
      dominantEvidence: getRequiredString(option, 'dominantEvidence'),
      interactionModel,
      disclosureModel,
      informationArchitecture,
      serviceTradeoff: getRequiredString(option, 'serviceTradeoff'),
      visualLanguage: getRequiredString(option, 'visualLanguage'),
      reference: getRequiredString(option, 'reference'),
    };
  });
  if (new Set(options.map((option) => option.id)).size !== options.length) {
    throw createAuthoringError('WB-AUTH-DESIGN-OPTION-DUPLICATE', 'Design option ids must be unique.');
  }
  if (new Set(options.map((option) => option.reference)).size !== options.length) {
    throw createAuthoringError('WB-AUTH-DESIGN-REFERENCE-DUPLICATE', 'Every presented design option requires a distinct stable visual reference.');
  }
  const displayOrders = options.map((option) => option.displayOrder).sort((left, right) => left - right);
  if (displayOrders.some((displayOrder, index) => displayOrder !== index + 1)) {
    throw createAuthoringError('WB-AUTH-DESIGN-DISPLAY-ORDER', 'Design option displayOrder values must be unique and consecutive from one through the presented option count.');
  }
  const differentiation = normalizeDesignDifferentiation(value.differentiation, options, mode);
  const selectedOptionId = getRequiredString(value, 'selectedOptionId');
  if (!options.some((option) => option.id === selectedOptionId)) {
    throw createAuthoringError('WB-AUTH-DESIGN-SELECTION', 'selectedOptionId must reference one of the supplied visual options.');
  }
  return {
    skill,
    capability,
    visualExploration,
    mode,
    presentationSetId,
    modeRationale,
    options,
    differentiation,
    selectedOptionId,
    selectionRationale: getRequiredString(value, 'selectionRationale'),
    constraintAssessments: normalizeVisualConstraintAssessments(value.constraintAssessments, 'Selected design target'),
  };
}

function normalizeDesignCapability(value, skill) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-MISSING', 'Design evidence must identify the host, design plugin, actual skill, availability, and stable plugin output references.');
  }
  const host = getRequiredString(value, 'host');
  const provider = getRequiredString(value, 'provider');
  const status = getRequiredString(value, 'status');
  if (!AUTHORING_DESIGN_CAPABILITY_HOSTS.has(host)) throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-HOST', 'Design capability host must be codex, claude, or other.');
  if (!AUTHORING_DESIGN_CAPABILITY_PROVIDERS.has(provider)) throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-PROVIDER', 'Design capability provider is unsupported.');
  if (!AUTHORING_DESIGN_CAPABILITY_STATUSES.has(status)) throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-STATUS', 'Design capability status must be used or unavailable.');
  const providerMatchesHost = (
    (host === 'codex' && provider === 'codex-product-design')
    || (host === 'claude' && provider === 'claude-frontend-design')
    || (host === 'other' && provider === 'host-design-plugin')
    || provider === 'model-fallback'
  );
  if (!providerMatchesHost) throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-ROUTE', 'Design capability provider must match the declared host routing.');
  const capabilitySkill = getRequiredString(value, 'skill');
  if (capabilitySkill !== skill) throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-SKILL', 'designEvidence.skill must match designEvidence.capability.skill.');
  const evidenceReferences = normalizeRequirementStringList(value.evidenceReferences, 'designEvidence.capability.evidenceReferences', { min: 1, max: 6 });
  if (status === 'unavailable' && provider !== 'model-fallback') {
    throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-FALLBACK', 'An unavailable design plugin must be reported as model-fallback.');
  }
  if (status === 'used' && provider === 'model-fallback') {
    throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-FALLBACK', 'model-fallback cannot claim that a design plugin was used.');
  }
  return { host, provider, status, skill: capabilitySkill, evidenceReferences };
}

function normalizeVisualExploration(value) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-MISSING', 'Design evidence must separate product ideation from art-direction resolution.');
  }
  const status = getRequiredString(value, 'status');
  if (!AUTHORING_VISUAL_EXPLORATION_STATUSES.has(status)) throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-STATUS', 'Visual exploration status must be resolved or explored.');
  const rawOptions = Array.isArray(value.options) ? value.options : [];
  const validOptionCount = status === 'explored'
    ? rawOptions.length >= 2 && rawOptions.length <= 6
    : rawOptions.length === 1;
  if (!validOptionCount) {
    throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-COUNT', `${status === 'explored' ? 'Explicit visual exploration requires two to six visible options' : 'Resolved art direction requires exactly one visible target'}.`);
  }
  const options = rawOptions.map((option, index) => {
    if (!isRecord(option)) throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-OPTION', `Visual option ${index + 1} must be an object.`);
    return {
      id: getRequiredString(option, 'id'),
      displayOrder: getBoundedInteger(option.displayOrder, `Visual option ${index + 1} displayOrder`, 1, rawOptions.length),
      visualLanguage: getRequiredString(option, 'visualLanguage'),
      reference: getRequiredString(option, 'reference'),
    };
  });
  if (new Set(options.map((option) => option.id)).size !== options.length || new Set(options.map((option) => option.reference)).size !== options.length) {
    throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-DUPLICATE', 'Visual option ids and references must be unique.');
  }
  const displayOrders = options.map((option) => option.displayOrder).sort((left, right) => left - right);
  if (displayOrders.some((displayOrder, index) => displayOrder !== index + 1)) {
    throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-DISPLAY-ORDER', 'Visual option displayOrder values must be consecutive from one.');
  }
  const selectedOptionId = getRequiredString(value, 'selectedOptionId');
  if (!options.some((option) => option.id === selectedOptionId)) throw createAuthoringError('WB-AUTH-VISUAL-EXPLORATION-SELECTION', 'visualExploration.selectedOptionId must reference a visible option.');
  const rawSelectionEvidence = isRecord(value.selectionEvidence) ? value.selectionEvidence : {};
  const source = getRequiredString(rawSelectionEvidence, 'source');
  if (!AUTHORING_VISUAL_SELECTION_SOURCES.has(source)) throw createAuthoringError('WB-AUTH-VISUAL-SELECTION-SOURCE', 'Visual selection evidence must come from the user, project, or artifact.');
  return {
    status,
    rationale: getRequiredString(value, 'rationale'),
    options,
    selectedOptionId,
    selectionEvidence: { source, reference: getRequiredString(rawSelectionEvidence, 'reference') },
  };
}

function validateDesignCapabilityEvidence(visualDirection, designEvidence) {
  const unboundVisualReferences = designEvidence.visualExploration.options
    .map((option) => option.reference)
    .filter((reference) => !designEvidence.capability.evidenceReferences.includes(reference));
  if (unboundVisualReferences.length > 0) {
    throw createAuthoringError('WB-AUTH-DESIGN-CAPABILITY-EVIDENCE', 'Every visible art-direction reference must be bound to designEvidence.capability.evidenceReferences.');
  }
  if (!visualDirection || visualDirection.status === 'grounded') {
    if (designEvidence.visualExploration.status === 'resolved') {
      const selected = designEvidence.visualExploration.options.find((option) => option.id === designEvidence.visualExploration.selectedOptionId);
      if (visualDirection?.references?.length > 0 && !visualDirection.references.includes(selected?.reference)) {
        throw createAuthoringError('WB-AUTH-VISUAL-TARGET-MISMATCH', 'Resolved art direction must reference the grounded user, project, or artifact target from design context inspection.');
      }
    }
    return;
  }
  if (designEvidence.visualExploration.selectionEvidence.source !== 'user') {
    throw createAuthoringError('WB-AUTH-VISUAL-SELECTION-REQUIRED', 'Unresolved art direction requires an evidence-backed recommendation and explicit user confirmation before planning.');
  }
}

function normalizeDesignDifferentiation(value, options, mode) {
  const rawComparisons = Array.isArray(value) ? value : [];
  if (mode === 'focused') {
    if (rawComparisons.length > 0) {
      throw createAuthoringError('WB-AUTH-DESIGN-FOCUSED-DIFFERENTIATION', 'Focused design evidence cannot claim pairwise differentiation.');
    }
    return [];
  }

  const optionById = new Map(options.map((option) => [option.id, option]));
  const expectedPairKeys = [];
  for (let leftIndex = 0; leftIndex < options.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < options.length; rightIndex += 1) {
      expectedPairKeys.push(createOptionPairKey(options[leftIndex].id, options[rightIndex].id));
    }
  }

  const comparisons = rawComparisons.map((comparison, index) => {
    if (!isRecord(comparison)) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION', `Design differentiation comparison ${index + 1} must be an object.`);
    }
    const leftOptionId = getRequiredString(comparison, 'leftOptionId');
    const rightOptionId = getRequiredString(comparison, 'rightOptionId');
    if (leftOptionId === rightOptionId || !optionById.has(leftOptionId) || !optionById.has(rightOptionId)) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-PAIR', `Design differentiation comparison ${index + 1} must reference two distinct presented options.`);
    }
    const axes = uniqueStrings(Array.isArray(comparison.axes) ? comparison.axes : []);
    const unsupportedAxes = axes.filter((axis) => !AUTHORING_DIFFERENTIATION_AXES.has(axis));
    if (unsupportedAxes.length > 0) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-AXIS', `Unsupported design differentiation axes: ${unsupportedAxes.join(', ')}.`);
    }
    if (axes.length < 3) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-WEAK', 'Every divergent option pair must differ on at least three semantic axes. Layout rearrangement or visual restyling alone is not a meaningful option.');
    }
    if (!axes.some((axis) => AUTHORING_PRODUCT_DIFFERENTIATION_AXES.has(axis)) || !axes.some((axis) => AUTHORING_STRUCTURAL_DIFFERENTIATION_AXES.has(axis))) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-WEAK', 'Every divergent option pair needs at least one product/evidence difference and one information-architecture/interaction/disclosure/tradeoff difference.');
    }
    const leftOption = optionById.get(leftOptionId);
    const rightOption = optionById.get(rightOptionId);
    const falseAxes = axes.filter((axis) => normalizeDesignAxisValue(leftOption, axis) === normalizeDesignAxisValue(rightOption, axis));
    if (falseAxes.length > 0) {
      throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-FALSE', `Declared differentiation axes must change the underlying option contract. Unchanged: ${falseAxes.join(', ')}.`);
    }
    return {
      leftOptionId,
      rightOptionId,
      axes,
      consequence: getRequiredString(comparison, 'consequence'),
    };
  });

  const actualPairKeys = comparisons.map((comparison) => createOptionPairKey(comparison.leftOptionId, comparison.rightOptionId));
  const missingPairs = expectedPairKeys.filter((pairKey) => !actualPairKeys.includes(pairKey));
  const duplicatePairs = actualPairKeys.filter((pairKey, index) => actualPairKeys.indexOf(pairKey) !== index);
  const unexpectedPairs = actualPairKeys.filter((pairKey) => !expectedPairKeys.includes(pairKey));
  if (missingPairs.length > 0 || duplicatePairs.length > 0 || unexpectedPairs.length > 0 || comparisons.length !== expectedPairKeys.length) {
    throw createAuthoringError('WB-AUTH-DESIGN-DIFFERENTIATION-COVERAGE', `Divergent design evidence must compare every option pair exactly once. Missing: ${missingPairs.join(', ') || 'none'}. Duplicate or unexpected: ${[...new Set([...duplicatePairs, ...unexpectedPairs])].join(', ') || 'none'}.`);
  }
  return comparisons;
}

function createOptionPairKey(leftOptionId, rightOptionId) {
  return [leftOptionId, rightOptionId].sort().join('::');
}

function normalizeDesignAxisValue(option, axis) {
  const fieldByAxis = {
    'experience-hypothesis': option.experienceHypothesis,
    'primary-decision': option.primaryDecision,
    'dominant-evidence': option.dominantEvidence,
    'interaction-model': option.interactionModel,
    'disclosure-model': option.disclosureModel,
    'service-tradeoff': option.serviceTradeoff,
  };
  if (axis === 'information-architecture') {
    return option.informationArchitecture
      .map((item) => normalizeSemanticText(item))
      .sort()
      .join('|');
  }
  return normalizeSemanticText(fieldByAxis[axis]);
}

function normalizeSemanticText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function getBoundedInteger(value, label, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw createAuthoringError('WB-AUTH-DESIGN-INTEGER', `${label} must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function normalizeVisualConstraintAssessments(value, label) {
  const rawAssessments = Array.isArray(value) ? value : [];
  return rawAssessments.map((assessment, index) => {
    if (!isRecord(assessment)) throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT-ASSESSMENT', `${label} constraint assessment ${index + 1} must be an object.`);
    const status = getRequiredString(assessment, 'status');
    if (!AUTHORING_VISUAL_CONSTRAINT_STATUSES.has(status)) {
      throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT-ASSESSMENT', `${label} constraint status must be pass or revise.`);
    }
    return {
      constraintId: getRequiredString(assessment, 'constraintId'),
      status,
      note: getRequiredString(assessment, 'note'),
    };
  });
}

function validateVisualConstraintAssessments({ assessments, constraints, label, requirePass }) {
  const expected = Array.isArray(constraints) ? constraints : [];
  if (expected.length === 0) return;
  const assessmentById = new Map((Array.isArray(assessments) ? assessments : []).map((assessment) => [assessment.constraintId, assessment]));
  const missing = expected.filter((constraint) => !assessmentById.has(constraint.id)).map((constraint) => constraint.id);
  const unexpected = [...assessmentById.keys()].filter((id) => !expected.some((constraint) => constraint.id === id));
  if (missing.length > 0 || unexpected.length > 0 || assessmentById.size !== (Array.isArray(assessments) ? assessments.length : 0)) {
    throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT-COVERAGE', `${label} must assess every confirmed visual constraint exactly once. Missing: ${missing.join(', ') || 'none'}. Unexpected or duplicate: ${unexpected.join(', ') || 'none'}.`);
  }
  if (requirePass) {
    const failed = expected.filter((constraint) => assessmentById.get(constraint.id)?.status !== 'pass').map((constraint) => constraint.id);
    if (failed.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-CONSTRAINT-FAILED', `${label} cannot be accepted while confirmed visual constraints require revision: ${failed.join(', ')}.`);
    }
  }
}

function normalizeVisualHierarchy(value) {
  if (!isRecord(value)) {
    throw createAuthoringError('WB-AUTH-VISUAL-HIERARCHY-MISSING', 'Page plans require an explicit visual hierarchy and Gestalt plan.');
  }
  const attentionOrder = uniqueStrings(Array.isArray(value.attentionOrder) ? value.attentionOrder : []);
  if (attentionOrder.length < 3 || attentionOrder.length > 5) {
    throw createAuthoringError('WB-AUTH-ATTENTION-ORDER', 'Visual hierarchy requires three to five ordered attention targets.');
  }
  const primaryFocus = getRequiredString(value, 'primaryFocus');
  if (attentionOrder[0] !== primaryFocus) {
    throw createAuthoringError('WB-AUTH-PRIMARY-FOCUS', 'primaryFocus must exactly match the first attentionOrder entry.');
  }
  const quietRegions = uniqueStrings(Array.isArray(value.quietRegions) ? value.quietRegions : []);
  if (quietRegions.length === 0 || quietRegions.length > 5) {
    throw createAuthoringError('WB-AUTH-QUIET-REGIONS', 'Visual hierarchy requires at least one and at most five deliberate quiet regions.');
  }
  if (!isRecord(value.gestalt)) {
    throw createAuthoringError('WB-AUTH-GESTALT-MISSING', 'Visual hierarchy requires figure-ground, proximity, similarity, continuity, and visual-relief decisions.');
  }
  const gestalt = Object.fromEntries(AUTHORING_GESTALT_PRINCIPLES.map((principle) => [principle, getRequiredString(value.gestalt, principle)]));
  if (!isRecord(value.emphasis)) {
    throw createAuthoringError('WB-AUTH-EMPHASIS-MISSING', 'Visual hierarchy requires an emphasis budget and typography, border, and spacing strategies.');
  }
  const highEmphasisLimit = Number(value.emphasis.highEmphasisLimit);
  if (!Number.isInteger(highEmphasisLimit) || highEmphasisLimit < 1 || highEmphasisLimit > 3) {
    throw createAuthoringError('WB-AUTH-EMPHASIS-LIMIT', 'highEmphasisLimit must be an integer between one and three.');
  }
  const highEmphasisElements = uniqueStrings(Array.isArray(value.emphasis.highEmphasisElements) ? value.emphasis.highEmphasisElements : []);
  if (highEmphasisElements.length === 0 || highEmphasisElements.length > highEmphasisLimit) {
    throw createAuthoringError('WB-AUTH-EMPHASIS-BUDGET', 'highEmphasisElements must contain at least one item and may not exceed highEmphasisLimit.');
  }
  return {
    attentionOrder,
    primaryFocus,
    quietRegions,
    gestalt,
    emphasis: {
      highEmphasisLimit,
      highEmphasisElements,
      borderStrategy: getRequiredString(value.emphasis, 'borderStrategy'),
      typographyStrategy: getRequiredString(value.emphasis, 'typographyStrategy'),
      spacingStrategy: getRequiredString(value.emphasis, 'spacingStrategy'),
    },
  };
}

function normalizeRenderEvidenceInput(value) {
  if (!isRecord(value)) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-INVALID', 'Render evidence input must be an object.');
  const phase = getRequiredString(value, 'phase');
  if (!AUTHORING_RENDER_EVIDENCE_PHASES.has(phase)) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PHASE', 'Render evidence phase must be before-refinement, after-refinement, or final.');
  }
  if (!isRecord(value.viewport)) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-VIEWPORT', 'Render evidence requires viewport dimensions.');
  const width = getBoundedInteger(value.viewport.width, 'Render viewport width', 240, 3840);
  const height = getBoundedInteger(value.viewport.height, 'Render viewport height', 240, 3840);
  const deviceScaleFactor = Number(value.viewport.deviceScaleFactor);
  if (!Number.isFinite(deviceScaleFactor) || deviceScaleFactor < 1 || deviceScaleFactor > 4) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-SCALE', 'deviceScaleFactor must be between one and four.');
  }
  if (!isRecord(value.artifact) || value.artifact.mediaType !== 'image/png') {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-FORMAT', 'Render evidence must contain a PNG artifact.');
  }
  const encoded = getRequiredString(value.artifact, 'dataBase64');
  let bytes;
  try {
    bytes = Buffer.from(encoded, 'base64');
  } catch {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-BASE64', 'Render evidence is not valid base64.');
  }
  if (bytes.length === 0 || bytes.length > AUTHORING_MAX_RENDER_EVIDENCE_BYTES || bytes.toString('base64').replace(/=+$/, '') !== encoded.replace(/\s+/g, '').replace(/=+$/, '')) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-BASE64', `Render evidence must be valid base64 no larger than ${AUTHORING_MAX_RENDER_EVIDENCE_BYTES} bytes.`);
  }
  const png = inspectPngArtifact(bytes);
  const expectedWidth = Math.round(width * deviceScaleFactor);
  const expectedHeight = Math.round(height * deviceScaleFactor);
  if (png.width !== expectedWidth || png.height !== expectedHeight) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-DIMENSIONS', `PNG dimensions ${png.width}x${png.height} do not match the declared viewport and scale ${expectedWidth}x${expectedHeight}.`);
  }
  if (!isRecord(value.capture)) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-CAPTURE', 'Render evidence requires capture provenance and DOM metrics.');
  const renderer = getRequiredString(value.capture, 'renderer');
  if (!AUTHORING_RENDERERS.has(renderer)) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-RENDERER', 'renderer must be workbench-design-canvas or workbench-browser-preview. Standalone Vite previews are diagnostic only.');
  }
  const capturedAt = getRequiredString(value.capture, 'capturedAt');
  if (!Number.isFinite(Date.parse(capturedAt))) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-TIME', 'capturedAt must be an ISO timestamp.');
  if (!isRecord(value.capture.metrics)) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-METRICS', 'Capture evidence requires objective DOM and accessibility metrics.');
  const metric = (name) => getBoundedInteger(value.capture.metrics[name], `Capture metric ${name}`, 0, 1000000);
  const metrics = {
    documentScrollWidth: metric('documentScrollWidth'),
    documentClientWidth: metric('documentClientWidth'),
    clippedElementCount: metric('clippedElementCount'),
    contrastViolationCount: metric('contrastViolationCount'),
    focusIndicatorViolationCount: metric('focusIndicatorViolationCount'),
    touchTargetViolationCount: metric('touchTargetViolationCount'),
    missingAltTextCount: metric('missingAltTextCount'),
  };
  const geometry = normalizeGeometryMeasurements(value.capture.geometry, { width, height });
  const geometryEvaluation = evaluateGeometryMeasurements(geometry);
  return {
    sourceFile: getRequiredString(value, 'sourceFile'),
    sourceRevision: getRequiredString(value, 'sourceRevision'),
    renderRevision: getRequiredString(value, 'renderRevision'),
    phase,
    viewport: { width, height, deviceScaleFactor },
    capture: {
      renderer,
      route: getRequiredString(value.capture, 'route'),
      capturedAt,
      domSnapshotHash: normalizeSha256(value.capture.domSnapshotHash, 'domSnapshotHash'),
      computedStyleHash: normalizeSha256(value.capture.computedStyleHash, 'computedStyleHash'),
      metrics,
      geometryMeasurementHash: createContentRevision(JSON.stringify(geometry)),
    },
    geometryEvaluation,
    artifact: {
      mediaType: 'image/png',
      byteLength: bytes.length,
      pixelWidth: png.width,
      pixelHeight: png.height,
      sha256: createContentRevision(bytes),
    },
  };
}

function normalizeGeometryMeasurements(value, viewport) {
  if (!isRecord(value) || value.measurementVersion !== 'dom-geometry-v1') {
    throw createAuthoringError('WB-AUTH-GEOMETRY-MEASUREMENTS', 'Capture geometry must use measurementVersion dom-geometry-v1.');
  }
  const eligibleElementCount = getBoundedInteger(value.eligibleElementCount, 'Eligible geometry element count', 1, AUTHORING_GEOMETRY_ELEMENT_LIMIT);
  const rawElements = Array.isArray(value.elements) ? value.elements : [];
  if (rawElements.length !== eligibleElementCount) {
    throw createAuthoringError('WB-AUTH-GEOMETRY-COVERAGE', 'eligibleElementCount must exactly match the complete measured elements array.');
  }
  const ids = new Set();
  const number = (candidate, label, min = 0, max = 100000) => {
    const normalized = Number(candidate);
    if (!Number.isFinite(normalized) || normalized < min || normalized > max) {
      throw createAuthoringError('WB-AUTH-GEOMETRY-NUMBER', `${label} must be a finite number between ${min} and ${max}.`);
    }
    return normalized;
  };
  const rect = (candidate, label) => {
    if (!isRecord(candidate)) throw createAuthoringError('WB-AUTH-GEOMETRY-RECT', `${label} must be a rectangle.`);
    return {
      x: number(candidate.x, `${label}.x`, 0, viewport.width),
      y: number(candidate.y, `${label}.y`, 0, viewport.height),
      width: number(candidate.width, `${label}.width`, 0, viewport.width),
      height: number(candidate.height, `${label}.height`, 0, viewport.height),
    };
  };
  const elements = rawElements.map((element, index) => {
    if (!isRecord(element)) throw createAuthoringError('WB-AUTH-GEOMETRY-ELEMENT', `Geometry element ${index + 1} must be an object.`);
    const id = getRequiredString(element, 'id');
    if (ids.has(id)) throw createAuthoringError('WB-AUTH-GEOMETRY-ELEMENT', `Geometry element id ${id} is duplicated.`);
    ids.add(id);
    const kind = getRequiredString(element, 'kind');
    if (!AUTHORING_GEOMETRY_ELEMENT_KINDS.has(kind)) throw createAuthoringError('WB-AUTH-GEOMETRY-ELEMENT', `Geometry element ${id} has an unsupported kind.`);
    const paddingExpectation = getRequiredString(element, 'paddingExpectation');
    const opticalBalanceExpectation = getRequiredString(element, 'opticalBalanceExpectation');
    if (!['uniform', 'not-applicable'].includes(paddingExpectation)) throw createAuthoringError('WB-AUTH-GEOMETRY-PADDING', `Geometry element ${id} paddingExpectation must be uniform or not-applicable.`);
    if (!['symmetric', 'not-applicable'].includes(opticalBalanceExpectation)) throw createAuthoringError('WB-AUTH-GEOMETRY-OPTICAL', `Geometry element ${id} opticalBalanceExpectation must be symmetric or not-applicable.`);
    const normalizedRect = rect(element.rect, `Geometry element ${id} rect`);
    const padding = paddingExpectation === 'uniform'
      ? Object.fromEntries(['top', 'right', 'bottom', 'left'].map((side) => [side, number(element.padding?.[side], `Geometry element ${id} padding.${side}`, 0, Math.max(viewport.width, viewport.height))]))
      : null;
    const inkBounds = opticalBalanceExpectation === 'symmetric' ? rect(element.inkBounds, `Geometry element ${id} inkBounds`) : null;
    let opticalCentroid = null;
    if (opticalBalanceExpectation === 'symmetric') {
      if (!isRecord(element.opticalCentroid)) throw createAuthoringError('WB-AUTH-GEOMETRY-OPTICAL', `Geometry element ${id} requires an opticalCentroid.`);
      opticalCentroid = {
        x: number(element.opticalCentroid.x, `Geometry element ${id} opticalCentroid.x`, 0, viewport.width),
        y: number(element.opticalCentroid.y, `Geometry element ${id} opticalCentroid.y`, 0, viewport.height),
      };
    }
    return { id, kind, rect: normalizedRect, paddingExpectation, padding, opticalBalanceExpectation, inkBounds, opticalCentroid };
  });
  const rawSpacing = Array.isArray(value.spacing) ? value.spacing : [];
  if (rawSpacing.length > AUTHORING_GEOMETRY_SPACING_LIMIT) throw createAuthoringError('WB-AUTH-GEOMETRY-SPACING', 'Geometry spacing measurements exceed the safe limit.');
  const spacingIds = new Set();
  const spacing = rawSpacing.map((measurement, index) => {
    if (!isRecord(measurement)) throw createAuthoringError('WB-AUTH-GEOMETRY-SPACING', `Spacing measurement ${index + 1} must be an object.`);
    const id = getRequiredString(measurement, 'id');
    if (spacingIds.has(id)) throw createAuthoringError('WB-AUTH-GEOMETRY-SPACING', `Spacing measurement id ${id} is duplicated.`);
    spacingIds.add(id);
    const kind = getRequiredString(measurement, 'kind');
    if (!AUTHORING_GEOMETRY_SPACING_KINDS.has(kind)) throw createAuthoringError('WB-AUTH-GEOMETRY-SPACING', `Spacing measurement ${id} has an unsupported kind.`);
    const axis = getRequiredString(measurement, 'axis');
    if (!['horizontal', 'vertical'].includes(axis)) throw createAuthoringError('WB-AUTH-GEOMETRY-SPACING', `Spacing measurement ${id} axis must be horizontal or vertical.`);
    return { id, kind, axis, value: number(measurement.value, `Spacing measurement ${id} value`, 0, Math.max(viewport.width, viewport.height)) };
  });
  return { measurementVersion: 'dom-geometry-v1', eligibleElementCount, elements, spacing };
}

function evaluateGeometryMeasurements(geometry) {
  const violations = [];
  const gridSamples = [];
  const paddingSamples = [];
  const opticalSamples = [];
  const deviationFromGrid = (value) => {
    const remainder = ((value % AUTHORING_GEOMETRY_GRID_UNIT_PX) + AUTHORING_GEOMETRY_GRID_UNIT_PX) % AUTHORING_GEOMETRY_GRID_UNIT_PX;
    return Math.min(remainder, AUTHORING_GEOMETRY_GRID_UNIT_PX - remainder);
  };
  const addGridSample = (id, path, value) => {
    const deviationPx = deviationFromGrid(value);
    const passed = deviationPx <= AUTHORING_GEOMETRY_TOLERANCE_PX;
    gridSamples.push({ id, path, value, deviationPx, passed });
    if (!passed) violations.push({ code: 'WB-AUTH-GRID-DEVIATION', elementId: id, path, measuredPx: value, deviationPx, message: `${path} is ${deviationPx.toFixed(2)}px from the exact 8px grid; any non-zero deviation fails.` });
  };
  for (const element of geometry.elements) {
    for (const field of ['x', 'y', 'width', 'height']) addGridSample(element.id, `rect.${field}`, element.rect[field]);
    if (element.paddingExpectation === 'uniform') {
      const values = Object.values(element.padding);
      const asymmetryPx = Math.max(...values) - Math.min(...values);
      let passed = asymmetryPx <= AUTHORING_GEOMETRY_TOLERANCE_PX;
      if (!passed) violations.push({ code: 'WB-AUTH-PADDING-ASYMMETRY', elementId: element.id, path: 'padding', measuredPx: element.padding, deviationPx: asymmetryPx, message: `Padding differs by ${asymmetryPx.toFixed(2)}px across the four sides.` });
      for (const [side, value] of Object.entries(element.padding)) {
        addGridSample(element.id, `padding.${side}`, value);
        if (deviationFromGrid(value) > AUTHORING_GEOMETRY_TOLERANCE_PX) passed = false;
        if (value > 0 && value < AUTHORING_GEOMETRY_GRID_UNIT_PX - AUTHORING_GEOMETRY_TOLERANCE_PX) {
          passed = false;
          violations.push({ code: 'WB-AUTH-PADDING-MINIMUM', elementId: element.id, path: `padding.${side}`, measuredPx: value, deviationPx: AUTHORING_GEOMETRY_GRID_UNIT_PX - value, message: `Positive padding must be at least ${AUTHORING_GEOMETRY_GRID_UNIT_PX}px.` });
        }
      }
      paddingSamples.push({ id: element.id, padding: element.padding, asymmetryPx, passed });
    }
    if (element.opticalBalanceExpectation === 'symmetric') {
      const ink = element.inkBounds;
      const insets = {
        top: ink.y - element.rect.y,
        right: element.rect.x + element.rect.width - (ink.x + ink.width),
        bottom: element.rect.y + element.rect.height - (ink.y + ink.height),
        left: ink.x - element.rect.x,
      };
      const verticalInsetDeltaPx = Math.abs(insets.top - insets.bottom);
      const horizontalInsetDeltaPx = Math.abs(insets.left - insets.right);
      const center = { x: element.rect.x + element.rect.width / 2, y: element.rect.y + element.rect.height / 2 };
      const centroidOffset = { x: element.opticalCentroid.x - center.x, y: element.opticalCentroid.y - center.y };
      const centroidOffsetPx = Math.max(Math.abs(centroidOffset.x), Math.abs(centroidOffset.y));
      const outside = Object.values(insets).some((value) => value < 0);
      const passed = !outside && verticalInsetDeltaPx <= AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX && horizontalInsetDeltaPx <= AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX && centroidOffsetPx <= AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX;
      if (outside || verticalInsetDeltaPx > AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX || horizontalInsetDeltaPx > AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX) violations.push({ code: 'WB-AUTH-OPTICAL-INSET', elementId: element.id, path: 'inkBounds', measuredPx: insets, deviationPx: Math.max(verticalInsetDeltaPx, horizontalInsetDeltaPx), message: 'Visible-ink insets are outside the box or are not optically balanced within 1px.' });
      if (centroidOffsetPx > AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX) violations.push({ code: 'WB-AUTH-OPTICAL-CENTER', elementId: element.id, path: 'opticalCentroid', measuredPx: centroidOffset, deviationPx: centroidOffsetPx, message: 'Optical centroid is not centered within 1px.' });
      opticalSamples.push({ id: element.id, insets, verticalInsetDeltaPx, horizontalInsetDeltaPx, centroidOffset, centroidOffsetPx, passed });
    }
  }
  for (const measurement of geometry.spacing) addGridSample(measurement.id, `${measurement.kind}.${measurement.axis}`, measurement.value);
  const score = (samples) => samples.length === 0 ? 100 : Math.round(100 * samples.filter((sample) => sample.passed).length / samples.length);
  const deviations = gridSamples.map((sample) => sample.deviationPx).sort((a, b) => a - b);
  return {
    contract: {
      gridUnitPx: AUTHORING_GEOMETRY_GRID_UNIT_PX,
      geometryTolerancePx: AUTHORING_GEOMETRY_TOLERANCE_PX,
      minimumPositivePaddingPx: AUTHORING_GEOMETRY_GRID_UNIT_PX,
      uniformPadding: true,
      opticalBalanceTolerancePx: AUTHORING_OPTICAL_BALANCE_TOLERANCE_PX,
    },
    coverage: { eligibleElementCount: geometry.eligibleElementCount, measuredElementCount: geometry.elements.length, spacingMeasurementCount: geometry.spacing.length },
    scores: { grid: score(gridSamples), uniformPadding: score(paddingSamples), opticalBalance: score(opticalSamples) },
    grid: {
      sampleCount: gridSamples.length,
      violationCount: gridSamples.filter((sample) => !sample.passed).length,
      maximumDeviationPx: deviations.at(-1) ?? 0,
      meanDeviationPx: deviations.length ? deviations.reduce((sum, value) => sum + value, 0) / deviations.length : 0,
      p95DeviationPx: deviations.length ? deviations[Math.min(deviations.length - 1, Math.ceil(deviations.length * 0.95) - 1)] : 0,
    },
    padding: { measuredCount: paddingSamples.length, violationCount: paddingSamples.filter((sample) => !sample.passed).length, samples: paddingSamples },
    opticalBalance: { measuredCount: opticalSamples.length, violationCount: opticalSamples.filter((sample) => !sample.passed).length, samples: opticalSamples },
    violations,
    passed: violations.length === 0,
  };
}

function normalizeVisualReviewInput(value) {
  if (!isRecord(value)) throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-INVALID', 'Visual review input must be an object.');
  const outcome = getRequiredString(value, 'outcome');
  if (!AUTHORING_VISUAL_REVIEW_STATUSES.has(outcome)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-OUTCOME', 'Visual review outcome must be accept or revise.');
  }
  if (!isRecord(value.reviewer)) throw createAuthoringError('WB-AUTH-VISUAL-REVIEWER', 'Visual review requires an independent reviewer identity.');
  if (value.reviewer.kind !== 'independent') throw createAuthoringError('WB-AUTH-VISUAL-REVIEWER', 'Visual review reviewer.kind must be independent.');
  const reviewerMethod = getRequiredString(value.reviewer, 'method');
  if (!AUTHORING_VISUAL_REVIEWER_METHODS.has(reviewerMethod)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEWER', 'Independent reviewer method must be human-design-review, separate-agent, or vision-model.');
  }
  const rawViewports = Array.isArray(value.comparisons) ? value.comparisons : [];
  if (rawViewports.length < 2 || rawViewports.length > 4) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-VIEWPORTS', 'Visual review requires between two and four Workbench render observations.');
  }
  const comparisons = rawViewports.map((viewport, index) => {
    if (!isRecord(viewport)) throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-VIEWPORT', `Viewport review ${index + 1} must be an object.`);
    const observedAttentionOrder = uniqueStrings(Array.isArray(viewport.observedAttentionOrder) ? viewport.observedAttentionOrder : []);
    const findings = uniqueStrings(Array.isArray(viewport.findings) ? viewport.findings : []);
    if (observedAttentionOrder.length < 3 || findings.length === 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-EVIDENCE', 'Each viewport requires at least three observed attention targets and one concrete finding.');
    }
    const evidenceId = typeof viewport.evidenceId === 'string' ? viewport.evidenceId.trim() : '';
    const beforeEvidenceId = typeof viewport.beforeEvidenceId === 'string' ? viewport.beforeEvidenceId.trim() : '';
    const afterEvidenceId = typeof viewport.afterEvidenceId === 'string' ? viewport.afterEvidenceId.trim() : '';
    if (!evidenceId && (!beforeEvidenceId || !afterEvidenceId)) {
      throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-EVIDENCE', 'Each observation requires either one final evidenceId or a beforeEvidenceId/afterEvidenceId pair.');
    }
    if (evidenceId && (beforeEvidenceId || afterEvidenceId)) {
      throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-EVIDENCE', 'Use either final evidenceId or a before/after pair for one observation, not both.');
    }
    return {
      ...(evidenceId ? { evidenceId } : { beforeEvidenceId, afterEvidenceId }),
      observedAttentionOrder,
      findings,
    };
  });
  if (!isRecord(value.gestaltAssessment)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-GESTALT', 'Visual review requires a rendered assessment for every Gestalt principle in the plan.');
  }
  const gestaltAssessment = Object.fromEntries(AUTHORING_GESTALT_PRINCIPLES.map((principle) => {
    const assessment = value.gestaltAssessment[principle];
    if (!isRecord(assessment)) throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-GESTALT', `${principle} assessment is required.`);
    const status = getRequiredString(assessment, 'status');
    if (!AUTHORING_GESTALT_REVIEW_STATUSES.has(status)) {
      throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-GESTALT', `${principle} status must be pass or revise.`);
    }
    return [principle, { status, note: getRequiredString(assessment, 'note') }];
  }));
  if (!isRecord(value.refinement)) throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'Visual review requires a refinement disposition.');
  const changes = uniqueStrings(Array.isArray(value.refinement.changes) ? value.refinement.changes : []);
  const refinementStatus = typeof value.refinement.status === 'string'
    ? value.refinement.status.trim()
    : (changes.length > 0 ? 'completed' : 'not-required');
  if (!['completed', 'not-required'].includes(refinementStatus)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'refinement.status must be completed or not-required.');
  }
  if (refinementStatus === 'completed' && changes.length === 0) {
    throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'A completed refinement must name at least one visible change.');
  }
  if (refinementStatus === 'not-required' && changes.length > 0) {
    throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'A not-required refinement cannot claim source changes.');
  }
  const rawResolutions = Array.isArray(value.warningResolutions) ? value.warningResolutions : [];
  const warningResolutions = rawResolutions.map((resolution, index) => {
    if (!isRecord(resolution)) throw createAuthoringError('WB-AUTH-VISUAL-WARNING-RESOLUTION', `Warning resolution ${index + 1} must be an object.`);
    return { code: getRequiredString(resolution, 'code'), resolution: getRequiredString(resolution, 'resolution') };
  });
  if (!isRecord(value.scorecard)) throw createAuthoringError('WB-AUTH-VISUAL-SCORECARD', 'Visual review requires every independent quality score category.');
  const scorecard = Object.fromEntries(AUTHORING_QUALITY_SCORE_CATEGORIES.map((category) => {
    const assessment = value.scorecard[category];
    if (!isRecord(assessment)) throw createAuthoringError('WB-AUTH-VISUAL-SCORECARD', `${category} assessment is required.`);
    const score = Number(assessment.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) throw createAuthoringError('WB-AUTH-VISUAL-SCORECARD', `${category} score must be an integer from zero through 100.`);
    const status = getRequiredString(assessment, 'status');
    if (!AUTHORING_GESTALT_REVIEW_STATUSES.has(status)) throw createAuthoringError('WB-AUTH-VISUAL-SCORECARD', `${category} status must be pass or revise.`);
    return [category, { score, status, note: getRequiredString(assessment, 'note') }];
  }));
  return {
    sourceFile: getRequiredString(value, 'sourceFile'),
    sourceRevision: getRequiredString(value, 'sourceRevision'),
    renderRevision: getRequiredString(value, 'renderRevision'),
    outcome,
    targetReference: getRequiredString(value, 'targetReference'),
    reviewer: {
      kind: 'independent',
      sessionId: getRequiredString(value.reviewer, 'sessionId'),
      method: reviewerMethod,
      reference: getRequiredString(value.reviewer, 'reference'),
    },
    comparisons,
    scorecard,
    blockers: uniqueStrings(Array.isArray(value.blockers) ? value.blockers : []),
    gestaltAssessment,
    refinement: {
      status: refinementStatus,
      changes,
      rationale: getRequiredString(value.refinement, 'rationale'),
      sourceChangesReference: getRequiredString(value.refinement, 'sourceChangesReference'),
    },
    warningResolutions,
    constraintAssessments: normalizeVisualConstraintAssessments(value.constraintAssessments, 'Rendered visual review'),
  };
}

function validateVisualReviewAgainstContract(review, gateway, evidenceStore, projectRoot) {
  const selected = gateway.designEvidence?.options?.find((option) => option.id === gateway.designEvidence?.selectedOptionId);
  if (!selected || review.targetReference !== selected.reference) {
    throw createAuthoringError('WB-AUTH-VISUAL-TARGET-MISMATCH', 'Visual review targetReference must match the selected design option.');
  }
  if (review.reviewer.sessionId === gateway.authoringSessionId) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEWER-NOT-INDEPENDENT', 'The visual reviewer session must differ from the page authoring session.');
  }
  const comparisons = review.comparisons.map((comparison) => {
    if (comparison.evidenceId) {
      const final = getActiveRenderEvidence(evidenceStore, comparison.evidenceId, projectRoot);
      if (final.sourceFile !== review.sourceFile) {
        throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-PAGE', 'Every render receipt must belong to the reviewed page.');
      }
      if (final.phase !== 'final') {
        throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-PHASE', 'A single evidenceId must reference final Workbench render evidence.');
      }
      if (final.sourceRevision !== review.sourceRevision || final.renderRevision !== review.renderRevision) {
        throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-STALE', 'Final evidence must match the current reviewed source and render revisions.');
      }
      return {
        before: null,
        after: withoutPrivateReceiptFields(final),
        mathematicalDelta: null,
        observedAttentionOrder: comparison.observedAttentionOrder,
        findings: comparison.findings,
      };
    }
    const before = getActiveRenderEvidence(evidenceStore, comparison.beforeEvidenceId, projectRoot);
    const after = getActiveRenderEvidence(evidenceStore, comparison.afterEvidenceId, projectRoot);
    if (before.sourceFile !== review.sourceFile || after.sourceFile !== review.sourceFile) {
      throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-PAGE', 'Every render receipt must belong to the reviewed page.');
    }
    if (before.phase !== 'before-refinement' || after.phase !== 'after-refinement') {
      throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-PHASE', 'Each comparison must pair before-refinement evidence with after-refinement evidence.');
    }
    if (after.sourceRevision !== review.sourceRevision || after.renderRevision !== review.renderRevision) {
      throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-STALE', 'After-refinement evidence must match the current reviewed source and render revisions.');
    }
    if (before.sourceRevision === after.sourceRevision || before.renderRevision === after.renderRevision) {
      throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT-REVISION', 'A deliberate refinement requires a fresh source and render revision.');
    }
    if (before.viewport.width !== after.viewport.width || before.viewport.height !== after.viewport.height || before.viewport.deviceScaleFactor !== after.viewport.deviceScaleFactor) {
      throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-VIEWPORT', 'Before and after evidence must use matching viewport dimensions and scale.');
    }
    if (before.capture.renderer !== after.capture.renderer) {
      throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-RENDERER', 'Before and after evidence must come from the same Workbench surface.');
    }
    if (before.artifact.sha256 === after.artifact.sha256) {
      throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT-UNCHANGED', 'Before and after PNG evidence is identical; the required visible refinement is not demonstrated.');
    }
    return {
      before: withoutPrivateReceiptFields(before),
      after: withoutPrivateReceiptFields(after),
      mathematicalDelta: {
        gridScore: after.geometryEvaluation.scores.grid - before.geometryEvaluation.scores.grid,
        uniformPaddingScore: after.geometryEvaluation.scores.uniformPadding - before.geometryEvaluation.scores.uniformPadding,
        opticalBalanceScore: after.geometryEvaluation.scores.opticalBalance - before.geometryEvaluation.scores.opticalBalance,
        violationCount: after.geometryEvaluation.violations.length - before.geometryEvaluation.violations.length,
      },
      observedAttentionOrder: comparison.observedAttentionOrder,
      findings: comparison.findings,
    };
  });
  if (!comparisons.some(({ after }) => after.viewport.width >= 1024) || !comparisons.some(({ after }) => after.viewport.width <= 480)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-RESPONSIVE', 'Visual review must include wide (1024px or wider) and compact (480px or narrower) Workbench evidence.');
  }
  const renderers = new Set(comparisons.map(({ after }) => after.capture.renderer));
  if (![...AUTHORING_RENDERERS].every((renderer) => renderers.has(renderer))) {
    throw createAuthoringError('WB-AUTH-VISUAL-REVIEW-SURFACES', 'Accepted handoff evidence must include both Workbench Browser Preview and Workbench Design Canvas.');
  }
  if (review.refinement.status === 'not-required' && comparisons.some(({ before }) => before !== null)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'A not-required refinement must use direct final evidence instead of a before/after comparison.');
  }
  if (review.refinement.status === 'completed' && comparisons.some(({ before }) => before === null)) {
    throw createAuthoringError('WB-AUTH-VISUAL-REFINEMENT', 'A completed refinement must use before/after evidence for every observation.');
  }
  if (review.outcome === 'accept') {
    validateVisualConstraintAssessments({
      assessments: review.constraintAssessments,
      constraints: gateway.requirements?.visualComposition?.constraints,
      label: 'Rendered visual review',
      requirePass: true,
    });
    const primaryFocus = gateway.visualHierarchy?.primaryFocus;
    if (review.comparisons.some((viewport) => viewport.observedAttentionOrder[0] !== primaryFocus)) {
      throw createAuthoringError('WB-AUTH-VISUAL-ATTENTION-MISMATCH', 'Every accepted viewport must show the planned primary focus as the first observed attention target.');
    }
    const failedPrinciples = AUTHORING_GESTALT_PRINCIPLES.filter((principle) => review.gestaltAssessment[principle]?.status !== 'pass');
    if (failedPrinciples.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-GESTALT-FAILED', `Accepted visual reviews must pass every planned Gestalt principle: ${failedPrinciples.join(', ')}.`);
    }
    const warningCodes = uniqueStrings((gateway.visualSignals?.warnings ?? []).map((warning) => warning.code));
    const hardCompositionWarnings = warningCodes.filter((code) => AUTHORING_NON_BYPASSABLE_VISUAL_WARNING_CODES.has(code));
    if (hardCompositionWarnings.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-COMPOSITION-SOURCE-FAILED', `Accepted reviews cannot waive confirmed visual-composition violations detected in source: ${hardCompositionWarnings.join(', ')}. Revise and re-apply the page.`);
    }
    const resolutionCodes = new Set(review.warningResolutions.map((resolution) => resolution.code));
    const unresolved = warningCodes.filter((code) => !resolutionCodes.has(code));
    if (unresolved.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-WARNINGS-UNRESOLVED', `Accepted visual reviews must resolve every generated visual warning: ${unresolved.join(', ')}.`);
    }
    const objectiveFailures = comparisons.flatMap(({ after }) => getRenderEvidenceFailures(after));
    if (objectiveFailures.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-OBJECTIVE-FAILED', `Accepted visual reviews require zero objective render blockers: ${uniqueStrings(objectiveFailures).join(', ')}.`);
    }
    const mathematicalFailures = comparisons.flatMap(({ after }) => after.geometryEvaluation.passed ? [] : after.geometryEvaluation.violations);
    if (mathematicalFailures.length > 0) {
      const codes = uniqueStrings(mathematicalFailures.map((failure) => failure.code));
      throw createAuthoringError('WB-AUTH-MATHEMATICAL-QUALITY-FAILED', `Accepted visual reviews require zero server-computed geometry violations: ${codes.join(', ')}.`, mathematicalFailures);
    }
    const failedScores = AUTHORING_QUALITY_SCORE_CATEGORIES.filter((category) => review.scorecard[category].status !== 'pass' || review.scorecard[category].score < AUTHORING_QUALITY_SCORE_THRESHOLD);
    if (failedScores.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-SCORE-FAILED', `Every quality category must pass at ${AUTHORING_QUALITY_SCORE_THRESHOLD} or higher: ${failedScores.join(', ')}.`);
    }
    if (review.blockers.length > 0) {
      throw createAuthoringError('WB-AUTH-VISUAL-BLOCKERS', 'Accepted visual reviews cannot contain unresolved blockers.');
    }
  } else {
    validateVisualConstraintAssessments({
      assessments: review.constraintAssessments,
      constraints: gateway.requirements?.visualComposition?.constraints,
      label: 'Rendered visual review',
      requirePass: false,
    });
  }
  return comparisons;
}

function normalizeApplyInput(input) {
  if (!isRecord(input)) throw createAuthoringError('WB-AUTH-APPLY-INVALID', 'Authoring apply input must be an object.');
  return {
    planId: getRequiredString(input, 'planId'),
    root: input.root,
  };
}

function analyzeAuthoringVisualSignals({ catalog, root, visualHierarchy, visualComposition }) {
  const catalogById = new Map(catalog.map((component) => [component.id, component]));
  const summary = {
    totalNodes: 0,
    componentInstances: 0,
    badgeInstances: 0,
    cardLikeInstances: 0,
    borderedNodes: 0,
    outlinedContainerNodes: 0,
    dividerNodes: 0,
    verticalDividerNodes: 0,
    surfaceRegionNodes: 0,
    persistentRegionNodes: 0,
    fullHeightPartitionNodes: 0,
    overlayInstances: 0,
    strongTypographyNodes: 0,
    accentNodes: 0,
  };

  const visit = (node) => {
    if (!isRecord(node)) return;
    summary.totalNodes += 1;
    if (node.kind === 'component' || node.kind === 'runtime') {
      summary.componentInstances += 1;
      const componentName = catalogById.get(node.componentId)?.importName ?? '';
      if (/Badge$/.test(componentName)) summary.badgeInstances += 1;
      if (/(?:Card|Alert)$/.test(componentName)) summary.cardLikeInstances += 1;
      if (/(?:Dialog|AlertDialog|Drawer|Sheet|Modal)$/.test(componentName)) summary.overlayInstances += 1;
    }
    const className = typeof node.props?.className === 'string' ? node.props.className : '';
    const tokens = className.split(/\s+/).filter(Boolean);
    const baseTokens = tokens.filter((token) => !token.includes(':'));
    const hasOutline = baseTokens.some((token) => /^(?:border|border-x|border-y|ring|outline)(?:$|-)/.test(token) && !/^(?:border-0|border-transparent|ring-0|ring-transparent|outline-0|outline-none|outline-transparent)$/.test(token));
    const hasDivider = baseTokens.some((token) => /^(?:border-[tblr]|divide-[xy])(?:$|-)/.test(token));
    const hasVerticalDivider = baseTokens.some((token) => /^(?:border-[lr]|divide-x)(?:$|-)/.test(token));
    const hasSurfaceFill = baseTokens.some((token) => /^bg-(?!transparent$)/.test(token));
    const isSemanticRegion = ['article', 'aside', 'footer', 'header', 'main', 'nav', 'section'].includes(node.tag);
    const isPersistent = baseTokens.some((token) => ['fixed', 'sticky'].includes(token));
    const isFullHeight = baseTokens.some((token) => /^(?:h-screen|min-h-screen|h-full|min-h-full|inset-y-0)$/.test(token));
    if (hasOutline || hasDivider) summary.borderedNodes += 1;
    if (hasOutline) summary.outlinedContainerNodes += 1;
    if (hasDivider) summary.dividerNodes += 1;
    if (hasVerticalDivider) summary.verticalDividerNodes += 1;
    if (hasSurfaceFill && isSemanticRegion) summary.surfaceRegionNodes += 1;
    if (isPersistent && isSemanticRegion) summary.persistentRegionNodes += 1;
    if (isFullHeight && isSemanticRegion && node.tag !== 'main') summary.fullHeightPartitionNodes += 1;
    if (tokens.some((token) => /^(?:font-semibold|font-bold|font-extrabold)$/.test(token))) summary.strongTypographyNodes += 1;
    if (tokens.some((token) => /(?:^|:)(?:bg|text|border|ring)-(?:primary|destructive|accent)(?:$|\/|-)/.test(token))) summary.accentNodes += 1;
    for (const child of normalizeChildren(node.children)) visit(child);
  };
  visit(root);

  const warnings = [];
  const borderedLimit = Math.max(12, Math.ceil(summary.totalNodes * 0.18));
  if (summary.borderedNodes > borderedLimit) {
    warnings.push({
      code: 'WB-AUTH-VISUAL-OVERBOXED',
      message: `The composition uses border utilities on ${summary.borderedNodes} of ${summary.totalNodes} nodes. Re-evaluate common-region overuse and prefer spacing, alignment, or lightweight dividers.`,
      observed: summary.borderedNodes,
      recommendedMaximum: borderedLimit,
    });
  }
  if (summary.badgeInstances > 8) {
    warnings.push({
      code: 'WB-AUTH-VISUAL-BADGE-SATURATION',
      message: `The composition uses ${summary.badgeInstances} Badge instances. Repeated status pills can flatten hierarchy and make every label compete for attention.`,
      observed: summary.badgeInstances,
      recommendedMaximum: 8,
    });
  }
  const strongTypographyLimit = Math.max(12, visualHierarchy.attentionOrder.length * 4);
  if (summary.strongTypographyNodes > strongTypographyLimit) {
    warnings.push({
      code: 'WB-AUTH-VISUAL-TYPE-FLAT',
      message: `The composition uses strong font weight on ${summary.strongTypographyNodes} nodes. Reserve strong weight for the planned attention order and reduce competing labels.`,
      observed: summary.strongTypographyNodes,
      recommendedMaximum: strongTypographyLimit,
    });
  }
  const accentLimit = visualHierarchy.emphasis.highEmphasisLimit * 3;
  if (summary.accentNodes > accentLimit) {
    warnings.push({
      code: 'WB-AUTH-VISUAL-EMPHASIS-SPREAD',
      message: `The composition uses accent or destructive color utilities on ${summary.accentNodes} nodes, exceeding the emphasis budget derived from ${visualHierarchy.emphasis.highEmphasisLimit} high-emphasis region(s).`,
      observed: summary.accentNodes,
      recommendedMaximum: accentLimit,
    });
  }
  if (isRecord(visualComposition)) {
    const limits = isRecord(visualComposition.limits) ? visualComposition.limits : {};
    const allowedSurfaceRegions = Number(limits.contentSurfaceCount ?? 0) + Number(limits.persistentRegionCount ?? 0);
    if (Number.isFinite(allowedSurfaceRegions) && summary.surfaceRegionNodes > allowedSurfaceRegions) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-SURFACE-SATURATION',
        message: `The composition creates ${summary.surfaceRegionNodes} background-bearing semantic regions, exceeding the confirmed content plus persistent surface limit of ${allowedSurfaceRegions}. Use one continuous content surface unless the requirements explicitly allow another region.`,
        observed: summary.surfaceRegionNodes,
        recommendedMaximum: allowedSurfaceRegions,
      });
    }
    if (summary.persistentRegionNodes > Number(limits.persistentRegionCount ?? 0)) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-PERSISTENT-REGIONS',
        message: `The composition creates ${summary.persistentRegionNodes} fixed or sticky semantic regions, exceeding the confirmed limit of ${limits.persistentRegionCount}.`,
        observed: summary.persistentRegionNodes,
        recommendedMaximum: Number(limits.persistentRegionCount ?? 0),
      });
    }
    if (summary.fullHeightPartitionNodes > Number(limits.fullHeightPartitionCount ?? 0)) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-FULL-HEIGHT-PARTITIONS',
        message: `The composition creates ${summary.fullHeightPartitionNodes} full-height content partitions, exceeding the confirmed limit of ${limits.fullHeightPartitionCount}. Do not turn contextual information into permanent columns.`,
        observed: summary.fullHeightPartitionNodes,
        recommendedMaximum: Number(limits.fullHeightPartitionCount ?? 0),
      });
    }
    if (summary.outlinedContainerNodes > Number(limits.outlinedContainerCount ?? 0)) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-OUTLINED-CONTAINERS',
        message: `The composition creates ${summary.outlinedContainerNodes} outlined containers, exceeding the confirmed limit of ${limits.outlinedContainerCount}. Reserve borders for the approved divider policy.`,
        observed: summary.outlinedContainerNodes,
        recommendedMaximum: Number(limits.outlinedContainerCount ?? 0),
      });
    }
    if (summary.cardLikeInstances > Number(limits.cardCount ?? 0)) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-CARD-POLICY',
        message: `The composition uses ${summary.cardLikeInstances} Card or Alert surfaces, exceeding the confirmed limit of ${limits.cardCount}. Use spacing and grouping for non-independent content.`,
        observed: summary.cardLikeInstances,
        recommendedMaximum: Number(limits.cardCount ?? 0),
      });
    }
    if (visualComposition.overlayPolicy === 'none' && summary.overlayInstances > 0) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-OVERLAY-POLICY',
        message: `The composition uses ${summary.overlayInstances} overlay component(s) even though the confirmed overlay policy is none.`,
        observed: summary.overlayInstances,
        recommendedMaximum: 0,
      });
    }
    if (visualComposition.dividerPolicy === 'none' && summary.dividerNodes > 0) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-DIVIDER-POLICY',
        message: `The composition uses ${summary.dividerNodes} divider node(s) even though the confirmed divider policy is none.`,
        observed: summary.dividerNodes,
        recommendedMaximum: 0,
      });
    }
    if (visualComposition.surfaceModel === 'single-surface' && summary.verticalDividerNodes > 0) {
      warnings.push({
        code: 'WB-AUTH-VISUAL-VERTICAL-PARTITIONS',
        message: `The composition uses ${summary.verticalDividerNodes} vertical divider node(s) inside a confirmed single-surface layout. Separate information through spacing and alignment instead of column boundaries.`,
        observed: summary.verticalDividerNodes,
        recommendedMaximum: 0,
      });
    }
  }
  return { summary, warnings };
}

function compileAuthoringPage({ catalog, exportName, root, sourceFile }) {
  const catalogById = new Map(catalog.map((component) => [component.id, component]));
  const importsByKey = new Map();
  const usedLocalNames = new Map();
  const violations = [];
  const compileNode = (node, path, parentComponent = null) => {
    if (!isRecord(node) || typeof node.kind !== 'string') {
      violations.push(createViolation('WB-AUTH-NODE-INVALID', path, 'Every authoring node must be an object with a supported kind.'));
      return '<div />';
    }

    if (node.kind === 'text') {
      if (typeof node.value !== 'string') {
        violations.push(createViolation('WB-AUTH-TEXT-INVALID', path, 'Text nodes require a string value.'));
        return `{${JSON.stringify('')}}`;
      }
      return `{${JSON.stringify(node.value)}}`;
    }

    if (node.kind === 'element') {
      const tag = typeof node.tag === 'string' ? node.tag.trim().toLowerCase() : '';
      const purpose = typeof node.purpose === 'string' ? node.purpose.trim() : '';
      if (!AUTHORING_NATIVE_TAGS.has(tag)) {
        violations.push(createViolation(
          'WB-AUTH-NATIVE-UNSUPPORTED',
          path,
          `<${tag}> is not available in the native editable authoring surface.`,
        ));
      }
      if (!AUTHORING_NATIVE_PURPOSES.has(purpose)) {
        violations.push(createViolation('WB-AUTH-PURPOSE-INVALID', path, 'Native elements require purpose: layout, content, semantic, or decoration.'));
      }
      const children = normalizeChildren(node.children);
      return formatJsxElement(
        tag || 'div',
        formatProps(node.props, path, violations, { native: true }),
        children.map((child, index) => compileNode(child, `${path}.children[${index}]`)),
      );
    }

    if (node.kind === 'component' || node.kind === 'runtime') {
      const componentId = typeof node.componentId === 'string' ? node.componentId.trim() : '';
      const component = catalogById.get(componentId);
      if (!component) {
        violations.push(createViolation('WB-AUTH-COMPONENT-UNKNOWN', path, `Component ${componentId || '(missing)'} is not registered in the active project.`));
        return '<div />';
      }
      if (parentComponent?.authoring.allowedChildren.length > 0 && !parentComponent.authoring.allowedChildren.includes(component.importName)) {
        violations.push(createViolation(
          'WB-AUTH-CHILD-DISALLOWED',
          path,
          `${component.importName} is not an allowed child of ${parentComponent.importName}.`,
        ));
      }
      if (node.kind === 'runtime') {
        const runtimeClass = typeof node.runtimeClass === 'string' ? node.runtimeClass.trim() : '';
        if (!component.authoring.runtimeClass || component.authoring.runtimeClass !== runtimeClass) {
          violations.push(createViolation(
            'WB-AUTH-RUNTIME-UNAPPROVED',
            path,
            `${component.name} is not registered as runtime class ${runtimeClass || '(missing)'}.`,
          ));
        }
      } else if (component.authoring.runtimeClass) {
        violations.push(createViolation(
          'WB-AUTH-RUNTIME-KIND-REQUIRED',
          path,
          `${component.name} is a registered ${component.authoring.runtimeClass} runtime boundary and must use kind: runtime.`,
        ));
      }
      const intent = typeof node.intent === 'string' ? node.intent.trim() : '';
      if (intent && component.authoring.roles.length > 0 && !component.authoring.roles.includes(intent)) {
        violations.push(createViolation('WB-AUTH-COMPONENT-INTENT-MISMATCH', path, `${component.name} does not declare the requested intent ${intent}.`));
      }

      const importKey = `${component.sourceFile}#${component.importName}`;
      let localName = importsByKey.get(importKey)?.localName;
      if (!localName) {
        localName = createUniqueLocalName(component.importName, usedLocalNames);
        importsByKey.set(importKey, { component, localName });
      }
      const children = normalizeChildren(node.children);
      const componentProps = resolveComponentAuthoringProps(component, node.props, children, path, violations);
      return formatJsxElement(
        localName,
        formatProps(componentProps, path, violations, { native: false }),
        children.map((child, index) => compileNode(child, `${path}.children[${index}]`, component)),
      );
    }

    violations.push(createViolation('WB-AUTH-NODE-KIND', path, `Unsupported authoring node kind: ${node.kind}.`));
    return '<div />';
  };

  const body = compileNode(root, 'root');
  const blocking = violations.filter((violation) => AUTHORING_BLOCKING_COMPOSITION_CODES.has(violation.code));
  const advisories = violations.filter((violation) => !AUTHORING_BLOCKING_COMPOSITION_CODES.has(violation.code));
  if (blocking.length > 0) {
    throw createAuthoringError(
      'WB-AUTH-COMPOSITION-REJECTED',
      `Page composition was rejected by the Workbench authoring contract: ${blocking.map((violation) => `${violation.code} at ${violation.path}`).join('; ')}.`,
      violations,
    );
  }

  const imports = [...importsByKey.values()]
    .sort((left, right) => left.component.sourceFile.localeCompare(right.component.sourceFile) || left.component.importName.localeCompare(right.component.importName))
    .map(({ component, localName }) => {
      const specifier = createRelativeImportSpecifier(sourceFile, component.sourceFile);
      const imported = localName === component.importName ? component.importName : `${component.importName} as ${localName}`;
      return `import { ${imported} } from ${JSON.stringify(specifier)};`;
    });
  const contents = [
    '// Generated through the Workbench authoring gateway.',
    ...imports,
    imports.length > 0 ? '' : null,
    `export default function ${exportName}() {`,
    '  return (',
    indentMultiline(body, 4),
    '  );',
    '}',
    '',
  ].filter((line) => line !== null).join('\n');

  return { contents, advisories };
}

function formatJsxElement(tag, props, children) {
  if (children.length === 0) return `<${tag}${props} />`;
  return [
    `<${tag}${props}>`,
    ...children.map((child) => indentMultiline(child, 2)),
    `</${tag}>`,
  ].join('\n');
}

function formatProps(value, path, violations, { native }) {
  if (value === undefined) return '';
  if (!isRecord(value)) {
    violations.push(createViolation('WB-AUTH-PROPS-INVALID', path, 'Node props must be an object of literal values.'));
    return '';
  }
  return Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([name, propValue]) => {
    if (!AUTHORING_PROP_NAME_PATTERN.test(name)) {
      violations.push(createViolation('WB-AUTH-PROP-NAME', path, `Unsupported prop name: ${name}.`));
      return '';
    }
    if (/^on[A-Z]/.test(name) || name === 'style' || name === 'dangerouslySetInnerHTML' || /^render[A-Z]/.test(name)) {
      violations.push(createViolation('WB-AUTH-PROP-OPAQUE', path, `${name} is not available in structured page authoring.`));
      return '';
    }
    if (native && name === 'children') {
      violations.push(createViolation('WB-AUTH-PROP-CHILDREN', path, 'Native children must be expressed as authoring child nodes.'));
      return '';
    }
    if (propValue === null || propValue === undefined) return '';
    if (propValue === true) return ` ${name}`;
    if (propValue === false) return ` ${name}={false}`;
    if (typeof propValue === 'string' || typeof propValue === 'number') return ` ${name}={${JSON.stringify(propValue)}}`;
    violations.push(createViolation('WB-AUTH-PROP-NONLITERAL', path, `${name} must be a string, number, or boolean literal.`));
    return '';
  }).join('');
}

function resolveComponentAuthoringProps(component, input, children, path, violations) {
  const authoredProps = input === undefined ? {} : input;
  if (!isRecord(authoredProps)) return authoredProps;
  const contracts = new Map((Array.isArray(component.props) ? component.props : []).map((prop) => [prop.name, prop]));
  const defaults = isRecord(component.sourceInsert?.props) ? component.sourceInsert.props : {};
  const resolved = {
    ...defaults,
    ...authoredProps,
  };
  if (children.length > 0 && !Object.prototype.hasOwnProperty.call(authoredProps, 'children')) delete resolved.children;

  for (const [name, value] of Object.entries(authoredProps)) {
    const contract = contracts.get(name);
    const isGlobal = AUTHORING_GLOBAL_COMPONENT_PROPS.has(name) || name.startsWith('aria-') || name.startsWith('data-');
    if (!contract && !isGlobal) {
      violations.push(createViolation(
        'WB-AUTH-COMPONENT-PROP-UNKNOWN',
        `${path}.props.${name}`,
        `${name} is not exposed by ${component.name} sourceInsert.props. Update the component story contract before authoring this prop.`,
      ));
      continue;
    }
    if (!contract) continue;
    if (Array.isArray(contract.options) && contract.options.length > 0 && !contract.options.some((option) => Object.is(option, value))) {
      violations.push(createViolation(
        'WB-AUTH-COMPONENT-PROP-OPTION',
        `${path}.props.${name}`,
        `${component.name}.${name} must be one of: ${contract.options.map((option) => JSON.stringify(option)).join(', ')}.`,
      ));
    }
    if (Array.isArray(contract.valueTypes) && contract.valueTypes.length > 0 && value !== null && value !== undefined && !contract.valueTypes.includes(typeof value)) {
      violations.push(createViolation(
        'WB-AUTH-COMPONENT-PROP-TYPE',
        `${path}.props.${name}`,
        `${component.name}.${name} must use ${contract.valueTypes.join(' or ')}.`,
      ));
    }
  }

  for (const contract of contracts.values()) {
    if (contract.required === true && !Object.prototype.hasOwnProperty.call(resolved, contract.name)) {
      violations.push(createViolation(
        'WB-AUTH-COMPONENT-PROP-REQUIRED',
        `${path}.props.${contract.name}`,
        `${component.name}.${contract.name} is required by the component story contract.`,
      ));
    }
  }
  return resolved;
}

function analyzeAuthoringSource({ catalog, contents, exportName, sourceFile }) {
  let ast;
  try {
    ast = parse(contents, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: false,
    });
  } catch (error) {
    return {
      ok: false,
      sourceFile,
      violations: [createViolation('WB-AUTH-PARSE', 'source', error instanceof Error ? error.message : 'Source could not be parsed.')],
      warnings: [],
      warningPolicy: createAuthoringWarningPolicy([]),
      summary: createEmptyAnalysisSummary(),
    };
  }

  const violations = [];
  const warnings = [];
  const summary = createEmptyAnalysisSummary();
  const registrySourceFiles = new Set(catalog.map((component) => normalizeProjectPath(component.sourceFile)));
  const registeredLocalNames = new Set();
  const bareImportLocalNames = new Set();

  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration') continue;
    const source = statement.source.value;
    const resolvedImport = source.startsWith('.') ? resolveRelativeProjectImport(sourceFile, source) : null;
    const registered = resolvedImport && [...registrySourceFiles].some((candidate) => stripSourceExtension(candidate) === stripSourceExtension(resolvedImport));
    for (const specifier of statement.specifiers) {
      if (registered) registeredLocalNames.add(specifier.local.name);
      if (!source.startsWith('.') && !source.startsWith('/')) bareImportLocalNames.add(specifier.local.name);
    }
  }

  walkAst(ast.program, (node, parent) => {
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression' && !node.callee.computed && node.callee.property?.type === 'Identifier' && node.callee.property.name === 'map') {
      summary.mapExpressions += 1;
      warnings.push(createAuthoringWarning(
        'WB-AUTH-MAP-BOUNDARY',
        getNodeLocation(node),
        'This repeated region may be represented as a source or Binding boundary.',
        {
          impact: 'Runtime rendering remains valid, but items that cannot be statically projected may not appear as independently editable Layers nodes.',
          guidance: [
            'Keep the map when the collection is genuinely data-driven; verify one representative item in Design canvas and expose the collection through Binding or source.',
            'Use explicit JSX when the items are fixed design composition and each item must be selected, reordered, deleted, or restyled independently.',
            'Extract or register a component only when deeper Inspector prop editing is useful; registration is not required merely to clear this warning.',
          ],
          acceptableWhen: 'The repeated region is intentionally data-driven and its visible result plus collection boundary are understandable in Design canvas.',
        },
      ));
    }
    if (node.type === 'JSXAttribute' && node.name?.type === 'JSXIdentifier' && (node.name.name === 'style' || node.name.name === 'dangerouslySetInnerHTML' || /^on[A-Z]/.test(node.name.name))) {
      summary.opaqueProps += 1;
      warnings.push(createAuthoringWarning(
        'WB-AUTH-EXPRESSION-BOUNDARY',
        getNodeLocation(node),
        `${node.name.name} may remain source- or Binding-edited when it cannot be decomposed safely in the Inspector.`,
        {
          impact: 'The page can render correctly while this value remains read-only or expression-backed in Inspector.',
          guidance: [
            'Keep event handlers and runtime geometry in source when they are implementation behavior rather than designer controls.',
            'Expose a semantic component prop, token binding, or literal className only when the value is a recurring designer-owned choice.',
          ],
          acceptableWhen: 'The expression is runtime behavior or geometry and the designer-relevant visual result remains selectable and understandable.',
        },
      ));
    }
    if (node.type === 'JSXOpeningElement') {
      const name = getJsxName(node.name);
      if (!name) return;
      if (/^[a-z]/.test(name)) {
        summary.nativeElements += 1;
      } else if (registeredLocalNames.has(name)) {
        summary.registeredComponentInstances += 1;
      } else {
        summary.unregisteredComponentInstances += 1;
        const reason = bareImportLocalNames.has(name)
          ? `${name} is rendered from a bare package import instead of a registered Workbench component.`
          : `${name} does not resolve to a registered Workbench component.`;
        warnings.push(createAuthoringWarning(
          'WB-AUTH-COMPONENT-BOUNDARY',
          getNodeLocation(node),
          `${reason} Keep the boundary visible and source-editable; register it only if deeper Inspector editing is useful.`,
          {
            impact: 'The component remains a source boundary and may expose fewer Inspector controls than a registered project component.',
            guidance: [
              'Keep the boundary when its internal implementation is not part of the requested design edit.',
              'Add a project-owned wrapper and story contract when designers need stable semantic props or deeper selection.',
            ],
            acceptableWhen: 'The boundary is visible in Layers and the requested editing task does not require its internals.',
          },
        ));
      }
    }
    if (isFunctionLike(node) && containsJsx(node.body)) {
      const name = getFunctionName(node, parent);
      if (!isAllowedPageFunction(node, parent, name, exportName)) {
        summary.localJsxFunctions += 1;
        warnings.push(createAuthoringWarning(
          'WB-AUTH-LOCAL-JSX-BOUNDARY',
          getNodeLocation(node),
          `${name || 'Anonymous JSX function'} is a local source boundary.`,
          {
            impact: 'Workbench may project the helper output while keeping some internals source-only.',
            guidance: [
              'Keep the helper when it improves source clarity and representative output is visible in Design canvas.',
              'Move stable designer-owned controls into component props or explicit JSX only when the requested edit needs that depth.',
            ],
            acceptableWhen: 'The helper output is visually understandable and the source boundary is intentional.',
          },
        ));
      }
    }
  });

  return {
    ok: violations.length === 0,
    sourceFile,
    violations,
    warnings,
    warningPolicy: createAuthoringWarningPolicy(warnings),
    summary,
  };
}

function createEmptyAnalysisSummary() {
  return {
    localJsxFunctions: 0,
    mapExpressions: 0,
    nativeElements: 0,
    opaqueProps: 0,
    registeredComponentInstances: 0,
    unregisteredComponentInstances: 0,
  };
}

function walkAst(node, visitor, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visitor(node, parent);
  const keys = VISITOR_KEYS[node.type] ?? [];
  for (const key of keys) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) walkAst(child, visitor, node);
    } else {
      walkAst(value, visitor, node);
    }
  }
}

function containsJsx(node) {
  let found = false;
  walkAst(node, (candidate) => {
    if (candidate.type === 'JSXElement' || candidate.type === 'JSXFragment') found = true;
  });
  return found;
}

function isFunctionLike(node) {
  return node?.type === 'FunctionDeclaration' || node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression';
}

function getFunctionName(node, parent) {
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') return node.id?.name ?? null;
  return parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier' ? parent.id.name : null;
}

function isAllowedPageFunction(node, parent, name, exportName) {
  if (exportName && name === exportName) return true;
  if (node.type === 'FunctionDeclaration' && parent?.type === 'ExportDefaultDeclaration') return true;
  if (node.type === 'FunctionDeclaration' && parent?.type === 'ExportNamedDeclaration' && AUTHORING_COMPONENT_NAME_PATTERN.test(name ?? '')) return true;
  return false;
}

function getJsxName(node) {
  if (node?.type === 'JSXIdentifier') return node.name;
  if (node?.type === 'JSXMemberExpression') return `${getJsxName(node.object)}.${getJsxName(node.property)}`;
  return null;
}

function upsertAuthoringPage(pages, plan) {
  const existingPages = Array.isArray(pages?.pages) ? pages.pages : [];
  const existing = existingPages.find((page) => page.sourceFile === plan.sourceFile || page.route === plan.route);
  const nextPage = {
    id: existing?.id ?? `page-${slugify(plan.pageName)}-${createHash('sha256').update(plan.sourceFile).digest('hex').slice(0, 8)}`,
    name: plan.pageName,
    route: plan.route,
    sourceFile: plan.sourceFile,
    rootNodeId: existing?.rootNodeId ?? `root-${slugify(plan.pageName)}`,
    status: existing?.status === 'ready' ? 'ready' : 'draft',
    extensions: {
      ...(isRecord(existing?.extensions) ? existing.extensions : {}),
      authoringGateway: {
        version: AUTHORING_GATEWAY_VERSION,
        sourceRevision: plan.revision,
        renderRevision: plan.renderRevision,
        authoringSessionId: plan.authoringSessionId,
        requirementsId: plan.requirementsId ?? null,
        approvedPromptId: plan.approvedPromptId ?? null,
        refinementAttempt: plan.refinementAttempt ?? 0,
        requirements: plan.requirements ?? null,
        designEvidence: plan.designEvidence ?? null,
        visualHierarchy: plan.visualHierarchy ?? null,
        geometryContract: plan.geometryContract ?? null,
        visualSignals: plan.visualSignals,
        visualReview: null,
        visualApproval: null,
      },
    },
  };
  return {
    schemaVersion: pages?.schemaVersion ?? '0.1',
    pages: [...existingPages.filter((page) => page.id !== existing?.id && page.sourceFile !== plan.sourceFile && page.route !== plan.route), nextPage],
    extensions: isRecord(pages?.extensions) ? pages.extensions : {},
  };
}

function resolveAuthoringPagePath(projectRoot, sourceFile, pages, options = {}) {
  const normalized = normalizeProjectPath(sourceFile);
  if (normalized.split('/').includes('..') || normalized.split('/').includes('.workbench')) {
    throw createAuthoringError('WB-AUTH-PAGE-PATH', 'Authoring page path contains a protected or traversal segment.');
  }
  if (AUTHORING_COMPONENT_ROOTS.some((root) => normalized === root || normalized.startsWith(`${root}/`)) || /\.stories\.(?:jsx|tsx)$/i.test(normalized)) {
    throw createAuthoringError('WB-AUTH-COMPONENT-PATH', 'Page authoring cannot write component, library, or story source paths. Component work requires a separate user-approved workflow.');
  }
  if (!AUTHORING_SOURCE_EXTENSION_PATTERN.test(normalized)) {
    throw createAuthoringError('WB-AUTH-PAGE-EXTENSION', 'Authoring pages must be .tsx or .jsx files.');
  }
  const isRegisteredPage = Array.isArray(pages?.pages) && pages.pages.some((page) => normalizeProjectPath(page?.sourceFile ?? '') === normalized);
  if (!isRegisteredPage && !(normalized === AUTHORING_PAGE_ROOT || normalized.startsWith(`${AUTHORING_PAGE_ROOT}/`))) {
    throw createAuthoringError('WB-AUTH-PAGE-PATH', `New authoring pages must live under ${AUTHORING_PAGE_ROOT}.`);
  }
  if (options.validateOnly) return normalized;
  const root = resolve(projectRoot);
  const filePath = resolve(root, normalized);
  const relativePath = relative(root, filePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || relativePath.split(sep).some((part) => ['.git', '.workbench', 'node_modules'].includes(part))) {
    throw createAuthoringError('WB-AUTH-PAGE-PATH', 'Authoring page path escapes the active project source boundary.');
  }
  return filePath;
}

function resolveProjectMetadataPath(projectRoot, configuredPath, fallback) {
  const normalized = normalizeProjectPath(typeof configuredPath === 'string' && configuredPath.trim() ? configuredPath : fallback);
  const filePath = resolve(projectRoot, normalized);
  const relativePath = relative(projectRoot, filePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
    throw createAuthoringError('WB-AUTH-METADATA-PATH', 'Workbench metadata path escapes the active project.');
  }
  return filePath;
}

async function readSourceRevision(filePath) {
  try {
    await access(filePath);
    return createContentRevision(await readFile(filePath, 'utf8'));
  } catch {
    return 'missing';
  }
}

function createContentRevision(contents) {
  return `sha256:${createHash('sha256').update(contents).digest('hex')}`;
}

async function createAuthoringRenderRevision(project, sourceFile, sourceContents) {
  const tailwind = isRecord(project.config?.extensions?.tailwind) ? project.config.extensions.tailwind : {};
  const dependencyPaths = uniqueStrings([
    project.config?.paths?.tokenCss ?? 'src/workbench-tokens.css',
    tailwind.sourceCss,
    tailwind.compiledCss,
    tailwind.tokenCss,
    'src/site.css',
    'src/index.css',
    'src/workbench-shadcn.css',
    'src/components/local.css',
    ...project.catalog.map((component) => component.sourceFile),
  ]).filter((path) => normalizeProjectPath(path) !== normalizeProjectPath(sourceFile));
  const dependencies = [];
  const queue = [...dependencyPaths];
  const visited = new Set();
  for (let index = 0; index < queue.length && index < 500; index += 1) {
    const normalized = normalizeProjectPath(queue[index]);
    if (visited.has(normalized)) continue;
    visited.add(normalized);
    if (!normalized || normalized.split('/').includes('..')) continue;
    const absolute = resolve(project.root, normalized);
    const relativePath = relative(project.root, absolute);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`)) continue;
    try {
      const bytes = await readFile(absolute);
      dependencies.push([normalized, createContentRevision(bytes)]);
      if (/\.(?:css|jsx?|tsx?)$/i.test(normalized)) {
        const text = bytes.toString('utf8');
        const specifiers = [];
        for (const pattern of [/\b(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]/g, /@import\s+(?:url\()?['\"]([^'\"]+)['\"]/g]) {
          let match;
          while ((match = pattern.exec(text))) specifiers.push(match[1]);
        }
        for (const specifier of specifiers.filter((value) => value.startsWith('.'))) {
          const imported = await resolveExistingRenderDependency(project.root, posix.normalize(posix.join(posix.dirname(normalized), specifier)));
          if (imported && !visited.has(imported)) queue.push(imported);
        }
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
      dependencies.push([normalized, '<missing>']);
    }
  }
  let tokenRegistry = '<missing>';
  let assetRegistry = '<missing>';
  try {
    tokenRegistry = createContentRevision(await readFile(project.tokensPath));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  try {
    assetRegistry = createContentRevision(await readFile(project.assetsPath));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return createContentRevision(JSON.stringify({
    sourceFile: normalizeProjectPath(sourceFile),
    sourceContents,
    catalog: project.catalog,
    config: project.config,
    tokenRegistry,
    assetRegistry,
    dependencies,
  }));
}

async function resolveExistingRenderDependency(projectRoot, requestedPath) {
  const normalized = normalizeProjectPath(requestedPath);
  if (!normalized || normalized.split('/').includes('..')) return null;
  const candidates = /\.[A-Za-z0-9]+$/.test(normalized)
    ? [normalized]
    : [normalized, ...['.ts', '.tsx', '.js', '.jsx', '.css', '.json'].map((extension) => `${normalized}${extension}`), ...['ts', 'tsx', 'js', 'jsx'].map((extension) => `${normalized}/index.${extension}`)];
  for (const candidate of candidates) {
    const absolute = resolve(projectRoot, candidate);
    const relativePath = relative(projectRoot, absolute);
    if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`)) continue;
    try {
      await access(absolute);
      return candidate;
    } catch {
      // Try the next supported project-local source shape.
    }
  }
  return null;
}

function inspectPngArtifact(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(signature)) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'Render evidence does not contain a valid PNG signature.');
  }
  let offset = 8;
  let header = null;
  const imageData = [];
  let ended = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.length) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG contains a truncated chunk.');
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === 'IHDR') {
      if (header || length !== 13) throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG must contain one valid IHDR chunk.');
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      imageData.push(data);
    } else if (type === 'IEND') {
      ended = true;
      break;
    }
    offset = dataEnd + 4;
  }
  if (!header || !ended || imageData.length === 0 || header.width === 0 || header.height === 0) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG must contain IHDR, pixel data, and IEND chunks.');
  }
  const channels = header.colorType === 6 ? 4 : header.colorType === 2 ? 3 : header.colorType === 0 ? 1 : 0;
  if (header.bitDepth !== 8 || channels === 0 || header.compression !== 0 || header.filter !== 0 || header.interlace !== 0) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG evidence must be a non-interlaced 8-bit grayscale, RGB, or RGBA capture.');
  }
  const expectedInflatedBytes = header.height * (1 + header.width * channels);
  if (expectedInflatedBytes > 160 * 1024 * 1024) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG evidence expands beyond the safe capture limit.');
  }
  let inflated;
  try {
    inflated = inflateSync(Buffer.concat(imageData), { maxOutputLength: expectedInflatedBytes });
  } catch {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG pixel data could not be decoded.');
  }
  if (inflated.length !== expectedInflatedBytes) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-PNG', 'PNG pixel payload does not match its declared dimensions.');
  }
  return { width: header.width, height: header.height };
}

function normalizeSha256(value, label) {
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/i.test(value.trim())) {
    throw createAuthoringError('WB-AUTH-RENDER-EVIDENCE-HASH', `${label} must be a sha256: digest.`);
  }
  return value.trim().toLowerCase();
}

function withoutPrivateReceiptFields(receipt) {
  return {
    id: receipt.id,
    sourceFile: receipt.sourceFile,
    sourceRevision: receipt.sourceRevision,
    renderRevision: receipt.renderRevision,
    phase: receipt.phase,
    viewport: receipt.viewport,
    capture: receipt.capture,
    geometryEvaluation: receipt.geometryEvaluation,
    artifact: receipt.artifact,
    createdAt: receipt.createdAt,
  };
}

function getActiveRenderEvidence(evidenceStore, id, projectRoot) {
  const receipt = evidenceStore.get(id);
  if (!receipt) throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-MISSING', `Render evidence ${id} was not found or expired.`);
  if (Date.parse(receipt.expiresAt) <= Date.now()) {
    evidenceStore.delete(id);
    throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-EXPIRED', `Render evidence ${id} expired.`);
  }
  if (receipt.projectRoot !== resolve(projectRoot)) throw createAuthoringError('WB-AUTH-VISUAL-EVIDENCE-PROJECT', 'Render evidence belongs to a different project.');
  return receipt;
}

function getRenderEvidenceFailures(receipt) {
  const metrics = receipt.capture.metrics;
  const failures = [];
  if (metrics.documentScrollWidth > metrics.documentClientWidth) failures.push('horizontal-overflow');
  if (metrics.clippedElementCount > 0) failures.push('content-clipping');
  if (metrics.contrastViolationCount > 0) failures.push('text-contrast');
  if (metrics.focusIndicatorViolationCount > 0) failures.push('focus-visibility');
  if (receipt.viewport.width <= 480 && metrics.touchTargetViolationCount > 0) failures.push('compact-touch-target');
  if (metrics.missingAltTextCount > 0) failures.push('missing-alt-text');
  return failures;
}

function createVisualApprovalSummary(review, comparisons) {
  const scoreLines = AUTHORING_QUALITY_SCORE_CATEGORIES.map((category) => `- ${category}: ${review.scorecard[category].score}/100 (${review.scorecard[category].status})`);
  const evidenceLines = comparisons.map(({ before, after, mathematicalDelta }) => {
    const revisionLabel = before
      ? `${before.artifact.sha256} -> ${after.artifact.sha256}`
      : `final ${after.artifact.sha256}`;
    const deltaLabel = mathematicalDelta
      ? `; score delta=${mathematicalDelta.gridScore}/${mathematicalDelta.uniformPaddingScore}/${mathematicalDelta.opticalBalanceScore}`
      : '';
    return `- ${after.capture.renderer} ${after.viewport.width}x${after.viewport.height}: ${revisionLabel}; objective blockers=${getRenderEvidenceFailures(after).length}; geometry grid/padding/optical=${after.geometryEvaluation.scores.grid}/${after.geometryEvaluation.scores.uniformPadding}/${after.geometryEvaluation.scores.opticalBalance}; mathematical violations=${after.geometryEvaluation.violations.length}${deltaLabel}`;
  });
  return [
    `Visual quality approval — ${review.sourceFile}`,
    `Review id: ${review.id}`,
    `Reviewer: ${review.reviewer.method} / ${review.reviewer.reference}`,
    `Outcome: ${review.outcome}`,
    'Workbench render evidence:',
    ...evidenceLines,
    `Refinement: ${review.refinement.status}${review.refinement.changes.length > 0 ? ` — ${review.refinement.changes.join('; ')}` : ''}`,
    'Independent quality scorecard:',
    ...scoreLines,
    `Unresolved blockers: ${review.blockers.length}`,
    'Approve this exact current render for final Workbench verification?',
  ].join('\n');
}

function createRelativeImportSpecifier(sourceFile, importedSourceFile) {
  const fromDir = posix.dirname(normalizeProjectPath(sourceFile));
  const target = stripSourceExtension(normalizeProjectPath(importedSourceFile));
  let specifier = posix.relative(fromDir, target);
  if (!specifier.startsWith('.')) specifier = `./${specifier}`;
  return specifier;
}

function resolveRelativeProjectImport(sourceFile, specifier) {
  const sourceDir = posix.dirname(normalizeProjectPath(sourceFile));
  return posix.normalize(posix.join(sourceDir, specifier));
}

function stripSourceExtension(value) {
  return value.replace(/\.(?:jsx?|tsx?)$/i, '').replace(/\/index$/i, '');
}

function createUniqueLocalName(importName, usedLocalNames) {
  const count = (usedLocalNames.get(importName) ?? 0) + 1;
  usedLocalNames.set(importName, count);
  return count === 1 ? importName : `${importName}${count}`;
}

function indentMultiline(value, spaces) {
  const indent = ' '.repeat(spaces);
  return value.split('\n').map((line) => `${indent}${line}`).join('\n');
}

function normalizeChildren(value) {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function normalizeRoute(value) {
  const normalized = value.trim();
  if (!normalized.startsWith('/') || normalized.includes(' ') || normalized.includes('..')) {
    throw createAuthoringError('WB-AUTH-ROUTE', 'Page route must be an absolute route without spaces or traversal segments.');
  }
  return normalized === '/' ? '/' : normalized.replace(/\/+$/, '');
}

function normalizeProjectPath(value) {
  return value.trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/^\.\//, '');
}

// Deterministic on purpose: the app's own installer appends a timestamp, but
// page source has to reference these URLs, so a re-run must not move them.
function createAuthoringAssetFileName(value) {
  const base = String(value).split(/[\\/]/).pop() ?? '';
  const cleaned = base.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|-+$/g, '');
  if (!cleaned) throw createAuthoringError('WB-AUTH-ASSET-FILE-NAME', `Cannot derive a safe asset file name from "${value}".`);
  const dotIndex = cleaned.lastIndexOf('.');
  return dotIndex > 0 ? `${cleaned.slice(0, dotIndex).slice(0, 72)}${cleaned.slice(dotIndex).slice(0, 16)}` : cleaned.slice(0, 72);
}

// Lower-cased so the public URL resolves the same on case-sensitive hosts.
function createAuthoringAssetFolderName(value) {
  const base = String(value).toLowerCase().split(/[\\/]/).pop() ?? '';
  const cleaned = base.trim().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|-+$/g, '');
  return (cleaned || 'collection').slice(0, 72);
}

function toAuthoringAssetImportName(value) {
  const parts = String(value).replace(/\.[^.]+$/, '').split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return parts.map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join('') || 'Asset';
}

function resolveAuthoringAssetPath(projectRoot, relativeFilePath) {
  const assetRoot = resolve(projectRoot, AUTHORING_ASSET_PUBLIC_ROOT);
  const target = resolve(projectRoot, relativeFilePath);
  const contained = relative(assetRoot, target);
  if (!contained || contained === '..' || contained.startsWith(`..${sep}`)) {
    throw createAuthoringError('WB-AUTH-ASSET-PATH', `Asset path ${relativeFilePath} escapes ${AUTHORING_ASSET_PUBLIC_ROOT}.`);
  }
  return target;
}

async function readAuthoringAssetBytes(file) {
  if (!isRecord(file)) throw createAuthoringError('WB-AUTH-ASSET-FILES', 'Each asset file must be an object with sourcePath or dataUrl.');
  if (typeof file.sourcePath === 'string' && file.sourcePath.trim()) {
    const sourcePath = file.sourcePath.trim();
    return {
      bytes: await readFile(sourcePath),
      fileName: createAuthoringAssetFileName(typeof file.name === 'string' && file.name ? file.name : sourcePath),
    };
  }
  if (typeof file.dataUrl === 'string' && file.dataUrl.trim()) {
    const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(file.dataUrl.trim());
    if (!match) throw createAuthoringError('WB-AUTH-ASSET-DATA-URL', 'dataUrl is not a valid data: URL.');
    if (typeof file.name !== 'string' || !file.name.trim()) {
      throw createAuthoringError('WB-AUTH-ASSET-FILE-NAME', 'A dataUrl asset file requires an explicit name.');
    }
    return {
      bytes: match[2] ? Buffer.from(match[3], 'base64') : Buffer.from(decodeURIComponent(match[3]), 'utf8'),
      fileName: createAuthoringAssetFileName(file.name),
    };
  }
  throw createAuthoringError('WB-AUTH-ASSET-FILES', 'Each asset file needs either sourcePath or dataUrl.');
}

function toComponentIdentifier(value) {
  const words = String(value).split(/[^A-Za-z0-9_$]+/).filter(Boolean);
  const candidate = words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join('');
  return /^[A-Za-z_$]/.test(candidate) ? candidate : `Page${candidate}`;
}

function slugify(value) {
  const slug = String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'page';
}

function pruneExpiredRecords(records) {
  const now = Date.now();
  for (const [id, record] of records) {
    if (Date.parse(record.expiresAt) <= now) records.delete(id);
  }
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === 'string').map((value) => value.trim()).filter(Boolean))];
}

function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? '';
}

function getRequiredString(value, key) {
  if (!isRecord(value) || typeof value[key] !== 'string' || !value[key].trim()) {
    throw createAuthoringError('WB-AUTH-FIELD', `${key} is required.`);
  }
  return value[key].trim();
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw createAuthoringError('WB-AUTH-METADATA', `${label} could not be read: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

async function readOptionalJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw createAuthoringError('WB-AUTH-METADATA', `Optional Workbench metadata could not be read: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createViolation(code, path, message, components = []) {
  return {
    code,
    path,
    message,
    ...(components.length > 0 ? {
      components: components.map((component) => ({ id: component.id, name: component.name, roles: component.authoring.roles })),
    } : {}),
  };
}

function createAuthoringWarning(code, path, message, { impact, guidance, acceptableWhen }) {
  return {
    ...createViolation(code, path, message),
    severity: 'warning',
    blocking: false,
    impact,
    guidance,
    acceptableWhen,
  };
}

function createAuthoringWarningPolicy(warnings) {
  return {
    status: warnings.length > 0 ? 'pass-with-warnings' : 'pass',
    blocksWrite: false,
    requiresRevision: false,
    instruction: warnings.length > 0
      ? 'Warnings are review prompts, not failed verification. Resolve them when they prevent the requested Design-canvas editability; otherwise keep the valid React pattern and report the accepted boundary with a reason. Do not iterate only to remove warning codes.'
      : 'No editability warnings were detected.',
  };
}

function getNodeLocation(node) {
  const line = node?.loc?.start?.line;
  const column = node?.loc?.start?.column;
  return Number.isFinite(line) ? `line ${line}:${Number.isFinite(column) ? column + 1 : 1}` : 'source';
}

function createAuthoringError(code, message, violations = []) {
  const error = new Error(message);
  error.code = code;
  error.violations = violations;
  return error;
}

export function serializeWorkbenchAuthoringError(error) {
  return {
    ok: false,
    code: typeof error?.code === 'string' ? error.code : 'WB-AUTH-UNKNOWN',
    message: error instanceof Error ? error.message : 'Workbench authoring request failed.',
    violations: Array.isArray(error?.violations) ? error.violations : [],
  };
}
