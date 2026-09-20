import { execFile } from 'node:child_process';
import { createInterface } from 'node:readline';
import { access, readFile, readdir } from 'node:fs/promises';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import * as workbenchHost from './workbench-local-project-host.mjs';
import { createWorkbenchAuthoringService, serializeWorkbenchAuthoringError } from './workbench-authoring-core.mjs';
import {
  WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES,
  WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
  createWorkbenchPreviewCssCoordinator,
} from './workbench-preview-css.mjs';

const SERVER_NAME = 'workbench-authoring';
const SERVER_VERSION = '0.16.0';
const WORKBENCH_SCRIPTS_ROOT = dirname(fileURLToPath(import.meta.url));
const WORKBENCH_ROOT = resolve(WORKBENCH_SCRIPTS_ROOT, '..');
const ACTIVE_PROJECT_STATE_PATH = resolve(WORKBENCH_ROOT, '.workbench', 'dev-server-project.json');
const WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH = resolve(WORKBENCH_SCRIPTS_ROOT, 'workbench-tailwind-sync.mjs');
const COMPACT_RESPONSE_TEXT_BUDGET = 30_000;
const SUPPORTED_PROTOCOLS = new Set(['2024-11-05', '2025-03-26', '2025-06-18']);
const execFileAsync = promisify(execFile);
const directPreviewCssCoordinator = createWorkbenchPreviewCssCoordinator({
  runTailwindSync: ({ projectRoot }) => execFileAsync(
    process.execPath,
    [WORKBENCH_TAILWIND_SYNC_SCRIPT_PATH, '--project', projectRoot, '--preview-only'],
    {
      env: createDirectPreviewCssSyncEnvironment(),
      maxBuffer: WORKBENCH_PREVIEW_CSS_SYNC_MAX_BUFFER_BYTES,
      timeout: WORKBENCH_PREVIEW_CSS_SYNC_TIMEOUT_MS,
    },
  ),
});
const directAuthoringService = createWorkbenchAuthoringService({
  getPreviewCssStatus: (projectRoot) => directPreviewCssCoordinator.getProjectStatus(projectRoot),
  synchronizePreviewCss: (projectRoot, changedPath) => directPreviewCssCoordinator.synchronizeProject(projectRoot, {
    changedPath,
    reason: `authoring:${changedPath ?? 'source-write'}`,
  }),
  writeFileAtomic: workbenchHost.writeFileAtomic,
});
let authoringProjectBinding = null;

const CORE_TOOL_NAMES = new Set([
  'workbench_inspect_design_context',
  'workbench_search_components',
  'workbench_plan_page',
  'workbench_apply_page_operations',
  'workbench_verify_page',
  'workbench_inspect_tokens',
  'workbench_upsert_tokens',
  'workbench_upsert_assets',
  'workbench_inspect_component',
  'workbench_upsert_component',
]);

const authoringNodeSchema = {
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'value'],
      properties: { kind: { const: 'text' }, value: { type: 'string' } },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'tag', 'purpose'],
      properties: {
        kind: { const: 'element' },
        tag: { type: 'string', description: 'Native semantic/editable JSX tag.' },
        purpose: { enum: ['layout', 'content', 'semantic', 'decoration'] },
        intent: { type: 'string', description: 'Optional semantic hint. A matching registered component is a suggestion, not a replacement requirement.' },
        props: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean'] } },
        children: { type: 'array', items: { $ref: '#/$defs/authoringNode' } },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'componentId'],
      properties: {
        kind: { const: 'component' },
        componentId: { type: 'string' },
        intent: { type: 'string' },
        props: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean'] } },
        children: { type: 'array', items: { $ref: '#/$defs/authoringNode' } },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['kind', 'componentId', 'runtimeClass'],
      properties: {
        kind: { const: 'runtime' },
        componentId: { type: 'string' },
        runtimeClass: { enum: ['canvas', 'chart', 'editor', 'map', 'virtualized-grid', 'webgl'] },
        props: { type: 'object', additionalProperties: { type: ['string', 'number', 'boolean'] } },
        children: { type: 'array', items: { $ref: '#/$defs/authoringNode' } },
      },
    },
  ],
};

const designEvidenceSchema = {
  type: 'object',
  additionalProperties: true,
  description: 'Optional free-form provenance for references, design exploration, or user decisions. No option count, plugin, selection, or scoring contract is imposed.',
};

const geometryContractSchema = {
  type: 'object',
  description: 'Optional project- or reference-specific geometry guidance. No global grid, padding, or optical-balance contract is imposed.',
  additionalProperties: true,
};

const geometryMeasurementsSchema = {
  type: 'object', additionalProperties: false,
  required: ['measurementVersion', 'eligibleElementCount', 'elements', 'spacing'],
  properties: {
    measurementVersion: { const: 'dom-geometry-v1' },
    eligibleElementCount: { type: 'integer', minimum: 1, maximum: 1000, description: 'Count of every layout/component box eligible under the capture adapter. Must equal elements.length.' },
    elements: {
      type: 'array', minItems: 1, maxItems: 1000, items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'kind', 'rect', 'paddingExpectation', 'opticalBalanceExpectation'],
        properties: {
          id: { type: 'string' },
          kind: { enum: ['control', 'icon', 'image', 'layout', 'surface', 'text'] },
          rect: {
            type: 'object', additionalProperties: false, required: ['x', 'y', 'width', 'height'],
            properties: Object.fromEntries(['x', 'y', 'width', 'height'].map((name) => [name, { type: 'number', minimum: 0 }])),
          },
          paddingExpectation: { enum: ['uniform', 'not-applicable'] },
          padding: {
            type: 'object', additionalProperties: false, required: ['top', 'right', 'bottom', 'left'],
            properties: Object.fromEntries(['top', 'right', 'bottom', 'left'].map((name) => [name, { type: 'number', minimum: 0 }])),
          },
          opticalBalanceExpectation: { enum: ['symmetric', 'not-applicable'] },
          inkBounds: {
            type: 'object', additionalProperties: false, required: ['x', 'y', 'width', 'height'],
            properties: Object.fromEntries(['x', 'y', 'width', 'height'].map((name) => [name, { type: 'number', minimum: 0 }])),
          },
          opticalCentroid: {
            type: 'object', additionalProperties: false, required: ['x', 'y'],
            properties: { x: { type: 'number', minimum: 0 }, y: { type: 'number', minimum: 0 } },
          },
        },
      },
    },
    spacing: {
      type: 'array', maxItems: 2000, items: {
        type: 'object', additionalProperties: false, required: ['id', 'kind', 'axis', 'value'],
        properties: {
          id: { type: 'string' },
          kind: { enum: ['baseline', 'gap', 'gutter', 'margin'] },
          axis: { enum: ['horizontal', 'vertical'] },
          value: { type: 'number', minimum: 0 },
        },
      },
    },
  },
};

const renderEvidenceSchema = {
  type: 'object', additionalProperties: false,
  required: ['sourceFile', 'sourceRevision', 'renderRevision', 'phase', 'viewport', 'capture', 'artifact'],
  properties: {
    sourceFile: { type: 'string' },
    sourceRevision: { type: 'string' },
    renderRevision: { type: 'string' },
    phase: { enum: ['before-refinement', 'after-refinement', 'final'] },
    viewport: {
      type: 'object', additionalProperties: false, required: ['width', 'height', 'deviceScaleFactor'],
      properties: {
        width: { type: 'integer', minimum: 240, maximum: 3840 },
        height: { type: 'integer', minimum: 240, maximum: 3840 },
        deviceScaleFactor: { type: 'number', minimum: 1, maximum: 4 },
      },
    },
    capture: {
      type: 'object', additionalProperties: false,
      required: ['renderer', 'route', 'capturedAt', 'domSnapshotHash', 'computedStyleHash', 'metrics', 'geometry'],
      properties: {
        renderer: { enum: ['workbench-design-canvas', 'workbench-browser-preview'] },
        route: { type: 'string' },
        capturedAt: { type: 'string' },
        domSnapshotHash: { type: 'string', description: 'sha256: digest of the captured DOM snapshot.' },
        computedStyleHash: { type: 'string', description: 'sha256: digest of the captured computed-style facts.' },
        metrics: {
          type: 'object', additionalProperties: false,
          required: ['documentScrollWidth', 'documentClientWidth', 'clippedElementCount', 'contrastViolationCount', 'focusIndicatorViolationCount', 'touchTargetViolationCount', 'missingAltTextCount'],
          properties: Object.fromEntries(['documentScrollWidth', 'documentClientWidth', 'clippedElementCount', 'contrastViolationCount', 'focusIndicatorViolationCount', 'touchTargetViolationCount', 'missingAltTextCount'].map((name) => [name, { type: 'integer', minimum: 0 }])),
        },
        geometry: geometryMeasurementsSchema,
      },
    },
    artifact: {
      type: 'object', additionalProperties: false, required: ['mediaType', 'dataBase64'],
      properties: {
        mediaType: { const: 'image/png' },
        dataBase64: { type: 'string', description: 'Base64 PNG bytes. The server decodes the image, verifies its pixel dimensions and payload, and computes its own SHA-256 receipt.' },
      },
    },
  },
};

const qualityScorecardSchema = {
  type: 'object', additionalProperties: false,
  required: ['visualHierarchy', 'compositionRhythm', 'typography', 'color', 'componentCoherence', 'responsiveContinuity', 'briefSpecificity', 'interactionClarity'],
  properties: Object.fromEntries(['visualHierarchy', 'compositionRhythm', 'typography', 'color', 'componentCoherence', 'responsiveContinuity', 'briefSpecificity', 'interactionClarity'].map((category) => [category, {
    type: 'object', additionalProperties: false, required: ['score', 'status', 'note'],
    properties: { score: { type: 'integer', minimum: 0, maximum: 100 }, status: { enum: ['pass', 'revise'] }, note: { type: 'string' } },
  }])),
};

const visualHierarchySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['attentionOrder', 'primaryFocus', 'quietRegions', 'gestalt', 'emphasis'],
  properties: {
    attentionOrder: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
    primaryFocus: { type: 'string', description: 'Must exactly match the first attentionOrder entry.' },
    quietRegions: { type: 'array', minItems: 1, maxItems: 5, items: { type: 'string' } },
    gestalt: {
      type: 'object', additionalProperties: false,
      required: ['figureGround', 'proximity', 'similarity', 'continuity', 'visualRelief'],
      properties: {
        figureGround: { type: 'string' },
        proximity: { type: 'string' },
        similarity: { type: 'string' },
        continuity: { type: 'string' },
        visualRelief: { type: 'string' },
      },
    },
    emphasis: {
      type: 'object', additionalProperties: false,
      required: ['highEmphasisLimit', 'highEmphasisElements', 'borderStrategy', 'typographyStrategy', 'spacingStrategy'],
      properties: {
        highEmphasisLimit: { type: 'integer', minimum: 1, maximum: 3 },
        highEmphasisElements: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } },
        borderStrategy: { type: 'string' },
        typographyStrategy: { type: 'string' },
        spacingStrategy: { type: 'string' },
      },
    },
  },
};

const requirementStateSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['applicability', 'rationale'],
  properties: {
    applicability: { enum: ['required', 'not-applicable'] },
    rationale: { type: 'string' },
    description: { type: 'string' },
    trigger: { type: 'string' },
    visibleChanges: { type: 'array', minItems: 1, maxItems: 12, items: { type: 'string' } },
    recovery: { type: 'string' },
  },
};

const designIntelligenceSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['workflow', 'decisions', 'content', 'reference'],
  properties: {
    workflow: {
      type: 'object', additionalProperties: false, required: ['model', 'domainObjects', 'failureModes'],
      properties: {
        model: { type: 'string' },
        domainObjects: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        failureModes: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
      },
    },
    decisions: {
      type: 'object', additionalProperties: false, required: ['keyDecisions', 'actionHierarchy', 'operationalRules'],
      properties: {
        keyDecisions: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        actionHierarchy: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        operationalRules: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
      },
    },
    content: {
      type: 'object', additionalProperties: false, required: ['sampleContent', 'nonGoals', 'successSignals'],
      properties: {
        sampleContent: { type: 'array', minItems: 3, maxItems: 20, items: { type: 'string' } },
        nonGoals: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        successSignals: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
      },
    },
    reference: {
      type: 'object', additionalProperties: false,
      required: ['status', 'artifacts', 'implementationMode', 'sourcePrecedence', 'pageLandmarks', 'repeatedPatterns', 'hierarchyObservations', 'interactionPatterns', 'responsiveBehavior', 'deliberateDeviations'],
      properties: {
        status: { enum: ['none', 'provided'] },
        artifacts: { type: 'array', maxItems: 20, items: { type: 'string' } },
        implementationMode: { enum: ['not-applicable', 'exact-conversion', 'adapt-to-project'] },
        sourcePrecedence: { type: 'string' },
        pageLandmarks: { type: 'array', maxItems: 20, items: { type: 'string' } },
        repeatedPatterns: { type: 'array', maxItems: 20, items: { type: 'string' } },
        hierarchyObservations: { type: 'array', maxItems: 20, items: { type: 'string' } },
        interactionPatterns: { type: 'array', maxItems: 20, items: { type: 'string' } },
        responsiveBehavior: { type: 'array', maxItems: 20, items: { type: 'string' } },
        deliberateDeviations: { type: 'array', maxItems: 20, items: { type: 'string' } },
      },
    },
  },
};

const requirementsConfirmationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['contextRevision', 'product', 'surface', 'ownership', 'states', 'sections', 'dataRequirements', 'designIntelligence', 'visualComposition', 'responsiveAccessibility', 'fieldEvidence', 'unresolvedQuestions'],
  properties: {
    contextRevision: { type: 'string', description: 'Revision returned by workbench_inspect_design_context.' },
    product: {
      type: 'object', additionalProperties: false, required: ['name', 'purpose', 'primaryUser'],
      properties: { name: { type: 'string' }, purpose: { type: 'string' }, primaryUser: { type: 'string' } },
    },
    surface: {
      type: 'object', additionalProperties: false,
      required: ['role', 'entryContext', 'primaryOutcome', 'primaryAction', 'actionConsequence', 'nextStep'],
      properties: {
        role: { enum: ['default-workspace', 'entity-detail', 'task-flow', 'exception-workspace', 'overlay'] },
        entryContext: { type: 'string' }, primaryOutcome: { type: 'string' }, primaryAction: { type: 'string' },
        actionConsequence: { type: 'string' }, nextStep: { type: 'string' },
      },
    },
    ownership: {
      type: 'object', additionalProperties: false, required: ['common', 'page', 'exception'],
      properties: {
        common: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        page: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        exception: { type: 'array', maxItems: 20, items: { type: 'string' } },
      },
    },
    states: {
      type: 'object', additionalProperties: false,
      required: ['default', 'healthy', 'warning', 'incident', 'empty', 'loading', 'error'],
      properties: Object.fromEntries(['default', 'healthy', 'warning', 'incident', 'empty', 'loading', 'error'].map((state) => [state, requirementStateSchema])),
    },
    sections: {
      type: 'array', minItems: 1, maxItems: 12, items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'name', 'intent', 'ownership', 'visibleStates', 'requiredInformation', 'decisionSupported', 'primaryAction', 'nextStep', 'emphasis'],
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, intent: { type: 'string' },
          ownership: { enum: ['common', 'page', 'exception'] },
          visibleStates: { type: 'array', minItems: 1, maxItems: 7, items: { enum: ['default', 'healthy', 'warning', 'incident', 'empty', 'loading', 'error'] } },
          requiredInformation: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
          decisionSupported: { type: 'string' }, primaryAction: { type: 'string' }, nextStep: { type: 'string' },
          emphasis: { enum: ['high', 'medium', 'low'] },
        },
      },
    },
    dataRequirements: {
      type: 'array', minItems: 1, maxItems: 20, items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'name', 'source', 'freshness', 'requiredStates', 'fallback'],
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, source: { type: 'string' }, freshness: { type: 'string' },
          requiredStates: { type: 'array', minItems: 1, maxItems: 7, items: { enum: ['default', 'healthy', 'warning', 'incident', 'empty', 'loading', 'error'] } },
          fallback: { type: 'string' },
        },
      },
    },
    designIntelligence: designIntelligenceSchema,
    visualComposition: {
      type: 'object', additionalProperties: false,
      required: ['surfaceModel', 'density', 'borderPolicy', 'cardPolicy', 'overlayPolicy', 'dividerPolicy', 'limits', 'persistentRegions', 'forbiddenPartitions', 'disclosures', 'constraints'],
      properties: {
        surfaceModel: { enum: ['single-surface', 'layered-surface', 'sectioned-surface'] },
        density: { enum: ['minimal', 'balanced', 'dense'] },
        borderPolicy: { enum: ['borderless', 'dividers-only', 'contained'] },
        cardPolicy: { enum: ['avoid', 'independent-only', 'allowed'] },
        overlayPolicy: { enum: ['none', 'contextual-only', 'workflow-owned'] },
        dividerPolicy: { enum: ['none', 'rows-only', 'sectional'] },
        limits: {
          type: 'object', additionalProperties: false,
          required: ['contentSurfaceCount', 'persistentRegionCount', 'outlinedContainerCount', 'cardCount', 'fullHeightPartitionCount'],
          properties: {
            contentSurfaceCount: { type: 'integer', minimum: 1, maximum: 8 },
            persistentRegionCount: { type: 'integer', minimum: 0, maximum: 8 },
            outlinedContainerCount: { type: 'integer', minimum: 0, maximum: 40 },
            cardCount: { type: 'integer', minimum: 0, maximum: 40 },
            fullHeightPartitionCount: { type: 'integer', minimum: 0, maximum: 8 },
          },
        },
        persistentRegions: { type: 'array', maxItems: 12, items: { type: 'string' } },
        forbiddenPartitions: { type: 'array', maxItems: 12, items: { type: 'string' } },
        disclosures: {
          type: 'array', minItems: 1, maxItems: 20, items: {
            type: 'object', additionalProperties: false, required: ['content', 'owner', 'trigger', 'rationale'],
            properties: {
              content: { type: 'string' },
              owner: { enum: ['inline', 'popover', 'menu', 'dialog', 'drawer', 'dedicated-page'] },
              trigger: { type: 'string' },
              rationale: { type: 'string' },
            },
          },
        },
        constraints: {
          type: 'array', minItems: 1, maxItems: 20, items: {
            type: 'object', additionalProperties: false, required: ['id', 'requirement', 'verification'],
            properties: { id: { type: 'string' }, requirement: { type: 'string' }, verification: { type: 'string' } },
          },
        },
      },
    },
    responsiveAccessibility: {
      type: 'object', additionalProperties: false, required: ['wide', 'compact', 'keyboard', 'screenReader'],
      properties: { wide: { type: 'string' }, compact: { type: 'string' }, keyboard: { type: 'string' }, screenReader: { type: 'string' } },
    },
    fieldEvidence: {
      type: 'array', minItems: 15, items: {
        type: 'object', additionalProperties: false, required: ['field', 'source', 'reference'],
        properties: { field: { type: 'string' }, source: { enum: ['user', 'project', 'artifact'] }, reference: { type: 'string' } },
      },
    },
    unresolvedQuestions: { type: 'array', maxItems: 0, items: { type: 'string' } },
  },
};

const tools = [
  {
    name: 'workbench_inspect_design_context',
    description: 'Bind this MCP session to one explicitly identified Workbench project, then inspect it before composing. projectTarget requires projectId, projectName, or rootPath plus evidence { source, reference }. A stale last-opened project, cwd, or browser tab is never accepted implicitly. For every supplied Figma, screenshot, code, or visual reference, resolve referenceAnalysis.implementationMode as exact-conversion or adapt-to-project from explicit user wording, project handoff, active source, and adjacent source patterns. If those sources do not settle the intent, leave it unresolved and ask the returned reference-implementation-intent question before writing. The default compact response keeps the binding, curated public organizational context, active source summary, inventories, readiness, and questions while omitting high-volume detail; request responseProfile full only when a deep inventory is needed.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['projectTarget'],
      properties: {
        projectTarget: {
          type: 'object',
          description: 'Explicit project identity plus provenance. Example: { rootPath: "/absolute/project", evidence: { source: "project", reference: "Workspace selected for this task." } }.',
          additionalProperties: false,
          required: ['evidence'],
          anyOf: [
            { required: ['projectId'] },
            { required: ['projectName'] },
            { required: ['rootPath'] },
          ],
          properties: {
            projectId: { type: 'string', minLength: 1, maxLength: 160, description: 'Workbench project id from project metadata.' },
            projectName: { type: 'string', minLength: 1, maxLength: 240, description: 'Exact Workbench project name.' },
            rootPath: { type: 'string', minLength: 1, maxLength: 1200, description: 'Absolute filesystem path to the intended Workbench project root.' },
            evidence: {
              type: 'object', description: 'Why this exact project is in scope; never cite ambient browser or last-opened state.', additionalProperties: false, required: ['source', 'reference'],
              properties: {
                source: { enum: ['user', 'project', 'artifact'], description: 'Origin of the binding evidence.' },
                reference: { type: 'string', minLength: 1, maxLength: 600, description: 'Short concrete reference establishing why the target is intended.' },
              },
            },
          },
        },
        brief: {
          type: 'object',
          additionalProperties: false,
          properties: {
            experienceType: { enum: ['screen', 'flow', 'service-touchpoint'] },
            productName: { type: 'string', maxLength: 600 },
            servicePurpose: { type: 'string', maxLength: 600 },
            audience: { type: 'string', maxLength: 600 },
            journeyMoment: { type: 'string', maxLength: 600 },
            surfaceRole: { enum: ['default-workspace', 'entity-detail', 'task-flow', 'exception-workspace', 'overlay'] },
            defaultState: { type: 'string', maxLength: 600 },
            healthyState: { type: 'string', maxLength: 600 },
            exceptionState: { type: 'string', maxLength: 600 },
            commonElements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            pageElements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            exceptionElements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            primaryOutcome: { type: 'string', maxLength: 600 },
            primaryAction: { type: 'string', maxLength: 600 },
            actionConsequence: { type: 'string', maxLength: 600 },
            nextStep: { type: 'string', maxLength: 600 },
            workflowModel: { type: 'string', maxLength: 600 },
            domainObjects: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            keyDecisions: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            actionHierarchy: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            operationalRules: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            failureModes: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            sampleContent: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            nonGoals: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            successSignals: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            dataRequirements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            contentPriorities: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            creativeDirection: { type: 'string', maxLength: 600 },
            visualTargetStatus: { enum: ['unresolved', 'user-supplied', 'project-established', 'user-selected'] },
            visualTargetReferences: { type: 'array', maxItems: 3, items: { type: 'string', maxLength: 500 } },
            surfaceModel: { enum: ['single-surface', 'layered-surface', 'sectioned-surface'] },
            density: { enum: ['minimal', 'balanced', 'dense'] },
            borderPolicy: { enum: ['borderless', 'dividers-only', 'contained'] },
            cardPolicy: { enum: ['avoid', 'independent-only', 'allowed'] },
            overlayPolicy: { enum: ['none', 'contextual-only', 'workflow-owned'] },
            dividerPolicy: { enum: ['none', 'rows-only', 'sectional'] },
            disclosureStrategy: { type: 'string', maxLength: 600 },
            persistentRegions: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            forbiddenPartitions: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            constraints: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            responsivePriorities: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            accessibilityRequirements: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 240 } },
            referenceStatus: { enum: ['none', 'provided'] },
            referenceArtifacts: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 500 } },
            referenceAnalysis: {
              type: 'object', additionalProperties: false,
              properties: {
                implementationMode: {
                  enum: ['unresolved', 'exact-conversion', 'adapt-to-project'],
                  description: 'Whether the supplied artifact owns observable structure/composition or supplies selected content and visual properties inside the existing project structure. Use unresolved when explicit user, handoff, active-source, and adjacent-source evidence do not settle the intent; ask before writing.',
                },
                sourcePrecedence: { type: 'string', maxLength: 600 },
                pageLandmarks: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
                repeatedPatterns: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
                hierarchyObservations: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
                interactionPatterns: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
                responsiveBehavior: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
                deliberateDeviations: { type: 'array', maxItems: 20, items: { type: 'string', maxLength: 300 } },
              },
            },
          },
        },
        assumptionPolicy: { enum: ['ask', 'agent-may-assume'] },
        responseProfile: {
          enum: ['compact', 'full'],
          default: 'compact',
          description: 'compact is the default for routine authoring; full returns the complete inventory and design-intelligence report.',
        },
      },
    },
  },
  {
    name: 'workbench_confirm_design_requirements',
    description: 'Optionally record a detailed, revision-bound requirements contract when a complex brief benefits from it. This helper is not required before planning or writing.',
    inputSchema: requirementsConfirmationSchema,
  },
  {
    name: 'workbench_prepare_page_prompt',
    description: 'Optionally generate a source-composition prompt from recorded requirements for a user-requested design checkpoint. This read-only helper is not a write gate.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      required: ['requirementsId', 'pageName', 'route', 'sourceFile', 'compositionApproach', 'contentOutline', 'interactionOutline', 'responsiveOutline', 'authoringConstraints'],
      properties: {
        requirementsId: { type: 'string' },
        pageName: { type: 'string' },
        route: { type: 'string' },
        sourceFile: { type: 'string' },
        compositionApproach: { type: 'string' },
        contentOutline: { type: 'array', minItems: 3, maxItems: 20, items: { type: 'string' } },
        interactionOutline: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
        responsiveOutline: { type: 'array', minItems: 2, maxItems: 20, items: { type: 'string' } },
        authoringConstraints: { type: 'array', minItems: 1, maxItems: 20, items: { type: 'string' } },
      },
    },
  },
  {
    name: 'workbench_confirm_page_prompt',
    description: 'Optionally record explicit user approval for a prepared execution prompt. Planning remains available without this record.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['promptId', 'approvalEvidence'],
      properties: {
        promptId: { type: 'string' },
        approvalEvidence: {
          type: 'object', additionalProperties: false, required: ['source', 'reference'],
          properties: { source: { const: 'user' }, reference: { type: 'string' } },
        },
      },
    },
  },
  {
    name: 'workbench_search_components',
    description: 'Optionally search registered components when reuse, behavior, accessibility, or Inspector-specific props would improve the page. Native HTML and primitives remain valid even when a catalog match exists.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: { type: 'string' },
        roles: { type: 'array', items: { type: 'string' } },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: 'workbench_plan_page',
    description: 'Create a revision-bound editable page plan for the bound Workbench project. Only page identity and source location are required; requirements contracts, prompt approval, component intents, design evidence, hierarchy, and geometry guidance are optional.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['pageName', 'route', 'sourceFile'],
      properties: {
        requirementsId: { type: 'string', description: 'Optional requirements id returned by the full-profile requirements helper.' },
        approvedPromptId: { type: 'string', description: 'Optional approval id returned by the full-profile prompt-approval helper.' },
        authoringSessionId: { type: 'string', description: 'Optional stable identity for provenance or an optional independent review.' },
        pageName: { type: 'string' },
        exportName: { type: 'string' },
        route: { type: 'string' },
        sourceFile: { type: 'string', description: 'New pages must be placed under src/workbench-pages.' },
        intents: { type: 'array', items: { type: 'string' }, description: 'Optional semantic roles used only to return component suggestions.' },
        designEvidence: designEvidenceSchema,
        visualHierarchy: visualHierarchySchema,
        geometryContract: geometryContractSchema,
      },
    },
  },
  {
    name: 'workbench_apply_page_operations',
    description: 'Write a page from native editable JSX, primitives, and optional registered component IDs. Native elements are never rejected merely because a registered component exists. Chosen registered component props still follow their sourceInsert contract, and configured preview CSS is synchronized before completion.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['planId', 'root'],
      properties: {
        planId: { type: 'string' },
        root: { $ref: '#/$defs/authoringNode' },
      },
      $defs: { authoringNode: authoringNodeSchema },
    },
  },
  {
    name: 'workbench_submit_render_evidence',
    description: 'Optional legacy/high-assurance visual QA helper for submitting revision-bound render evidence. It is not required by editable-v1 authoring.',
    inputSchema: renderEvidenceSchema,
  },
  {
    name: 'workbench_submit_visual_review',
    description: 'Optional legacy/high-assurance independent visual review. editable-v1 work does not require numeric scores, before/after evidence, a separate reviewer, or approval.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      required: ['sourceFile', 'sourceRevision', 'renderRevision', 'outcome', 'targetReference', 'reviewer', 'comparisons', 'scorecard', 'blockers', 'gestaltAssessment', 'constraintAssessments', 'refinement', 'warningResolutions'],
      properties: {
        sourceFile: { type: 'string' },
        sourceRevision: { type: 'string' },
        renderRevision: { type: 'string' },
        outcome: { enum: ['accept', 'revise'] },
        targetReference: { type: 'string' },
        reviewer: {
          type: 'object', additionalProperties: false, required: ['kind', 'sessionId', 'method', 'reference'],
          properties: {
            kind: { const: 'independent' },
            sessionId: { type: 'string' },
            method: { enum: ['human-design-review', 'separate-agent', 'vision-model'] },
            reference: { type: 'string' },
          },
        },
        comparisons: {
          type: 'array', minItems: 2, maxItems: 4, items: {
            type: 'object', additionalProperties: false,
            required: ['observedAttentionOrder', 'findings'],
            oneOf: [
              { required: ['evidenceId'], not: { anyOf: [{ required: ['beforeEvidenceId'] }, { required: ['afterEvidenceId'] }] } },
              { required: ['beforeEvidenceId', 'afterEvidenceId'], not: { required: ['evidenceId'] } },
            ],
            properties: {
              evidenceId: { type: 'string' },
              beforeEvidenceId: { type: 'string' },
              afterEvidenceId: { type: 'string' },
              observedAttentionOrder: { type: 'array', minItems: 3, maxItems: 5, items: { type: 'string' } },
              findings: { type: 'array', minItems: 1, maxItems: 10, items: { type: 'string' } },
            },
          },
        },
        scorecard: qualityScorecardSchema,
        blockers: { type: 'array', maxItems: 20, items: { type: 'string' } },
        gestaltAssessment: {
          type: 'object', additionalProperties: false,
          required: ['figureGround', 'proximity', 'similarity', 'continuity', 'visualRelief'],
          properties: Object.fromEntries(['figureGround', 'proximity', 'similarity', 'continuity', 'visualRelief'].map((principle) => [principle, {
            type: 'object', additionalProperties: false, required: ['status', 'note'],
            properties: { status: { enum: ['pass', 'revise'] }, note: { type: 'string' } },
          }])),
        },
        constraintAssessments: {
          type: 'array', maxItems: 20, items: {
            type: 'object', additionalProperties: false, required: ['constraintId', 'status', 'note'],
            properties: {
              constraintId: { type: 'string' },
              status: { enum: ['pass', 'revise'] },
              note: { type: 'string' },
            },
          },
        },
        refinement: {
          type: 'object', additionalProperties: false, required: ['status', 'changes', 'rationale', 'sourceChangesReference'],
          properties: {
            status: { enum: ['completed', 'not-required'] },
            changes: { type: 'array', maxItems: 20, items: { type: 'string' } },
            rationale: { type: 'string' },
            sourceChangesReference: { type: 'string' },
          },
        },
        warningResolutions: {
          type: 'array', items: {
            type: 'object', additionalProperties: false, required: ['code', 'resolution'],
            properties: { code: { type: 'string' }, resolution: { type: 'string' } },
          },
        },
      },
    },
  },
  {
    name: 'workbench_confirm_visual_approval',
    description: 'Optionally record user approval of a legacy/high-assurance visual review. editable-v1 authoring does not require this step.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      required: ['sourceFile', 'sourceRevision', 'renderRevision', 'reviewId', 'approvalEvidence'],
      properties: {
        sourceFile: { type: 'string' },
        sourceRevision: { type: 'string' },
        renderRevision: { type: 'string' },
        reviewId: { type: 'string' },
        approvalEvidence: {
          type: 'object', additionalProperties: false, required: ['source', 'reference'],
          properties: { source: { const: 'user' }, reference: { type: 'string' } },
        },
      },
    },
  },
  {
    name: 'workbench_verify_page',
    description: 'Verify that page source parses and remains representable through Workbench. editable-v1 treats ordinary React expressions and unregistered component boundaries as warnings rather than failures; legacy structured-v2 through structured-v8 pages retain their historical evidence rules.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['sourceFile'],
      properties: { sourceFile: { type: 'string' }, exportName: { type: 'string' } },
    },
  },
  {
    name: 'workbench_inspect_tokens',
    description: 'Read token collections and a revision for safe token authoring. Reuse an existing primitive with the same normalized type/unit/value before creating one.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
  {
    name: 'workbench_upsert_tokens',
    description: 'Create or update tokens while enforcing primitive raw values, semantic-to-primitive references, and component-to-semantic references. Requires the latest revision from workbench_inspect_tokens.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['baseRevision', 'operations'],
      properties: {
        baseRevision: { type: 'string' },
        operations: {
          type: 'array', minItems: 1, items: {
            type: 'object', additionalProperties: false, required: ['layer', 'collectionId', 'token'],
            properties: {
              layer: { enum: ['primitive', 'semantic', 'component'] },
              collectionId: { type: 'string' },
              token: {
                type: 'object', additionalProperties: true, required: ['id', 'name', 'type', 'groupId', 'values'],
                properties: {
                  id: { type: 'string' }, name: { type: 'string' }, type: { type: 'string' }, groupId: { type: 'string' },
                  values: { type: 'object', minProperties: 1, additionalProperties: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'workbench_upsert_assets',
    description: 'Install asset files under the project public asset space and register them in .workbench/assets.json in one write. Use this before page source references any downloaded, generated, or copied asset — an unregistered /workbench-assets/ URL fails the project authoring contract, and an external or figma: URL never resolves in preview. Returns the registered /workbench-assets/ URLs to reference from source.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['assets'],
      properties: {
        assets: {
          type: 'array', minItems: 1, items: {
            type: 'object', additionalProperties: false, required: ['name', 'kind', 'files'],
            properties: {
              name: { type: 'string' },
              kind: { enum: ['icon', 'image', 'font', 'video'] },
              id: { type: 'string' },
              collection: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              figma: {
                type: 'object', additionalProperties: false,
                properties: { fileKey: { type: 'string' }, fileName: { type: 'string' }, nodeId: { type: 'string' }, nodeName: { type: 'string' } },
              },
              files: {
                type: 'array', minItems: 1, items: {
                  type: 'object', additionalProperties: false,
                  properties: {
                    sourcePath: { type: 'string' },
                    dataUrl: { type: 'string' },
                    name: { type: 'string' },
                    importName: { type: 'string' },
                    label: { type: 'string' },
                    style: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    name: 'workbench_inspect_component',
    description: 'Read a component source and matching CSF story with revisions before an approved component creation or modification.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['sourceFile', 'storyFile'], properties: { sourceFile: { type: 'string' }, storyFile: { type: 'string' } } },
  },
  {
    name: 'workbench_upsert_component',
    description: 'Create or modify an explicitly approved component source and its CSF story together. Enforces exports, args, argTypes, sourceInsert, revision safety, and registry hydration through reload. Repeated designer-editable rows, items, branches, messages, fields, options, or media must be registered source children with sourceInsert.jsxChildren; delimited string props and fixed visible config arrays are rejected. Visible child props such as icons must survive selected, collapsed, and expanded presentations.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      required: ['sourceFile', 'storyFile', 'exportName', 'sourceRevision', 'storyRevision', 'sourceContents', 'storyContents'],
      properties: {
        sourceFile: { type: 'string' }, storyFile: { type: 'string' }, exportName: { type: 'string' },
        sourceRevision: { type: 'string' }, storyRevision: { type: 'string' }, sourceContents: { type: 'string' }, storyContents: { type: 'string' },
      },
    },
  },
];

const toolProfile = process.env.WORKBENCH_AUTHORING_TOOL_PROFILE === 'full'
  ? 'full'
  : 'core';
const advertisedTools = toolProfile === 'full'
  ? tools
  : tools.filter((tool) => CORE_TOOL_NAMES.has(tool.name));

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
let messageQueue = Promise.resolve();
input.on('line', (line) => {
  if (line.trim()) messageQueue = messageQueue.then(() => handleMessage(line));
});

async function handleMessage(line) {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    writeMessage(createJsonRpcError(null, -32700, 'Parse error'));
    return;
  }

  const id = message.id ?? null;
  try {
    if (message.method === 'initialize') {
      const requested = message.params?.protocolVersion;
      writeMessage({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: SUPPORTED_PROTOCOLS.has(requested) ? requested : '2024-11-05',
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          instructions: 'Bind explicitly before other tools; never infer a project from cwd or browser state. Use compact inspection. Treat only returned public/curated organizational context as shareable; never mine private history. Write real editable source. In Design canvas use Option/Alt for runtime controls; unmodified input selects. Component API changes require source plus its CSF story.',
        },
      });
      return;
    }
    if (message.method === 'notifications/initialized' || message.method === 'notifications/cancelled') return;
    if (message.method === 'ping') {
      writeMessage({ jsonrpc: '2.0', id, result: {} });
      return;
    }
    if (message.method === 'tools/list') {
      writeMessage({ jsonrpc: '2.0', id, result: { tools: advertisedTools } });
      return;
    }
    if (message.method === 'tools/call') {
      writeMessage({ jsonrpc: '2.0', id, result: await callTool(message.params?.name, message.params?.arguments ?? {}) });
      return;
    }
    if (id !== null) writeMessage(createJsonRpcError(id, -32601, `Method not found: ${message.method}`));
  } catch (error) {
    if (id !== null) writeMessage(createJsonRpcError(id, -32603, error instanceof Error ? error.message : 'Internal error'));
  }
}

async function callTool(name, args) {
  try {
    let payload;
    if (name === 'workbench_inspect_design_context') {
      payload = await requestAuthoring('/__workbench/authoring/design-context.json', args);
      payload = { ...payload, mcp: createMcpRuntimeInfo() };
      payload = args.responseProfile === 'full'
        ? { ...payload, responseProfile: 'full' }
        : compactDesignContextPayload(payload);
    } else if (name === 'workbench_confirm_design_requirements') {
      payload = await requestAuthoring('/__workbench/authoring/requirements/confirm.json', args);
    } else if (name === 'workbench_prepare_page_prompt') {
      payload = await requestAuthoring('/__workbench/authoring/execution-prompt.json', args);
    } else if (name === 'workbench_confirm_page_prompt') {
      payload = await requestAuthoring('/__workbench/authoring/execution-prompt/confirm.json', args);
    } else if (name === 'workbench_search_components') {
      const query = new URLSearchParams();
      if (typeof args.query === 'string') query.set('query', args.query);
      if (Array.isArray(args.roles)) query.set('roles', args.roles.join(','));
      if (Number.isFinite(args.limit)) query.set('limit', String(args.limit));
      payload = await requestAuthoring(`/__workbench/authoring/components.json?${query.toString()}`);
    } else if (name === 'workbench_plan_page') {
      payload = await requestAuthoring('/__workbench/authoring/plan.json', args);
    } else if (name === 'workbench_apply_page_operations') {
      payload = await requestAuthoring('/__workbench/authoring/apply.json', args);
    } else if (name === 'workbench_submit_render_evidence') {
      payload = await requestAuthoring('/__workbench/authoring/render-evidence.json', args);
    } else if (name === 'workbench_submit_visual_review') {
      payload = await requestAuthoring('/__workbench/authoring/visual-review.json', args);
    } else if (name === 'workbench_confirm_visual_approval') {
      payload = await requestAuthoring('/__workbench/authoring/visual-approval/confirm.json', args);
    } else if (name === 'workbench_verify_page') {
      payload = await requestAuthoring('/__workbench/authoring/verify.json', args);
    } else if (name === 'workbench_inspect_tokens') {
      payload = await requestAuthoring('/__workbench/authoring/tokens.json');
    } else if (name === 'workbench_upsert_tokens') {
      payload = await requestAuthoring('/__workbench/authoring/tokens/upsert.json', args);
    } else if (name === 'workbench_upsert_assets') {
      payload = await requestAuthoring('/__workbench/authoring/assets/upsert.json', args);
    } else if (name === 'workbench_inspect_component') {
      payload = await requestAuthoring('/__workbench/authoring/component.json', args);
    } else if (name === 'workbench_upsert_component') {
      payload = await requestAuthoring('/__workbench/authoring/component/upsert.json', args);
    } else {
      return toolError(`Unknown tool: ${name}`);
    }
    return {
      content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  } catch (error) {
    // Direct-filesystem mode throws raw authoring errors that carry `.violations` but no
    // `.payload`. Serializing them here keeps the actual contract failures visible to the
    // caller instead of collapsing everything into a bare message.
    const payload = error?.payload
      ?? (typeof error?.code === 'string' && error.code.startsWith('WB-AUTH-')
        ? serializeWorkbenchAuthoringError(error)
        : null);
    return {
      content: [{ type: 'text', text: payload ? JSON.stringify(payload, null, 2) : error instanceof Error ? error.message : 'Workbench authoring tool failed.' }],
      isError: true,
      ...(payload ? { structuredContent: payload } : {}),
    };
  }
}

function compactDesignContextPayload(payload) {
  const activePageId = payload.selection?.activeTarget?.pageId;
  const pageItems = prioritizeItems(
    payload.pages?.items ?? [],
    (page) => page.id === activePageId,
    20,
  );
  const compact = {
    ok: payload.ok,
    revision: payload.revision,
    responseProfile: 'compact',
    fullResponseAvailable: true,
    procedure: payload.procedure,
    project: payload.project,
    projectBinding: payload.projectBinding,
    mcp: payload.mcp,
    previewCss: compactPreviewCss(payload.previewCss),
    pages: payload.pages ? {
      total: payload.pages.total,
      truncated: Boolean(payload.pages.truncated || (payload.pages.items?.length ?? 0) > pageItems.length),
      items: pageItems,
    } : undefined,
    selection: payload.selection,
    components: payload.components ? {
      total: payload.components.total,
      unclassified: payload.components.unclassified,
      rolesTruncated: payload.components.rolesTruncated,
      nameIndex: payload.components.nameIndex ?? [],
      roles: (payload.components.roles ?? []).map(({ role, count, components }) => ({
        role,
        count,
        components: (components ?? []).map((component) => component.name),
      })),
      runtimeClasses: payload.components.runtimeClasses,
      variantComponentCount: payload.components.variantComponents?.length ?? 0,
    } : undefined,
    tokens: payload.tokens ? {
      total: payload.tokens.total,
      truncated: payload.tokens.truncated,
      collections: (payload.tokens.collections ?? []).map((collection) => ({
        id: collection.id,
        name: collection.name,
        layer: collection.layer,
        activeMode: collection.activeMode,
        modeCount: collection.modeCount,
        groupCount: collection.groupCount,
        tokenTypes: collection.tokenTypes,
        tokenCount: collection.tokenCount,
      })),
    } : undefined,
    assets: payload.assets ? {
      total: payload.assets.total,
      truncated: payload.assets.truncated,
      kinds: payload.assets.kinds,
      defaults: payload.assets.defaults,
      items: (payload.assets.items ?? []).slice(0, 20),
    } : undefined,
    notes: payload.notes ? {
      total: payload.notes.total,
      open: payload.notes.open,
      truncated: payload.notes.truncated,
      items: (payload.notes.items ?? []).slice(0, 10),
    } : undefined,
    organizationalContext: compactOrganizationalContext(payload.organizationalContext, 4),
    activeSource: compactActiveSource(payload.activeSource),
    briefReadiness: compactBriefReadiness(payload.briefReadiness),
    designIntelligence: payload.designIntelligence ? {
      status: payload.designIntelligence.status,
      stages: (payload.designIntelligence.stages ?? []).map((stage) => ({
        id: stage.id,
        status: stage.status,
        blocking: stage.blocking,
        missingFields: stage.missingFields,
        nextCollectionAction: stage.nextCollectionAction,
      })),
      collectionQueue: payload.designIntelligence.collectionQueue,
      promptPolicy: payload.designIntelligence.promptPolicy,
    } : undefined,
  };
  return fitCompactDesignContextBudget(compact);
}

function fitCompactDesignContextBudget(compact) {
  if (measureMcpPayload(compact) < COMPACT_RESPONSE_TEXT_BUDGET) return compact;

  const reduced = {
    ...compact,
    responseTruncated: true,
    pages: compact.pages ? {
      ...compact.pages,
      truncated: true,
      items: (compact.pages.items ?? []).slice(0, 4),
    } : undefined,
    components: compact.components ? {
      ...compact.components,
      rolesTruncated: true,
      // Keep the flat name index: knowing which components exist matters more than
      // knowing how they are grouped, so shed the per-role name lists first.
      roles: (compact.components.roles ?? []).slice(0, 12).map(({ role, count }) => ({ role, count })),
      runtimeClasses: (compact.components.runtimeClasses ?? []).slice(0, 8),
    } : undefined,
    tokens: compact.tokens ? {
      ...compact.tokens,
      truncated: true,
      collections: (compact.tokens.collections ?? []).slice(0, 6),
    } : undefined,
    assets: compact.assets ? {
      ...compact.assets,
      truncated: true,
      kinds: (compact.assets.kinds ?? []).slice(0, 8),
      defaults: undefined,
      defaultsTruncated: compact.assets.defaults != null,
      items: (compact.assets.items ?? []).slice(0, 2),
    } : undefined,
    notes: compact.notes ? {
      ...compact.notes,
      truncated: true,
      items: (compact.notes.items ?? []).slice(0, 3),
    } : undefined,
    organizationalContext: compactOrganizationalContext(compact.organizationalContext, 2),
    activeSource: reduceCompactActiveSource(compact.activeSource),
    briefReadiness: reduceCompactBriefReadiness(compact.briefReadiness),
    designIntelligence: compact.designIntelligence ? {
      ...compact.designIntelligence,
      truncated: true,
      stages: (compact.designIntelligence.stages ?? []).slice(0, 6),
      collectionQueue: (compact.designIntelligence.collectionQueue ?? []).slice(0, 3),
    } : undefined,
  };
  if (measureMcpPayload(reduced) < COMPACT_RESPONSE_TEXT_BUDGET) return reduced;

  const minimal = {
    ok: reduced.ok,
    revision: compactMcpText(reduced.revision, 200),
    responseProfile: 'compact',
    fullResponseAvailable: true,
    responseTruncated: true,
    procedure: (reduced.procedure ?? []).slice(0, 12),
    project: reduced.project,
    projectBinding: reduced.projectBinding,
    mcp: reduced.mcp,
    previewCss: reduced.previewCss,
    pages: summarizeCompactInventory(reduced.pages, 'items', 1),
    selection: reduced.selection,
    components: reduced.components ? {
      total: reduced.components.total,
      unclassified: reduced.components.unclassified,
      rolesTruncated: true,
      roles: [],
      runtimeClasses: [],
      variantComponentCount: reduced.components.variantComponentCount,
    } : undefined,
    tokens: summarizeCompactInventory(reduced.tokens, 'collections', 0),
    assets: reduced.assets ? {
      total: reduced.assets.total,
      truncated: true,
      kinds: (reduced.assets.kinds ?? []).slice(0, 4),
      defaultsTruncated: true,
      items: [],
    } : undefined,
    notes: reduced.notes ? {
      total: reduced.notes.total,
      open: reduced.notes.open,
      truncated: true,
      items: [],
    } : undefined,
    organizationalContext: summarizeCompactOrganizationalContext(reduced.organizationalContext),
    activeSource: summarizeCompactActiveSource(reduced.activeSource),
    briefReadiness: summarizeCompactBriefReadiness(reduced.briefReadiness),
    designIntelligence: reduced.designIntelligence ? {
      status: reduced.designIntelligence.status,
      stages: [],
      collectionQueue: (reduced.designIntelligence.collectionQueue ?? []).slice(0, 2),
      promptPolicy: reduced.designIntelligence.promptPolicy,
      truncated: true,
    } : undefined,
  };
  if (measureMcpPayload(minimal) < COMPACT_RESPONSE_TEXT_BUDGET) return minimal;

  return {
    ok: minimal.ok,
    revision: minimal.revision,
    responseProfile: 'compact',
    fullResponseAvailable: true,
    responseTruncated: true,
    project: minimal.project ? { id: minimal.project.id, name: minimal.project.name } : undefined,
    projectBinding: minimal.projectBinding ? {
      projectId: minimal.projectBinding.projectId,
      projectName: minimal.projectBinding.projectName,
      rootPath: compactMcpText(minimal.projectBinding.rootPath, 500),
      verifiedAt: minimal.projectBinding.verifiedAt,
    } : undefined,
    mcp: minimal.mcp,
    previewCss: minimal.previewCss,
    organizationalContext: summarizeCompactOrganizationalContext(minimal.organizationalContext),
    selection: minimal.selection ? {
      activeTarget: minimal.selection.activeTarget,
      selectedTargetCount: minimal.selection.selectedTargetCount,
      design: minimal.selection.design,
    } : undefined,
    briefReadiness: summarizeCompactBriefReadiness(minimal.briefReadiness),
  };
}

function compactOrganizationalContext(context, itemLimit) {
  if (!context) return context;
  const sections = context.sections ?? {};
  return {
    status: context.status,
    audience: context.audience,
    reviewStatus: context.reviewStatus,
    sourceFile: context.sourceFile,
    reason: compactMcpText(context.reason),
    disclosureBoundary: compactMcpText(context.disclosureBoundary, 800),
    filteredItemCount: context.filteredItemCount ?? 0,
    sections: Object.fromEntries(Object.entries(sections).map(([key, items]) => [
      key,
      (Array.isArray(items) ? items : []).slice(0, itemLimit).map((item) => compactMcpText(item)),
    ])),
  };
}

function summarizeCompactOrganizationalContext(context) {
  if (!context) return context;
  return {
    status: context.status,
    audience: context.audience,
    reviewStatus: context.reviewStatus,
    sourceFile: context.sourceFile,
    reason: compactMcpText(context.reason),
    disclosureBoundary: compactMcpText(context.disclosureBoundary, 500),
    filteredItemCount: context.filteredItemCount ?? 0,
    sectionItemCounts: Object.fromEntries(Object.entries(context.sections ?? {}).map(([key, items]) => [
      key,
      Array.isArray(items) ? items.length : 0,
    ])),
  };
}

function measureMcpPayload(payload) {
  return JSON.stringify(payload, null, 2).length;
}

function summarizeCompactInventory(section, itemKey, limit) {
  if (!section) return section;
  return {
    total: section.total,
    truncated: true,
    [itemKey]: (section[itemKey] ?? []).slice(0, limit),
  };
}

function reduceCompactActiveSource(activeSource) {
  if (!activeSource) return activeSource;
  return {
    ...activeSource,
    truncated: true,
    imports: (activeSource.imports ?? []).slice(0, 8),
    jsxElements: (activeSource.jsxElements ?? []).slice(0, 12),
    textSamples: (activeSource.textSamples ?? []).slice(0, 8),
    classTokens: (activeSource.classTokens ?? []).slice(0, 16),
  };
}

function summarizeCompactActiveSource(activeSource) {
  if (!activeSource) return activeSource;
  return {
    status: activeSource.status,
    sourceFile: compactMcpText(activeSource.sourceFile, 500),
    revision: activeSource.revision,
    lineCount: activeSource.lineCount,
    characterCount: activeSource.characterCount,
    parseDiagnostic: compactMcpText(activeSource.parseDiagnostic),
    truncated: true,
  };
}

function reduceCompactBriefReadiness(readiness) {
  if (!readiness) return readiness;
  return {
    ...readiness,
    missingFields: (readiness.missingFields ?? []).slice(0, 24),
    materialFields: (readiness.materialFields ?? []).slice(0, 24),
    questions: (readiness.questions ?? []).slice(0, 3),
    suggestedAssumptions: (readiness.suggestedAssumptions ?? []).slice(0, 1),
  };
}

function summarizeCompactBriefReadiness(readiness) {
  if (!readiness) return readiness;
  return {
    status: readiness.status,
    assumptionPolicy: readiness.assumptionPolicy,
    referenceIntent: readiness.referenceIntent,
    missingFields: (readiness.missingFields ?? []).slice(0, 16),
    materialFields: (readiness.materialFields ?? []).slice(0, 16),
    visualDirectionReadiness: readiness.visualDirectionReadiness,
    designCapabilityRouting: readiness.designCapabilityRouting,
    questions: (readiness.questions ?? []).slice(0, 3),
    suggestedAssumptions: (readiness.suggestedAssumptions ?? []).slice(0, 1),
    instruction: compactMcpText(readiness.instruction, 1200),
  };
}

function compactPreviewCss(previewCss) {
  if (!previewCss) return previewCss;
  const freshness = previewCss.renderFreshness;
  return {
    compiledCss: compactMcpText(previewCss.compiledCss, 500),
    mode: previewCss.mode,
    status: previewCss.status,
    tokenCss: compactMcpText(previewCss.tokenCss, 500),
    renderFreshness: freshness ? {
      error: compactMcpText(freshness.error),
      fresh: freshness.fresh,
      inputRevision: freshness.inputRevision,
      outputRevision: freshness.outputRevision,
      ready: freshness.ready,
      reason: compactMcpText(freshness.reason),
      representative: freshness.representative,
      state: freshness.state,
    } : undefined,
  };
}

function compactMcpText(value, limit = 600) {
  return typeof value === 'string' ? value.slice(0, limit) : value ?? null;
}

function createMcpRuntimeInfo() {
  const bridgeConnected = Boolean(
    process.env.WORKBENCH_AUTHORING_BRIDGE_URL?.trim()
    && process.env.WORKBENCH_AUTHORING_TOKEN?.trim(),
  );
  return {
    serverName: SERVER_NAME,
    serverVersion: SERVER_VERSION,
    toolProfile,
    transport: {
      mode: bridgeConnected ? 'local-bridge' : 'direct-filesystem',
      localBridgeConnected: bridgeConnected,
      previewCssSynchronization: bridgeConnected ? 'bridge-managed' : 'direct-managed',
    },
  };
}

function createDirectPreviewCssSyncEnvironment() {
  const environment = { ...process.env };
  delete environment.ESBUILD_BINARY_NAME;
  delete environment.ESBUILD_BINARY_PATH;
  environment.PATH = [dirname(process.execPath), process.env.PATH ?? '']
    .filter(Boolean)
    .join(delimiter);
  return environment;
}

function compactActiveSource(activeSource) {
  if (!activeSource) return activeSource;
  return {
    status: activeSource.status,
    sourceFile: activeSource.sourceFile,
    revision: activeSource.revision,
    lineCount: activeSource.lineCount,
    characterCount: activeSource.characterCount,
    imports: (activeSource.imports ?? []).slice(0, 20),
    exports: activeSource.exports,
    jsxElements: (activeSource.jsxElements ?? []).slice(0, 30),
    textSamples: (activeSource.textSamples ?? []).slice(0, 20),
    classTokens: (activeSource.classTokens ?? []).slice(0, 40),
    parseDiagnostic: activeSource.parseDiagnostic,
  };
}

function compactBriefReadiness(readiness) {
  if (!readiness) return readiness;
  return {
    status: readiness.status,
    assumptionPolicy: readiness.assumptionPolicy,
    referenceIntent: readiness.referenceIntent,
    missingFields: readiness.missingFields,
    materialFields: readiness.materialFields,
    visualDirectionReadiness: readiness.visualDirectionReadiness,
    designCapabilityRouting: readiness.designCapabilityRouting,
    questions: readiness.questions,
    suggestedAssumptions: readiness.suggestedAssumptions,
    instruction: readiness.instruction,
  };
}

function prioritizeItems(items, isPriority, limit) {
  const priority = items.filter(isPriority);
  const rest = items.filter((item) => !isPriority(item));
  return [...priority, ...rest].slice(0, limit);
}

async function requestAuthoring(path, body) {
  const baseUrl = process.env.WORKBENCH_AUTHORING_BRIDGE_URL?.trim().replace(/\/+$/, '');
  const token = process.env.WORKBENCH_AUTHORING_TOKEN?.trim();
  const isProjectBindingRequest = path === '/__workbench/authoring/design-context.json';
  if (!baseUrl || !token) {
    if (isProjectBindingRequest) {
      const projectRoot = await resolveDirectAuthoringProjectRoot(body?.projectTarget);
      const payload = await directAuthoringService.inspectDesignContext(projectRoot, body);
      authoringProjectBinding = payload.projectBinding;
      return payload;
    }
    const projectRoot = await getBoundDirectAuthoringProjectRoot();
    if (path.startsWith('/__workbench/authoring/components.json')) {
      const url = new URL(path, 'http://workbench.local');
      return directAuthoringService.search(projectRoot, {
        query: url.searchParams.get('query') ?? '',
        roles: (url.searchParams.get('roles') ?? '').split(',').map((role) => role.trim()).filter(Boolean),
        limit: Number(url.searchParams.get('limit') ?? '24'),
      });
    }
    if (path === '/__workbench/authoring/requirements/confirm.json') return directAuthoringService.confirmRequirements(projectRoot, body);
    if (path === '/__workbench/authoring/execution-prompt.json') return directAuthoringService.prepareExecutionPrompt(projectRoot, body);
    if (path === '/__workbench/authoring/execution-prompt/confirm.json') return directAuthoringService.confirmExecutionPrompt(projectRoot, body);
    if (path === '/__workbench/authoring/plan.json') return directAuthoringService.plan(projectRoot, body);
    if (path === '/__workbench/authoring/apply.json') return directAuthoringService.apply(projectRoot, body);
    if (path === '/__workbench/authoring/render-evidence.json') return directAuthoringService.submitRenderEvidence(projectRoot, body);
    if (path === '/__workbench/authoring/visual-review.json') return directAuthoringService.submitVisualReview(projectRoot, body);
    if (path === '/__workbench/authoring/visual-approval/confirm.json') return directAuthoringService.confirmVisualApproval(projectRoot, body);
    if (path === '/__workbench/authoring/verify.json') return directAuthoringService.verify(projectRoot, body);
    if (path === '/__workbench/authoring/tokens.json') return directAuthoringService.inspectTokens(projectRoot);
    if (path === '/__workbench/authoring/tokens/upsert.json') return directAuthoringService.upsertTokens(projectRoot, body);
    if (path === '/__workbench/authoring/assets/upsert.json') return directAuthoringService.upsertAssets(projectRoot, body);
    if (path === '/__workbench/authoring/component.json') return directAuthoringService.inspectComponent(projectRoot, body);
    if (path === '/__workbench/authoring/component/upsert.json') return directAuthoringService.upsertComponent(projectRoot, body);
    throw new Error(`Unsupported direct authoring path: ${path}`);
  }
  if (!isProjectBindingRequest && !authoringProjectBinding) {
    throw createMcpAuthoringError('WB-AUTH-PROJECT-SESSION-UNBOUND', 'This MCP session is not bound to a project. Call workbench_inspect_design_context with an explicit projectTarget first.');
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(!isProjectBindingRequest && authoringProjectBinding ? { 'X-Workbench-Authoring-Project-Id': authoringProjectBinding.projectId } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { ok: false, message: text || `Workbench authoring request failed with ${response.status}.` };
  }
  if (!response.ok) {
    const error = new Error(payload.message ?? `Workbench authoring request failed with ${response.status}.`);
    error.payload = payload;
    throw error;
  }
  if (isProjectBindingRequest) authoringProjectBinding = payload.projectBinding;
  return payload;
}

async function resolveDirectAuthoringProjectRoot(rawTarget) {
  const target = normalizeMcpProjectTarget(rawTarget);
  const explicitRoot = process.env.WORKBENCH_AUTHORING_PROJECT_ROOT?.trim();
  const candidateRoots = new Set();
  if (explicitRoot) {
    candidateRoots.add(resolve(explicitRoot));
  } else if (target.rootPath) {
    candidateRoots.add(resolve(target.rootPath));
  } else {
    candidateRoots.add(resolve(process.cwd()));
    candidateRoots.add(WORKBENCH_ROOT);
    const activeRoot = await readPersistedWorkbenchProjectRoot();
    if (activeRoot) candidateRoots.add(activeRoot);
    for (const projectRoot of await listWorkbenchProjectRoots()) candidateRoots.add(projectRoot);
  }
  const candidates = (await Promise.all([...candidateRoots].map(readWorkbenchProjectIdentity))).filter(Boolean);
  const matches = candidates.filter((candidate) => projectIdentityMatchesTarget(candidate, target));
  if (matches.length === 1) return matches[0].rootPath;
  if (matches.length > 1) {
    throw createMcpAuthoringError('WB-AUTH-PROJECT-TARGET-AMBIGUOUS', 'More than one Workbench project matches projectTarget. Add projectId or rootPath.', { candidates: matches });
  }
  throw createMcpAuthoringError('WB-AUTH-PROJECT-TARGET-NOT-FOUND', 'No Workbench project matches the explicit projectTarget. The last-opened project was not used as a fallback.', { requested: target, candidates: candidates.slice(0, 20), candidatesTruncated: candidates.length > 20 });
}

async function getBoundDirectAuthoringProjectRoot() {
  if (!authoringProjectBinding?.rootPath) {
    throw createMcpAuthoringError('WB-AUTH-PROJECT-SESSION-UNBOUND', 'This MCP session is not bound to a project. Call workbench_inspect_design_context with an explicit projectTarget first.');
  }
  const identity = await readWorkbenchProjectIdentity(authoringProjectBinding.rootPath);
  if (!identity || identity.projectId !== authoringProjectBinding.projectId || identity.projectName !== authoringProjectBinding.projectName) {
    authoringProjectBinding = null;
    throw createMcpAuthoringError('WB-AUTH-PROJECT-BINDING-STALE', 'The bound project identity changed or disappeared. Inspect and bind the intended project again.');
  }
  return identity.rootPath;
}

function normalizeMcpProjectTarget(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw createMcpAuthoringError('WB-AUTH-PROJECT-TARGET-REQUIRED', 'workbench_inspect_design_context requires projectTarget from the user request or trusted project context.');
  }
  const target = {
    projectId: typeof value.projectId === 'string' ? value.projectId.trim() : '',
    projectName: typeof value.projectName === 'string' ? value.projectName.trim() : '',
    rootPath: typeof value.rootPath === 'string' ? value.rootPath.trim() : '',
    evidence: value.evidence,
  };
  if (!target.projectId && !target.projectName && !target.rootPath) {
    throw createMcpAuthoringError('WB-AUTH-PROJECT-TARGET-REQUIRED', 'projectTarget must include projectId, projectName, or rootPath.');
  }
  return target;
}

async function readPersistedWorkbenchProjectRoot() {
  try {
    const state = JSON.parse(await readFile(ACTIVE_PROJECT_STATE_PATH, 'utf8'));
    return state && typeof state.rootPath === 'string' && state.rootPath.trim() ? resolve(state.rootPath) : null;
  } catch (error) {
    if (error?.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

async function listWorkbenchProjectRoots() {
  try {
    const entries = await readdir(resolve(WORKBENCH_ROOT, 'projects'), { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).slice(0, 250).map((entry) => resolve(WORKBENCH_ROOT, 'projects', entry.name));
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function readWorkbenchProjectIdentity(candidateRoot) {
  const rootPath = resolve(candidateRoot);
  try {
    await access(join(rootPath, '.workbench', 'workbench.config.json'));
    const config = JSON.parse(await readFile(join(rootPath, '.workbench', 'workbench.config.json'), 'utf8'));
    if (config?.workbench?.app !== 'workbench-v1' || typeof config?.projectId !== 'string') return null;
    return {
      projectId: config.projectId.trim(),
      projectName: typeof config.projectName === 'string' && config.projectName.trim() ? config.projectName.trim() : config.projectId.trim(),
      rootPath,
    };
  } catch (error) {
    if (error?.code === 'ENOENT' || error instanceof SyntaxError) return null;
    throw error;
  }
}

function projectIdentityMatchesTarget(candidate, target) {
  if (target.projectId && candidate.projectId !== target.projectId) return false;
  if (target.projectName && candidate.projectName.localeCompare(target.projectName, undefined, { sensitivity: 'accent' }) !== 0) return false;
  if (target.rootPath && candidate.rootPath !== resolve(target.rootPath)) return false;
  return true;
}

function createMcpAuthoringError(code, message, details = {}) {
  const error = new Error(message);
  error.payload = { ok: false, code, message, violations: [], ...details };
  return error;
}

function toolError(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function createJsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function writeMessage(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
