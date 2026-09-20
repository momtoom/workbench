import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { startWorkbenchLocalBridge } from '../dist-host/local-bridge/server.js';
import {
  WORKBENCH_AGENT_SKILLS_DIR,
  WORKBENCH_CLAUDE_SKILLS_DIR,
  WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL,
  createWorkbenchProjectGuideFiles,
} from './workbench-template.mjs';

const root = await mkdtemp(join(tmpdir(), 'workbench-authoring-'));
const outsideNotePath = join(root, '..', `${basename(root)}-outside.workbench-notes.json`);
const bridge = await startWorkbenchLocalBridge();

try {
  await createProject(root);
  await openProject(bridge, root);

  await expectStatus(fetch(`${bridge.url}/__workbench/authoring/components.json`), 401, 'catalog without token');
  await expectStatus(fetch(`${bridge.url}/__workbench/authoring/components.json`, {
    headers: { Authorization: `Bearer ${bridge.token}` },
  }), 401, 'catalog with general bridge token');
  await expectStatus(fetch(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: bridgeHeaders(bridge),
    body: JSON.stringify({ brief: {} }),
  }), 401, 'design context with general bridge token');
  await expectStatus(fetch(`${bridge.url}/__workbench/source/write.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ path: 'src/bypass.tsx', contents: 'export const bypass = true;\n', overwrite: true }),
  }), 401, 'raw source write with authoring token');

  const catalog = await fetchJson(`${bridge.url}/__workbench/authoring/components.json?roles=control.action`, {
    headers: authoringHeaders(bridge),
  });
  assert(catalog.components?.some((component) => component.id === 'component-button'), 'registered Button missing from catalog');
  const buttonContract = catalog.components.find((component) => component.id === 'component-button');
  assert(buttonContract.props?.some((prop) => prop.name === 'children' && prop.defaultValue === 'Button'), 'component catalog did not expose sourceInsert prop defaults');
  assert(buttonContract.props?.find((prop) => prop.name === 'children')?.options?.includes('Continue'), 'component catalog did not resolve const-backed argTypes options');

  const mismatchedProjectContext = await fetch(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({ projectTarget: { projectId: 'wb_015', evidence: { source: 'user', reference: 'User requested another project.' } }, brief: {} }),
  });
  assert(mismatchedProjectContext.status === 400 && (await mismatchedProjectContext.json()).code === 'WB-AUTH-PROJECT-TARGET-MISMATCH', 'design context did not reject a stale or mismatched project target');

  const vagueDesignContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: { experienceType: 'service-touchpoint' } }),
  });
  assert(vagueDesignContext.projectBinding?.projectId === 'authoring-test' && vagueDesignContext.projectBinding?.rootPath === root, 'design context did not return the verified project binding');
  assert(vagueDesignContext.project?.template?.id === 'standard', 'design context did not expose the project template');
  assert(
    vagueDesignContext.previewCss?.mode === 'disabled'
      && vagueDesignContext.previewCss?.renderFreshness?.fresh === true
      && vagueDesignContext.previewCss?.renderFreshness?.representative === true
      && vagueDesignContext.previewCss?.renderFreshness?.ready === true,
    'design context did not expose the render-ready non-Tailwind preview CSS disposition',
  );
  assert(vagueDesignContext.selection?.activeTarget?.pageId === 'page-active-service' && vagueDesignContext.selection?.design?.viewport?.width === 1280, 'design context did not expose the active canvas target and viewport');
  assert(vagueDesignContext.pages?.truncated === true && vagueDesignContext.pages.items.length === 100, 'design context did not bound a large page registry');
  assert(vagueDesignContext.components?.roles?.some((entry) => entry.role === 'control.action'), 'design context did not expose component role coverage');
  assert(vagueDesignContext.tokens?.collections?.some((collection) => collection.layer === 'primitive' && collection.tokenTypes.includes('dimension')), 'design context did not summarize token layers and types');
  assert(vagueDesignContext.assets?.items?.some((asset) => asset.id === 'asset-service-hero'), 'design context did not expose registered assets');
  assert(vagueDesignContext.assets?.items?.find((asset) => asset.id === 'asset-large-data')?.source.length <= 1024, 'design context did not bound a large asset source value');
  assert(!JSON.stringify(vagueDesignContext.assets).includes('previewIcons'), 'design context leaked large asset implementation metadata');
  assert(vagueDesignContext.notes?.items?.some((note) => note.title === 'Service promise'), 'design context did not expose bounded project notes');
  assert(vagueDesignContext.organizationalContext?.status === 'collected' && vagueDesignContext.organizationalContext?.audience === 'public', 'design context did not expose the curated public organizational context');
  assert(vagueDesignContext.organizationalContext?.sections?.principles?.includes('Keep service recovery decisions explainable and source-backed.'), 'design context omitted an allowlisted organizational principle');
  assert(!JSON.stringify(vagueDesignContext.organizationalContext).includes('private-retrospective') && vagueDesignContext.organizationalContext?.filteredItemCount === 1, 'design context leaked unstructured or unsafe organizational context');
  const organizationalContextPath = join(root, 'docs', 'workbench-agent', 'WORKBENCH-ORGANIZATIONAL-CONTEXT.md');
  const publicOrganizationalContext = await readFile(organizationalContextPath, 'utf8');
  await writeFile(organizationalContextPath, publicOrganizationalContext.replace('Audience: public', 'Audience: private'), 'utf8');
  const excludedOrganizationalContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: { experienceType: 'service-touchpoint' } }),
  });
  assert(excludedOrganizationalContext.organizationalContext?.status === 'excluded' && Object.values(excludedOrganizationalContext.organizationalContext?.sections ?? {}).every((items) => items.length === 0), 'design context returned organizational knowledge that was not marked public');
  await writeFile(organizationalContextPath, publicOrganizationalContext, 'utf8');
  assert(vagueDesignContext.activeSource?.status === 'collected' && vagueDesignContext.activeSource?.sourceFile === 'src/workbench-pages/ActiveService.tsx', 'design context did not collect the active source contract');
  assert(vagueDesignContext.activeSource?.jsxElements?.some((entry) => entry.name === 'article' && entry.count === 2), 'active source summary did not expose bounded JSX structure');
  assert(!vagueDesignContext.notes?.items?.some((note) => note.title === 'Outside secret'), 'design context followed a page sidecar path outside the project root');
  assert(
    vagueDesignContext.notes.items.findIndex((note) => note.title === 'Active page intent') < vagueDesignContext.notes.items.findIndex((note) => note.title === 'Other page intent'),
    'design context did not prioritize notes for the active page',
  );
  assert(vagueDesignContext.briefReadiness?.status === 'needs-clarification', 'vague service brief should request focused clarification');
  assert(
    vagueDesignContext.procedure?.length === 6
      && vagueDesignContext.procedure[0]?.id === 'project-binding'
      && vagueDesignContext.procedure[1]?.id === 'product-thinking'
      && vagueDesignContext.procedure[2]?.id === 'source-composition'
      && vagueDesignContext.procedure[3]?.id === 'design-identity'
      && vagueDesignContext.procedure[4]?.id === 'workbench-editability'
      && vagueDesignContext.procedure[5]?.id === 'practical-review',
    'design context did not expose the editable-v1 authoring procedure',
  );
  assert(
    /borderless/i.test(vagueDesignContext.procedure[3]?.requirement ?? '')
      && /popovers, sheets, dropdowns/i.test(vagueDesignContext.procedure[1]?.requirement ?? '')
      && /never silently accept/i.test(vagueDesignContext.procedure[5]?.requirement ?? ''),
    'authoring procedure lost the default design-effort commitments',
  );
  assert(vagueDesignContext.designIntelligence?.stages?.length === 12, 'design context did not expose the complete design-intelligence collection stages');
  assert(vagueDesignContext.designIntelligence?.stages?.some((entry) => entry.id === 'workflow-and-domain' && entry.status === 'missing' && entry.blocking === false), 'design intelligence did not preserve missing workflow context as non-blocking guidance');
  assert(vagueDesignContext.designIntelligence?.promptPolicy?.approvalRequiredBeforePlanning === false, 'design intelligence still exposed prompt approval as a mandatory gate');
  assert(vagueDesignContext.briefReadiness.questions.length > 0 && vagueDesignContext.briefReadiness.questions.length <= 3, 'vague brief should return one round of at most three questions');
  assert(vagueDesignContext.briefReadiness.questions[0].fields.includes('journeyMoment'), 'service design clarification should include the journey moment');
  assert(vagueDesignContext.briefReadiness.questions.some((question) => question.id === 'visual-composition-and-disclosure'), 'vague design context must ask about surface topology and disclosure ownership');
  assert(vagueDesignContext.briefReadiness.instruction.includes('candidate questions'), 'design context should require host-side filtering against known project facts');

  const partialDesignContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      projectTarget: createProjectTarget(),
      brief: {
        experienceType: 'service-touchpoint',
        audience: 'Busy travelers',
        primaryOutcome: 'Confirm a recovery option',
        contentPriorities: ['Recovery options', 'consequences', 'confirmation'],
        creativeDirection: 'Calm and operationally honest',
      },
    }),
  });
  assert(partialDesignContext.briefReadiness.questions.length <= 3, 'partial briefs should group remaining high-impact questions into one focused round');
  assert(!partialDesignContext.briefReadiness.questions.flatMap((question) => question.fields).includes('audience'), 'partial briefs should not repeat a known audience question');

  const assumedDesignContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: { experienceType: 'service-touchpoint' }, assumptionPolicy: 'agent-may-assume' }),
  });
  assert(assumedDesignContext.briefReadiness?.status === 'needs-clarification', 'delegated judgment must not bypass high-impact product, state, ownership, or data questions');
  assert(assumedDesignContext.briefReadiness.questions.length > 0, 'agent-may-assume should preserve grouped high-impact questions');

  const ambiguousReferenceBrief = createReadyBrief();
  ambiguousReferenceBrief.referenceAnalysis.implementationMode = 'unresolved';
  const ambiguousReferenceContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: ambiguousReferenceBrief, assumptionPolicy: 'agent-may-assume' }),
  });
  assert(ambiguousReferenceContext.briefReadiness?.status === 'needs-clarification', 'an unresolved reference implementation mode must block authoring');
  assert(ambiguousReferenceContext.briefReadiness?.referenceIntent?.status === 'needs-clarification', 'design context did not expose the unresolved exact-conversion versus adapt-to-project decision');
  assert(ambiguousReferenceContext.briefReadiness?.questions?.[0]?.id === 'reference-implementation-intent', 'ambiguous reference intent must be the first clarification question');
  assert(/Do not implement yet/i.test(ambiguousReferenceContext.briefReadiness?.instruction ?? ''), 'ambiguous reference intent did not return a hard pre-write instruction');

  const readyDesignContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      projectTarget: createProjectTarget(),
      brief: createReadyBrief(),
    }),
  });
  assert(readyDesignContext.briefReadiness?.status === 'ready', 'materially complete brief should not force a brand art-direction question');
  assert(readyDesignContext.briefReadiness?.referenceIntent?.status === 'resolved' && readyDesignContext.briefReadiness?.referenceIntent?.implementationMode === 'adapt-to-project', 'resolved reference intent was not preserved in compact design context');
  assert(readyDesignContext.briefReadiness.questions.length === 0, 'ready brief should not ask low-impact brand preference questions');
  assert(readyDesignContext.briefReadiness.visualDirectionReadiness?.status === 'grounded', 'supplied visual target should ground art direction independently from product readiness');
  assert(readyDesignContext.briefReadiness.designCapabilityRouting?.hosts?.some((entry) => entry.host === 'codex' && entry.provider === 'codex-product-design'), 'design context did not expose Codex Product Design routing');
  assert(readyDesignContext.briefReadiness.designCapabilityRouting?.required === false, 'grounded design context should not require a design plugin');
  assert(readyDesignContext.designIntelligence?.status === 'ready-for-authoring', 'complete evidence did not permit direct authoring');
  assert(readyDesignContext.briefReadiness.requirementChecklist.find((entry) => entry.id === 'reference')?.status === 'confirmed', 'reference deconstruction was not represented in the readiness checklist');

  const componentRegistryPath = join(root, '.workbench', 'components.json');
  const componentRegistry = JSON.parse(await readFile(componentRegistryPath, 'utf8'));
  componentRegistry.components[0].variants = [{ id: 'service', name: 'Service' }];
  await writeJson(componentRegistryPath, componentRegistry);
  const variantDesignContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: createReadyBrief() }),
  });
  assert(variantDesignContext.revision !== vagueDesignContext.revision, 'design context revision did not change after a variants-only registry change');
  assert(variantDesignContext.components?.variantComponents?.some((component) => component.names.includes('Service')), 'design context did not expose bounded component variants');

  if (process.env.WORKBENCH_RUN_HISTORICAL_STRUCTURED_GATE_AUDIT === '1') {
  const unresolvedConfirmation = await fetch(`${bridge.url}/__workbench/authoring/requirements/confirm.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ ...createRequirementsConfirmation(variantDesignContext.revision), unresolvedQuestions: ['Who approves the recovery action?'] }),
  });
  assert(unresolvedConfirmation.status === 400, `requirements with unresolved questions should be rejected, got ${unresolvedConfirmation.status}`);
  assert((await unresolvedConfirmation.json()).code === 'WB-AUTH-REQUIREMENTS-UNRESOLVED', 'unresolved requirements did not identify the confirmation gate');

  const assumedEvidence = createRequirementsConfirmation(variantDesignContext.revision);
  assumedEvidence.fieldEvidence[0].source = 'agent-assumption';
  const assumedEvidenceConfirmation = await fetch(`${bridge.url}/__workbench/authoring/requirements/confirm.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(assumedEvidence),
  });
  assert(assumedEvidenceConfirmation.status === 400, `agent-assumption evidence should be rejected, got ${assumedEvidenceConfirmation.status}`);
  assert((await assumedEvidenceConfirmation.json()).code === 'WB-AUTH-EVIDENCE-SOURCE', 'agent-assumption evidence did not identify the grounding rule');

  const confirmedRequirements = await fetchJson(`${bridge.url}/__workbench/authoring/requirements/confirm.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify(createRequirementsConfirmation(variantDesignContext.revision)),
  });
  assert(confirmedRequirements.requirements?.id, 'confirmed requirements id missing');
  assert(confirmedRequirements.procedure?.length === 14, 'requirements confirmation did not return the complete authoring procedure');
  const requirementsId = confirmedRequirements.requirements.id;

  const gatewayExecutionPrompt = await prepareExecutionPrompt(bridge, requirementsId, {
    pageName: 'Gateway Page', route: '/gateway', sourceFile: 'src/workbench-pages/GatewayPage.tsx',
  });
  assert(gatewayExecutionPrompt.executionPrompt?.prompt?.includes('Do not generate design images unless the user separately asks for them.'), 'execution prompt did not make image generation optional');
  assert(gatewayExecutionPrompt.executionPrompt?.prompt?.includes('If the user does not respond before hold expiry'), 'execution prompt omitted the confirmed non-response rule');
  assert(gatewayExecutionPrompt.executionPrompt?.prompt?.includes('chronological event stream'), 'execution prompt omitted the deconstructed reference structure');

  const unapprovedPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: gatewayExecutionPrompt.executionPrompt.id,
      pageName: 'Gateway Page', exportName: 'GatewayPage', route: '/gateway', sourceFile: 'src/workbench-pages/GatewayPage.tsx',
      intents: ['control.action'],
      ...createDesignContract(),
    }),
  });
  assert(unapprovedPlan.status === 400, `planning before explicit prompt approval should be rejected, got ${unapprovedPlan.status}`);
  assert((await unapprovedPlan.json()).code === 'WB-AUTH-EXECUTION-APPROVAL-MISSING', 'unapproved execution prompt did not block planning');

  const gatewayPromptApproval = await approveExecutionPrompt(bridge, gatewayExecutionPrompt.executionPrompt.id, '사용자가 출력된 Gateway Page 실행 프롬프트를 승인함');
  const gatewayApprovedPromptId = gatewayPromptApproval.approval.id;

  const unresolvedVisualContext = await fetchJson(`${bridge.url}/__workbench/authoring/design-context.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ projectTarget: createProjectTarget(), brief: { ...createReadyBrief(), visualTargetStatus: 'unresolved', visualTargetReferences: [] } }),
  });
  assert(unresolvedVisualContext.briefReadiness?.status === 'ready' && unresolvedVisualContext.briefReadiness?.visualDirectionReadiness?.status === 'clarification-required', 'functional readiness should remain separate from unresolved art direction');
  assert(unresolvedVisualContext.briefReadiness?.designCapabilityRouting?.required === false, 'unresolved art direction should route to evidence-backed clarification instead of requiring a design plugin');
  assert(unresolvedVisualContext.briefReadiness?.designCapabilityRouting?.hosts?.some((entry) => entry.host === 'codex' && entry.preferredSkills?.length === 1 && entry.preferredSkills[0] === 'product-design:index'), 'Codex routing should use the stable Product Design entry-point skill before optional ideation');
  const unresolvedVisualRequirements = await fetchJson(`${bridge.url}/__workbench/authoring/requirements/confirm.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(createRequirementsConfirmation(unresolvedVisualContext.revision)),
  });
  const unresolvedVisualRequirementsId = unresolvedVisualRequirements.requirements.id;
  const unresolvedVisualApprovedPromptId = await prepareAndApproveExecutionPrompt(bridge, unresolvedVisualRequirementsId, {
    pageName: 'Visual Exploration Gate', route: '/visual-exploration-gate', sourceFile: 'src/workbench-pages/VisualExplorationGate.tsx',
  });
  const fallbackContract = createFocusedDesignContract();
  fallbackContract.designEvidence.skill = 'model-only-design-judgment';
  fallbackContract.designEvidence.capability = {
    host: 'codex', provider: 'model-fallback', status: 'unavailable', skill: 'model-only-design-judgment', evidenceReferences: ['capability:product-design-unavailable', 'fixture:service-timeline-reference'],
  };
  const fallbackPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      requirementsId: unresolvedVisualRequirementsId, approvedPromptId: unresolvedVisualApprovedPromptId,
      pageName: 'Fallback Visual Gate', exportName: 'FallbackVisualGate', route: '/fallback-visual-gate', sourceFile: 'src/workbench-pages/FallbackVisualGate.tsx', intents: ['layout.group'],
      ...fallbackContract,
    }),
  });
  assert(fallbackPlan.status === 400 && (await fallbackPlan.json()).code === 'WB-AUTH-VISUAL-SELECTION-REQUIRED', 'unresolved art direction did not block an unconfirmed inferred direction');
  const confirmedInferenceContract = createFocusedDesignContract();
  confirmedInferenceContract.designEvidence.skill = 'model-only-design-judgment';
  confirmedInferenceContract.designEvidence.capability = {
    host: 'codex', provider: 'model-fallback', status: 'unavailable', skill: 'model-only-design-judgment', evidenceReferences: ['capability:evidence-backed-inference', 'fixture:service-timeline-reference'],
  };
  confirmedInferenceContract.designEvidence.visualExploration.selectionEvidence = {
    source: 'user', reference: 'user-confirmation:evidence-backed-direction',
  };
  const confirmedInferencePlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      requirementsId: unresolvedVisualRequirementsId, approvedPromptId: unresolvedVisualApprovedPromptId,
      pageName: 'Confirmed Inference Gate', exportName: 'ConfirmedInferenceGate', route: '/confirmed-inference-gate', sourceFile: 'src/workbench-pages/ConfirmedInferenceGate.tsx', intents: ['layout.group'],
      ...confirmedInferenceContract,
    }),
  });
  assert(confirmedInferencePlan.plan?.designEvidence?.mode === 'focused' && confirmedInferencePlan.plan?.designEvidence?.visualExploration?.options?.length === 1, 'user-confirmed evidence-backed inference should allow one focused visual target');
  const exploredVisualContract = createExploredVisualDesignContract();
  const exploredVisualPlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      requirementsId: unresolvedVisualRequirementsId, approvedPromptId: unresolvedVisualApprovedPromptId,
      pageName: 'Visual Exploration Gate', exportName: 'VisualExplorationGate', route: '/visual-exploration-gate', sourceFile: 'src/workbench-pages/VisualExplorationGate.tsx', intents: ['layout.group'],
      ...exploredVisualContract,
    }),
  });
  assert(exploredVisualPlan.plan?.designEvidence?.mode === 'focused' && exploredVisualPlan.plan?.designEvidence?.visualExploration?.options?.length === 2, 'explicit art-direction exploration should allow a context-appropriate option count independent from focused product ideation');

  const missingRequirementsPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge),
    body: JSON.stringify({ pageName: 'Missing Requirements', route: '/missing-requirements', sourceFile: 'src/workbench-pages/MissingRequirements.tsx', intents: ['surface.card'], ...createDesignContract() }),
  });
  assert(missingRequirementsPlan.status === 400, `planning without requirementsId should be rejected, got ${missingRequirementsPlan.status}`);
  assert((await missingRequirementsPlan.json()).code === 'WB-AUTH-REQUIREMENTS-ID', 'missing requirementsId did not block page planning');

  const componentPathPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      pageName: 'Unauthorized Component',
      route: '/unauthorized-component',
      sourceFile: 'src/components/ui/UnauthorizedComponent.tsx',
      intents: ['surface.card'],
    }),
  });
  assert(componentPathPlan.status === 400, `page authoring should reject component source paths, got ${componentPathPlan.status}`);
  const componentPathPayload = await componentPathPlan.json();
  assert(componentPathPayload.code === 'WB-AUTH-COMPONENT-PATH', 'component path rejection did not identify the user-approved workflow boundary');

  const proseOnlyPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      pageName: 'Prose Only',
      route: '/prose-only',
      sourceFile: 'src/workbench-pages/ProseOnly.tsx',
      intents: ['surface.card'],
    }),
  });
  assert(proseOnlyPlan.status === 400, `planning without visual design evidence should be rejected, got ${proseOnlyPlan.status}`);
  assert((await proseOnlyPlan.json()).code === 'WB-AUTH-DESIGN-EVIDENCE-MISSING', 'missing design evidence rejection did not identify the visual-design skill gate');

  const duplicateOptionsContract = createDesignContract();
  const duplicateSource = duplicateOptionsContract.designEvidence.options[0];
  const duplicateTarget = duplicateOptionsContract.designEvidence.options[1];
  duplicateTarget.experienceHypothesis = duplicateSource.experienceHypothesis;
  duplicateTarget.primaryDecision = duplicateSource.primaryDecision;
  duplicateTarget.dominantEvidence = duplicateSource.dominantEvidence;
  duplicateTarget.interactionModel = duplicateSource.interactionModel;
  duplicateTarget.disclosureModel = duplicateSource.disclosureModel;
  duplicateTarget.informationArchitecture = [...duplicateSource.informationArchitecture].reverse();
  duplicateTarget.serviceTradeoff = duplicateSource.serviceTradeoff;
  const duplicateOptionsPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      pageName: 'Duplicate Options',
      route: '/duplicate-options',
      sourceFile: 'src/workbench-pages/DuplicateOptions.tsx',
      intents: ['layout.group'],
      ...duplicateOptionsContract,
    }),
  });
  assert(duplicateOptionsPlan.status === 400, `restyled or reordered duplicate options should be rejected, got ${duplicateOptionsPlan.status}`);
  assert((await duplicateOptionsPlan.json()).code === 'WB-AUTH-DESIGN-DIFFERENTIATION-FALSE', 'duplicate option rejection did not identify false semantic differentiation');

  const focusedOptionsPlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: await prepareAndApproveExecutionPrompt(bridge, requirementsId, { pageName: 'Focused Direction', route: '/focused-direction', sourceFile: 'src/workbench-pages/FocusedDirection.tsx' }),
      pageName: 'Focused Direction',
      route: '/focused-direction',
      sourceFile: 'src/workbench-pages/FocusedDirection.tsx',
      intents: ['layout.group'],
      ...createFocusedDesignContract(),
    }),
  });
  assert(focusedOptionsPlan.plan?.designEvidence?.mode === 'focused' && focusedOptionsPlan.plan.designEvidence.options.length === 1, 'settled product direction should accept one focused visual target without manufactured alternatives');

  const failedTargetContract = createDesignContract();
  failedTargetContract.designEvidence.constraintAssessments[0] = {
    constraintId: 'single-content-surface',
    status: 'revise',
    note: 'The mock still splits page content into full-height columns.',
  };
  const failedTargetPlan = await fetch(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: await prepareAndApproveExecutionPrompt(bridge, requirementsId, { pageName: 'Failed Visual Target', route: '/failed-visual-target', sourceFile: 'src/workbench-pages/FailedVisualTarget.tsx' }),
      pageName: 'Failed Visual Target',
      route: '/failed-visual-target',
      sourceFile: 'src/workbench-pages/FailedVisualTarget.tsx',
      intents: ['layout.group'],
      ...failedTargetContract,
    }),
  });
  assert(failedTargetPlan.status === 400, `planning from a selected mock that violates visual constraints should be rejected, got ${failedTargetPlan.status}`);
  assert((await failedTargetPlan.json()).code === 'WB-AUTH-VISUAL-CONSTRAINT-FAILED', 'failed selected visual target did not identify the visual-composition gate');

  const plan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: gatewayApprovedPromptId,
      pageName: 'Gateway Page',
      exportName: 'GatewayPage',
      route: '/gateway',
      sourceFile: 'src/workbench-pages/GatewayPage.tsx',
      intents: ['control.action', 'collection.unregistered-example'],
      ...createDesignContract(),
    }),
  });
  assert(plan.plan?.id, 'authoring plan id missing');
  assert(
    plan.promotionCandidates?.some((candidate) => candidate.intent === 'collection.unregistered-example' && candidate.status === 'approval-required'),
    'unmatched semantic intent should be reported as an approval-required promotion candidate',
  );
  assert(
    !plan.promotionCandidates?.some((candidate) => candidate.intent === 'control.action'),
    'matched semantic intent should not be reported as a promotion candidate',
  );

  const rejected = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: plan.plan.id,
      root: {
        kind: 'element',
        tag: 'button',
        purpose: 'semantic',
        children: [{ kind: 'text', value: 'Bypass' }],
      },
    }),
  });
  assert(rejected.status === 400, `native button should be rejected, got ${rejected.status}`);
  const rejectedPayload = await rejected.json();
  assert(rejectedPayload.violations?.some((violation) => violation.code === 'WB-AUTH-NATIVE-REPLACED'), 'native button rejection did not return registered replacement');
  const rejectedProp = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: plan.plan.id,
      root: {
        kind: 'component',
        componentId: 'component-button',
        intent: 'control.action',
        props: { variant: 'invented' },
        children: [{ kind: 'text', value: 'Continue' }],
      },
    }),
  });
  assert(rejectedProp.status === 400, `unknown registered-component prop should be rejected, got ${rejectedProp.status}`);
  assert((await rejectedProp.json()).violations?.some((violation) => violation.code === 'WB-AUTH-COMPONENT-PROP-UNKNOWN'), 'component prop rejection did not identify the sourceInsert contract');
  const rejectedOption = await fetch(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: plan.plan.id,
      root: {
        kind: 'component',
        componentId: 'component-button',
        intent: 'control.action',
        props: { children: 'Invented label' },
      },
    }),
  });
  assert(rejectedOption.status === 400, `invalid registered-component prop option should be rejected, got ${rejectedOption.status}`);
  assert((await rejectedOption.json()).violations?.some((violation) => violation.code === 'WB-AUTH-COMPONENT-PROP-OPTION'), 'component prop rejection did not enforce argTypes options');

  const applied = await fetchJson(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: plan.plan.id,
      root: {
        kind: 'element',
        tag: 'main',
        purpose: 'layout',
        props: { className: 'grid gap-4' },
        children: [
          { kind: 'element', tag: 'p', purpose: 'content', children: [{ kind: 'text', value: 'Native editable copy' }] },
          {
            kind: 'element',
            tag: 'article',
            purpose: 'content',
            intent: 'surface.playlist',
            props: { className: 'py-4' },
            children: [{ kind: 'text', value: 'No registered component, so keep explicit native JSX' }],
          },
          { kind: 'component', componentId: 'component-button', intent: 'control.action', children: [{ kind: 'text', value: 'Continue' }] },
        ],
      },
    }),
  });
  assert(applied.verification?.ok, 'generated page did not pass authoring verification');
  assert(applied.previewCss?.status === 'not-configured', 'authoring apply did not return an explicit preview CSS synchronization disposition');
  assert(applied.previewCss?.renderFreshness?.ready === true, 'authoring apply did not preserve the render-ready non-Tailwind disposition');
  assert(applied.verification.summary.registeredComponentInstances === 1, 'registered component instance count mismatch');
  assert(applied.visualQualityGate?.required === true, 'apply did not require the rendered visual quality gate');

  const wideBefore = await submitRenderEvidence(bridge, { sourceRevision: applied.revision, renderRevision: applied.renderRevision, phase: 'before-refinement', width: 1440, height: 1024, seed: 11 });
  const compactBefore = await submitRenderEvidence(bridge, { sourceRevision: applied.revision, renderRevision: applied.renderRevision, phase: 'before-refinement', width: 390, height: 844, seed: 12 });
  const refinedPlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: gatewayApprovedPromptId,
      pageName: 'Gateway Page',
      exportName: 'GatewayPage',
      route: '/gateway',
      sourceFile: 'src/workbench-pages/GatewayPage.tsx',
      intents: ['control.action', 'collection.unregistered-example'],
      ...createDesignContract(),
    }),
  });
  const refinedApplied = await fetchJson(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: refinedPlan.plan.id,
      root: {
        kind: 'element', tag: 'main', purpose: 'layout', props: { className: 'grid gap-6' },
        children: [
          { kind: 'element', tag: 'p', purpose: 'content', children: [{ kind: 'text', value: 'Native editable copy' }] },
          { kind: 'element', tag: 'article', purpose: 'content', intent: 'surface.playlist', props: { className: 'py-4' }, children: [{ kind: 'text', value: 'No registered component, so keep explicit native JSX' }] },
          { kind: 'component', componentId: 'component-button', intent: 'control.action', children: [{ kind: 'text', value: 'Continue' }] },
        ],
      },
    }),
  });
  assert(refinedApplied.revision !== applied.revision, 'refinement apply did not create a fresh source revision');
  const wideAfter = await submitRenderEvidence(bridge, { sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'after-refinement', width: 1440, height: 1024, seed: 21 });
  const compactAfter = await submitRenderEvidence(bridge, { sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'after-refinement', width: 390, height: 844, seed: 22 });

  const source = await readFile(join(root, 'src', 'workbench-pages', 'GatewayPage.tsx'), 'utf8');
  assert(source.includes('export default function GatewayPage()'), 'generated page root must use the default export contract expected by Workbench projects');
  assert(source.includes('import { Button }'), 'generated page did not import registered Button');
  assert(source.includes('<Button>'), 'generated page did not render registered Button');
  assert(!source.includes('.map('), 'generated page introduced a map expression');
  assert(!source.includes('function Card'), 'generated page introduced a local component');

  const pages = JSON.parse(await readFile(join(root, '.workbench', 'pages.json'), 'utf8'));
  assert(pages.pages.some((page) => page.sourceFile === 'src/workbench-pages/GatewayPage.tsx'), 'generated page was not registered');
  const gatewayPage = pages.pages.find((page) => page.sourceFile === 'src/workbench-pages/GatewayPage.tsx');
  assert(gatewayPage.extensions?.authoringGateway?.version === 'structured-v8', 'generated page did not persist the structured-v8 contract');
  assert(gatewayPage.extensions?.authoringGateway?.approvedPromptId === gatewayApprovedPromptId && gatewayPage.extensions?.authoringGateway?.refinementAttempt === 1, 'in-scope refinement did not reuse the initial prompt approval or track its bounded attempt');
  assert(gatewayPage.extensions?.authoringGateway?.geometryContract?.gridUnitPx === 8, 'generated page did not persist the strict 8px geometry contract');
  assert(gatewayPage.extensions?.authoringGateway?.requirementsId === requirementsId && gatewayPage.extensions?.authoringGateway?.requirements?.sections?.length === 3, 'generated page did not persist confirmed requirements and section intent');
  assert(gatewayPage.extensions?.authoringGateway?.requirements?.visualComposition?.surfaceModel === 'single-surface', 'generated page did not persist the confirmed visual-composition contract');

  const unreviewed = await fetchJson(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ sourceFile: 'src/workbench-pages/GatewayPage.tsx', exportName: 'GatewayPage' }),
  });
  assert(!unreviewed.ok && unreviewed.violations.some((violation) => violation.code === 'WB-AUTH-VISUAL-REVIEW-MISSING'), 'structured-v8 verification should remain incomplete before rendered review');
  assert(unreviewed.previewCss?.renderFreshness?.ready === true, 'verification did not expose preview CSS render readiness');

  const wideFinal = await submitRenderEvidence(bridge, { sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'final', width: 1440, height: 1024, seed: 18, renderer: 'workbench-browser-preview' });
  const compactFinal = await submitRenderEvidence(bridge, { sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'final', width: 390, height: 844, seed: 19, renderer: 'workbench-design-canvas' });
  const directFinalReview = createAcceptedVisualReview({
    sourceRevision: refinedApplied.revision,
    renderRevision: refinedApplied.renderRevision,
    wideBeforeId: wideBefore.receipt.id,
    wideAfterId: wideAfter.receipt.id,
    compactBeforeId: compactBefore.receipt.id,
    compactAfterId: compactAfter.receipt.id,
  });
  directFinalReview.comparisons = [
    { evidenceId: wideFinal.receipt.id, observedAttentionOrder: ['Confirm recovery path', 'Compare consequences', 'Review operational detail'], findings: ['Workbench Browser Preview shows the intended wide hierarchy.'] },
    { evidenceId: compactFinal.receipt.id, observedAttentionOrder: ['Confirm recovery path', 'Compare consequences', 'Review operational detail'], findings: ['Workbench Design Canvas preserves the compact hierarchy.'] },
  ];
  directFinalReview.refinement = {
    status: 'not-required',
    changes: [],
    rationale: 'The first final render met the approved contract and objective gates.',
    sourceChangesReference: 'not-required:first-render-passed',
  };
  const directFinalReviewResult = await fetchJson(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify(directFinalReview),
  });
  assert(directFinalReviewResult.ok, 'a passing first render should be reviewable without a forced refinement cycle');

  const acceptedVisualReview = createAcceptedVisualReview({
    sourceRevision: refinedApplied.revision,
    renderRevision: refinedApplied.renderRevision,
    wideBeforeId: wideBefore.receipt.id,
    wideAfterId: wideAfter.receipt.id,
    compactBeforeId: compactBefore.receipt.id,
    compactAfterId: compactAfter.receipt.id,
  });
  const sameSessionReview = structuredClone(acceptedVisualReview);
  sameSessionReview.reviewer.sessionId = 'gateway-authoring-session';
  const sameSessionResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(sameSessionReview),
  });
  assert(sameSessionResponse.status === 400 && (await sameSessionResponse.json()).code === 'WB-AUTH-VISUAL-REVIEWER-NOT-INDEPENDENT', 'visual review should reject the page authoring session as its own independent reviewer');

  const lowScoreReview = structuredClone(acceptedVisualReview);
  lowScoreReview.scorecard.typography = { score: 79, status: 'pass', note: 'Below the non-averaged category threshold.' };
  const lowScoreResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(lowScoreReview),
  });
  assert(lowScoreResponse.status === 400 && (await lowScoreResponse.json()).code === 'WB-AUTH-VISUAL-SCORE-FAILED', 'one weak category should fail even when the remaining scorecard is strong');

  const badObjectiveEvidence = await submitRenderEvidence(bridge, {
    sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'after-refinement', width: 1440, height: 1024, seed: 23,
    metrics: { contrastViolationCount: 1 },
  });
  const badObjectiveReview = structuredClone(acceptedVisualReview);
  badObjectiveReview.comparisons[0].afterEvidenceId = badObjectiveEvidence.receipt.id;
  const badObjectiveResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(badObjectiveReview),
  });
  assert(badObjectiveResponse.status === 400 && (await badObjectiveResponse.json()).code === 'WB-AUTH-VISUAL-OBJECTIVE-FAILED', 'objective render blockers should prevent visual acceptance');

  for (const [name, mutateGeometry, expectedViolation] of [
    ['grid', (geometry) => { geometry.elements[0].rect.x = 9; }, 'WB-AUTH-GRID-DEVIATION'],
    ['padding', (geometry) => { geometry.elements[0].padding.right = 24; }, 'WB-AUTH-PADDING-ASYMMETRY'],
    ['optical', (geometry) => { geometry.elements[0].inkBounds.x = 32; geometry.elements[0].opticalCentroid.x += 4; }, 'WB-AUTH-OPTICAL-INSET'],
  ]) {
    const geometry = createGeometryMeasurements(1440, 1024);
    mutateGeometry(geometry);
    const badGeometryEvidence = await submitRenderEvidence(bridge, {
      sourceRevision: refinedApplied.revision, renderRevision: refinedApplied.renderRevision, phase: 'after-refinement', width: 1440, height: 1024, seed: 30 + name.length, geometry,
    });
    assert(badGeometryEvidence.receipt.geometryEvaluation.passed === false && badGeometryEvidence.receipt.geometryEvaluation.violations.some((violation) => violation.code === expectedViolation), `${name} geometry evidence did not expose the expected server-computed violation`);
    const badGeometryReview = structuredClone(acceptedVisualReview);
    badGeometryReview.comparisons[0].afterEvidenceId = badGeometryEvidence.receipt.id;
    const badGeometryResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
      method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(badGeometryReview),
    });
    assert(badGeometryResponse.status === 400 && (await badGeometryResponse.json()).code === 'WB-AUTH-MATHEMATICAL-QUALITY-FAILED', `${name} geometry violations should prevent visual acceptance`);
  }

  const failedVisualReview = structuredClone(acceptedVisualReview);
  failedVisualReview.constraintAssessments[1] = {
    constraintId: 'borderless-content',
    status: 'revise',
    note: 'The rendered screen still contains an outlined content container.',
  };
  const failedVisualReviewResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify(failedVisualReview),
  });
  assert(failedVisualReviewResponse.status === 400, `accepting a rendered screen that violates visual constraints should be rejected, got ${failedVisualReviewResponse.status}`);
  assert((await failedVisualReviewResponse.json()).code === 'WB-AUTH-VISUAL-CONSTRAINT-FAILED', 'rendered visual review did not enforce confirmed visual constraints');

  const visualReview = await fetchJson(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify(acceptedVisualReview),
  });
  assert(visualReview.ok && visualReview.outcome === 'accept', 'revision-bound rendered review was not accepted');
  assert(visualReview.approvalSummary.includes('geometry grid/padding/optical=100/100/100') && visualReview.approvalSummary.includes('mathematical violations=0'), 'visual approval summary did not expose the server-computed mathematical scores and violation count');

  const awaitingApproval = await fetchJson(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({ sourceFile: 'src/workbench-pages/GatewayPage.tsx', exportName: 'GatewayPage' }),
  });
  assert(!awaitingApproval.ok && awaitingApproval.violations.some((violation) => violation.code === 'WB-AUTH-VISUAL-APPROVAL-MISSING'), 'verification should require explicit user approval of the exact review summary');
  const visualApproval = await fetchJson(`${bridge.url}/__workbench/authoring/visual-approval/confirm.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      sourceFile: 'src/workbench-pages/GatewayPage.tsx',
      sourceRevision: visualReview.sourceRevision,
      renderRevision: visualReview.renderRevision,
      reviewId: visualReview.reviewId,
      approvalEvidence: { source: 'user', reference: 'test:user-approved-exact-visual-summary' },
    }),
  });
  assert(visualApproval.ok, 'explicit visual approval was not recorded');

  const verified = await fetchJson(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ sourceFile: 'src/workbench-pages/GatewayPage.tsx', exportName: 'GatewayPage' }),
  });
  assert(verified.ok, `combined source and visual verification failed: ${JSON.stringify(verified.violations)}`);
  assert(verified.summary.localJsxFunctions === 0 && verified.summary.mapExpressions === 0, 'generated page contains an opaque source boundary');

  const saturatedPlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      requirementsId,
      approvedPromptId: await prepareAndApproveExecutionPrompt(bridge, requirementsId, { pageName: 'Saturated Page', route: '/saturated', sourceFile: 'src/workbench-pages/SaturatedPage.tsx' }),
      pageName: 'Saturated Page',
      exportName: 'SaturatedPage',
      route: '/saturated',
      sourceFile: 'src/workbench-pages/SaturatedPage.tsx',
      intents: ['layout.group'],
      ...createDesignContract(),
    }),
  });
  const saturated = await fetchJson(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: saturatedPlan.plan.id,
      root: {
        kind: 'element',
        tag: 'main',
        purpose: 'layout',
        props: { className: 'min-h-screen bg-background' },
        children: [
          { kind: 'element', tag: 'section', purpose: 'layout', props: { className: 'min-h-screen bg-muted border-l' }, children: [{ kind: 'text', value: 'Persistent visual column' }] },
          { kind: 'element', tag: 'section', purpose: 'layout', props: { className: 'min-h-screen bg-accent' }, children: [{ kind: 'text', value: 'Second visual column' }] },
          ...Array.from({ length: 13 }, (_, index) => ({
            kind: 'element',
            tag: 'div',
            purpose: 'layout',
            props: { className: 'border p-2' },
            children: [{ kind: 'text', value: `Region ${index + 1}` }],
          })),
        ],
      },
    }),
  });
  assert(saturated.visualQualityGate.visualSignals.warnings.some((warning) => warning.code === 'WB-AUTH-VISUAL-OVERBOXED'), 'apply did not flag common-region overuse from excessive bordered regions');
  assert(saturated.visualQualityGate.visualSignals.warnings.some((warning) => warning.code === 'WB-AUTH-VISUAL-SURFACE-SATURATION'), 'apply did not flag excess background-bearing semantic regions against the single-surface contract');
  assert(saturated.visualQualityGate.visualSignals.warnings.some((warning) => warning.code === 'WB-AUTH-VISUAL-FULL-HEIGHT-PARTITIONS'), 'apply did not flag full-height content partitions');
  assert(saturated.visualQualityGate.visualSignals.warnings.some((warning) => warning.code === 'WB-AUTH-VISUAL-OUTLINED-CONTAINERS'), 'apply did not enforce the borderless outlined-container limit');
  assert(saturated.visualQualityGate.visualSignals.warnings.some((warning) => warning.code === 'WB-AUTH-VISUAL-VERTICAL-PARTITIONS'), 'apply did not flag vertical dividers inside the single-surface contract');
  const saturatedWideBefore = await submitRenderEvidence(bridge, { sourceFile: 'src/workbench-pages/SaturatedPage.tsx', sourceRevision: saturated.revision, renderRevision: saturated.renderRevision, phase: 'before-refinement', width: 1440, height: 1024, seed: 31 });
  const saturatedCompactBefore = await submitRenderEvidence(bridge, { sourceFile: 'src/workbench-pages/SaturatedPage.tsx', sourceRevision: saturated.revision, renderRevision: saturated.renderRevision, phase: 'before-refinement', width: 390, height: 844, seed: 32 });
  const saturatedRefinedPlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      requirementsId,
      approvedPromptId: await prepareAndApproveExecutionPrompt(bridge, requirementsId, { pageName: 'Saturated Page', route: '/saturated', sourceFile: 'src/workbench-pages/SaturatedPage.tsx' }),
      pageName: 'Saturated Page', exportName: 'SaturatedPage', route: '/saturated', sourceFile: 'src/workbench-pages/SaturatedPage.tsx', intents: ['layout.group'],
      ...createDesignContract(),
    }),
  });
  const saturatedRefined = await fetchJson(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      planId: saturatedRefinedPlan.plan.id,
      root: {
        kind: 'element', tag: 'main', purpose: 'layout', props: { className: 'min-h-screen bg-background gap-1' },
        children: [
          { kind: 'element', tag: 'section', purpose: 'layout', props: { className: 'min-h-screen bg-muted border-l' }, children: [{ kind: 'text', value: 'Persistent visual column' }] },
          { kind: 'element', tag: 'section', purpose: 'layout', props: { className: 'min-h-screen bg-accent' }, children: [{ kind: 'text', value: 'Second visual column' }] },
          ...Array.from({ length: 13 }, (_, index) => ({ kind: 'element', tag: 'div', purpose: 'layout', props: { className: 'border p-2' }, children: [{ kind: 'text', value: `Region ${index + 1}` }] })),
        ],
      },
    }),
  });
  const saturatedWideAfter = await submitRenderEvidence(bridge, { sourceFile: 'src/workbench-pages/SaturatedPage.tsx', sourceRevision: saturatedRefined.revision, renderRevision: saturatedRefined.renderRevision, phase: 'after-refinement', width: 1440, height: 1024, seed: 41 });
  const saturatedCompactAfter = await submitRenderEvidence(bridge, { sourceFile: 'src/workbench-pages/SaturatedPage.tsx', sourceRevision: saturatedRefined.revision, renderRevision: saturatedRefined.renderRevision, phase: 'after-refinement', width: 390, height: 844, seed: 42 });
  const waivedSaturatedReview = createAcceptedVisualReview({
    sourceFile: 'src/workbench-pages/SaturatedPage.tsx', sourceRevision: saturatedRefined.revision, renderRevision: saturatedRefined.renderRevision,
    wideBeforeId: saturatedWideBefore.receipt.id, wideAfterId: saturatedWideAfter.receipt.id,
    compactBeforeId: saturatedCompactBefore.receipt.id, compactAfterId: saturatedCompactAfter.receipt.id,
  });
  waivedSaturatedReview.warningResolutions = saturatedRefined.visualQualityGate.visualSignals.warnings.map((warning) => ({ code: warning.code, resolution: 'Claimed as acceptable without changing the source.' }));
  const waivedSaturatedResponse = await fetch(`${bridge.url}/__workbench/authoring/visual-review.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify(waivedSaturatedReview),
  });
  assert(waivedSaturatedResponse.status === 400, `hard visual-composition warnings should not be waivable, got ${waivedSaturatedResponse.status}`);
  assert((await waivedSaturatedResponse.json()).code === 'WB-AUTH-VISUAL-COMPOSITION-SOURCE-FAILED', 'hard visual-composition warnings did not require source revision');

  }

  const editablePlan = await fetchJson(`${bridge.url}/__workbench/authoring/plan.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      pageName: 'Editable Page',
      exportName: 'EditablePage',
      route: '/editable',
      sourceFile: 'src/workbench-pages/EditablePage.tsx',
    }),
  });
  assert(editablePlan.plan?.requirementsId === null && editablePlan.plan?.approvedPromptId === null, 'editable-v1 plan unexpectedly required requirements or prompt approval');

  const editableApply = await fetchJson(`${bridge.url}/__workbench/authoring/apply.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({
      planId: editablePlan.plan.id,
      root: {
        kind: 'element',
        tag: 'main',
        purpose: 'layout',
        props: { className: 'min-h-screen p-6' },
        children: [
          { kind: 'element', tag: 'h1', purpose: 'content', children: [{ kind: 'text', value: 'Editable source' }] },
          {
            kind: 'element',
            tag: 'button',
            purpose: 'semantic',
            intent: 'control.action',
            props: { type: 'button', className: 'rounded px-4 py-2' },
            children: [{ kind: 'text', value: 'Continue' }],
          },
        ],
      },
    }),
  });
  assert(editableApply.page?.extensions?.authoringGateway?.version === 'editable-v1', 'new page did not persist the editable-v1 contract');
  assert(editableApply.visualQualityGate?.required === false, 'editable-v1 still required the legacy visual-quality ceremony');
  assert((await readFile(join(root, 'src', 'workbench-pages', 'EditablePage.tsx'), 'utf8')).includes('<button'), 'native button was replaced or rejected because a registered component exists');

  const editableVerification = await fetchJson(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ sourceFile: 'src/workbench-pages/EditablePage.tsx', exportName: 'EditablePage' }),
  });
  assert(editableVerification.ok && editableVerification.editabilityContract?.version === 'editable-v1', 'editable-v1 verification did not complete without render evidence or approval');
  assert(editableVerification.previewCss?.renderFreshness?.ready === true, 'editable-v1 verification omitted preview CSS readiness');

  await writeFile(join(root, 'src', 'workbench-pages', 'EditablePage.tsx'), `
const actions = ['Continue', 'Review'];
function ActionLabel({ children }) {
  return <strong>{children}</strong>;
}
export default function EditablePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      {actions.map((action) => (
        <button key={action} onClick={() => undefined}><ActionLabel>{action}</ActionLabel></button>
      ))}
    </main>
  );
}
`, 'utf8');
  const expressionVerification = await fetchJson(`${bridge.url}/__workbench/authoring/verify.json`, {
    method: 'POST',
    headers: authoringHeaders(bridge),
    body: JSON.stringify({ sourceFile: 'src/workbench-pages/EditablePage.tsx', exportName: 'EditablePage' }),
  });
  assert(expressionVerification.ok, 'ordinary React patterns should not fail editable-v1 verification');
  const mapBoundaryWarning = expressionVerification.warnings?.find((warning) => warning.code === 'WB-AUTH-MAP-BOUNDARY');
  assert(mapBoundaryWarning, 'map expressions were not exposed as an honest editability warning');
  assert(mapBoundaryWarning.severity === 'warning' && mapBoundaryWarning.blocking === false, 'map boundary warning did not declare its non-blocking severity');
  assert(Array.isArray(mapBoundaryWarning.guidance) && mapBoundaryWarning.guidance.length >= 2, 'map boundary warning omitted actionable authoring choices');
  assert(typeof mapBoundaryWarning.acceptableWhen === 'string' && mapBoundaryWarning.acceptableWhen.length > 0, 'map boundary warning omitted its acceptance criterion');
  assert(expressionVerification.warnings?.some((warning) => warning.code === 'WB-AUTH-LOCAL-JSX-BOUNDARY'), 'local JSX helpers were not exposed as an honest editability warning');
  assert(expressionVerification.warningPolicy?.status === 'pass-with-warnings', 'ordinary React warnings did not return pass-with-warnings');
  assert(expressionVerification.warningPolicy?.blocksWrite === false && expressionVerification.warningPolicy?.requiresRevision === false, 'warning policy incorrectly forced another authoring iteration');

  const inspectedTokens = await fetchJson(`${bridge.url}/__workbench/authoring/tokens.json`, {
    headers: authoringHeaders(bridge),
  });
  const tokenResult = await fetchJson(`${bridge.url}/__workbench/authoring/tokens/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      baseRevision: inspectedTokens.revision,
      operations: [
        { layer: 'semantic', collectionId: 'workbench-semantic-dimension', token: { id: 'control-height-md', name: 'control-height-md', type: 'dimension', groupId: 'control-height', values: { default: { kind: 'ref', collectionId: 'tailwind-primitives', tokenId: 'size-10' } } } },
        { layer: 'component', collectionId: 'component-button', token: { id: 'button-height-md', name: 'button-height-md', type: 'dimension', groupId: 'button-size', values: { default: { kind: 'ref', collectionId: 'workbench-semantic-dimension', tokenId: 'control-height-md' } } } },
      ],
    }),
  });
  assert(tokenResult.operations === 2 && tokenResult.revision !== inspectedTokens.revision, 'layered token upsert failed');
  const tokenCss = await readFile(join(root, 'src', 'workbench-tokens.css'), 'utf8');
  assert(tokenCss.includes('button-height-md'), 'token CSS was not regenerated');
  await expectStatus(fetch(`${bridge.url}/__workbench/authoring/tokens/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({ baseRevision: inspectedTokens.revision, operations: [{ layer: 'primitive', collectionId: 'tailwind-primitives', token: { id: 'duplicate-10', name: 'duplicate-10', type: 'dimension', groupId: 'sizing', values: { default: { kind: 'raw', value: 40, unit: 'px' } } } }] }),
  }), 409, 'stale token revision');

  const assetResult = await fetchJson(`${bridge.url}/__workbench/authoring/assets/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      assets: [{
        name: 'Gateway Figma Icons',
        kind: 'icon',
        figma: { fileKey: 'gatewayfilekey00000000', nodeId: '12:34', nodeName: 'Icons' },
        files: [{ name: 'track.svg', label: 'Track', dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }],
      }],
    }),
  });
  assert(
    assetResult.assets?.[0]?.urls?.[0] === '/workbench-assets/icons/gateway-figma-icons/track.svg',
    'asset upsert did not return a stable installed public URL',
  );
  assert(
    (await readFile(join(root, 'public', 'workbench-assets', 'icons', 'gateway-figma-icons', 'track.svg'), 'utf8')) === '<svg/>',
    'asset upsert did not write the decoded file into the project public asset space',
  );
  const upsertedAssetRegistry = JSON.parse(await readFile(join(root, '.workbench', 'assets.json'), 'utf8'));
  const registeredAsset = upsertedAssetRegistry.assets.find((asset) => asset.id === 'asset-gateway-figma-icons');
  assert(
    registeredAsset?.source?.filePath === 'public/workbench-assets/icons/gateway-figma-icons/track.svg'
      && registeredAsset.extensions?.sourceFigmaNodeId === '12:34'
      && registeredAsset.extensions?.previewIcons?.[0]?.value === '/workbench-assets/icons/gateway-figma-icons/track.svg',
    'asset upsert did not register the project file path, Figma provenance, and icon preview entry',
  );
  const neutralizedAsset = await fetchJson(`${bridge.url}/__workbench/authoring/assets/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      assets: [{ name: 'Escaping', kind: 'icon', collection: '../../../etc', files: [{ name: '../../passwd.svg', dataUrl: 'data:image/svg+xml;base64,PHN2Zy8+' }] }],
    }),
  });
  assert(
    neutralizedAsset.assets?.[0]?.urls?.[0] === '/workbench-assets/icons/etc/passwd.svg',
    'asset upsert did not neutralize traversal segments in the collection and file name',
  );

  const inspectedComponent = await fetchJson(`${bridge.url}/__workbench/authoring/component.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({ sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx' }),
  });
  const componentResult = await fetchJson(`${bridge.url}/__workbench/authoring/component/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx', exportName: 'Button',
      sourceRevision: inspectedComponent.source.revision, storyRevision: inspectedComponent.story.revision,
      sourceContents: 'export function Button({ children }) { return <button type="button">{children}</button>; }',
      storyContents: "import { Button } from './button';\nconst meta = { component: Button, args: { children: 'Button' }, argTypes: { children: { control: 'text' } }, sourceInsert: { props: { children: 'Button' } } };\nexport default meta;\nexport const Default = {};",
    }),
  });
  assert(componentResult.reconciliation === 'reload-required', 'component authoring must preserve registry hydration boundary');
  const reinspectedComponent = await fetchJson(`${bridge.url}/__workbench/authoring/component.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({ sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx' }),
  });
  const opaqueCollectionResponse = await fetch(`${bridge.url}/__workbench/authoring/component/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx', exportName: 'Button',
      sourceRevision: reinspectedComponent.source.revision, storyRevision: reinspectedComponent.story.revision,
      sourceContents: "export function Button({ items = 'Save\\nEdit' }: { items?: string }) { return <div>{items.split('\\n').map((item) => <button key={item}>{item}</button>)}</div>; }",
      storyContents: "import { Button } from './button';\nconst meta = { component: Button, args: { items: 'Save\\nEdit' }, argTypes: { items: { control: 'text' } }, sourceInsert: { props: { items: 'Save\\nEdit' } } };\nexport default meta;\nexport const Default = {};",
    }),
  });
  assert(opaqueCollectionResponse.status === 400, 'component authoring must reject opaque string collection props');
  const opaqueCollectionError = await opaqueCollectionResponse.json();
  assert(opaqueCollectionError.code === 'WB-AUTH-COMPONENT-OPAQUE-COLLECTION', 'opaque collection rejection must expose its authoring error code');
  const opaqueConfigResponse = await fetch(`${bridge.url}/__workbench/authoring/component/upsert.json`, {
    method: 'POST', headers: authoringHeaders(bridge), body: JSON.stringify({
      sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx', exportName: 'Button',
      sourceRevision: reinspectedComponent.source.revision, storyRevision: reinspectedComponent.story.revision,
      sourceContents: "import { createPowerSearchConfig } from '@astryxdesign/core/PowerSearch';\nconst { config } = createPowerSearchConfig([{ key: 'title', type: 'string', label: 'Title' }]);\nexport function Button() { return <div>{config.fields[0].label}</div>; }",
      storyContents: "import { Button } from './button';\nconst meta = { component: Button, args: {}, argTypes: {}, sourceInsert: { props: {} } };\nexport default meta;\nexport const Default = {};",
    }),
  });
  assert(opaqueConfigResponse.status === 400, 'component authoring must reject fixed visible runtime config arrays');
  const opaqueConfigError = await opaqueConfigResponse.json();
  assert(opaqueConfigError.code === 'WB-AUTH-COMPONENT-OPAQUE-CONFIG', 'opaque config rejection must expose its authoring error code');
  await inflateMcpCompactBudgetFixture(root);
  await verifyMcpToolSurface(root);
  await verifyBridgeMcpTransport(bridge, root);
  await verifyDirectMcpPreviewCssSync();
  await verifyFullMcpToolProfile(root);
  await verifyGeneratedDesignSkill();

  console.log('Workbench editable authoring gateway check passed');
} finally {
  bridge.close();
  await rm(root, { force: true, recursive: true });
  await rm(outsideNotePath, { force: true });
}

async function createProject(projectRoot) {
  await mkdir(join(projectRoot, '.workbench'), { recursive: true });
  await mkdir(join(projectRoot, 'src', 'components', 'ui'), { recursive: true });
  await mkdir(join(projectRoot, 'src', 'workbench-pages'), { recursive: true });
  await writeJson(join(projectRoot, '.workbench', 'workbench.config.json'), {
    schemaVersion: '0.1',
    projectId: 'authoring-test',
    projectName: 'Authoring Test',
    createdAt: '2026-07-14T00:00:00.000Z',
    updatedAt: '2026-07-14T00:00:00.000Z',
    workbench: { app: 'workbench-v1', devCommand: 'npm run dev', installMode: 'local-project' },
    paths: {
      components: '.workbench/components.json',
      pages: '.workbench/pages.json',
      tokens: '.workbench/tokens.json',
      assets: '.workbench/assets.json',
      notes: '.workbench/notes.json',
      tokenCss: 'src/workbench-tokens.css',
      comments: '.workbench/comments.json',
      selection: '.workbench/selection.json',
      workspaceState: '.workbench/workspace-state.json',
    },
    capabilities: { codexDesktopPreview: true, localFiles: true, optionalCloudSync: false },
    extensions: {
      projectTemplate: { id: 'standard', name: 'Default React + Tailwind' },
      tailwind: { enabled: false, sourceCss: 'src/site.css', compiledCss: 'src/workbench-tailwind.css' },
    },
  });
  await writeJson(join(projectRoot, '.workbench', 'components.json'), {
    schemaVersion: '0.1',
    components: [{
      id: 'component-button',
      name: 'Button',
      sourceFile: 'src/components/ui/button.tsx',
      variants: [],
      extensions: {
        importName: 'Button',
        sourceExportName: 'Button',
        childrenSlotKind: 'inline',
        storySourceFile: 'src/components/ui/button.stories.tsx',
        authoring: { roles: ['surface.card'] },
      },
    }],
    extensions: {},
  });
  await writeJson(join(projectRoot, '.workbench', 'pages.json'), {
    schemaVersion: '0.1',
    pages: [
      { id: 'page-other-service', name: 'Other service', route: '/other-service', sourceFile: 'src/workbench-pages/OtherService.tsx', status: 'draft' },
      { id: 'page-active-service', name: 'Active service', route: '/active-service', sourceFile: 'src/workbench-pages/ActiveService.tsx', status: 'draft' },
      { id: 'page-outside', name: 'Outside', route: '/outside', sourceFile: `../${basename(projectRoot)}-outside.tsx`, status: 'draft' },
      ...Array.from({ length: 105 }, (_, index) => ({
        id: `page-filler-${index}`,
        name: `Filler ${index}`,
        route: `/filler-${index}`,
        sourceFile: `src/workbench-pages/Filler${index}.tsx`,
        status: 'draft',
      })),
    ],
    extensions: {},
  });
  await writeJson(join(projectRoot, '.workbench', 'tokens.json'), {
    schemaVersion: '0.1', collections: [
      { id: 'tailwind-primitives', name: 'Primitives', modes: [{ id: 'default', name: 'Default' }], activeMode: 'default', groups: [{ id: 'sizing', name: 'Sizing' }, ...Array.from({ length: 45 }, (_, index) => ({ id: `group-${index}`, name: `Group ${index}` }))], tokens: [{ id: 'size-10', name: 'size-10', type: 'dimension', groupId: 'sizing', values: { default: { kind: 'raw', value: 40, unit: 'px' } }, sortOrder: 0 }] },
      { id: 'workbench-semantic-dimension', name: 'Semantic Dimension', modes: [{ id: 'default', name: 'Default' }], activeMode: 'default', groups: [{ id: 'control-height', name: 'Control Height' }], tokens: [] },
      { id: 'component-button', name: 'Button', modes: [{ id: 'default', name: 'Default' }], activeMode: 'default', groups: [{ id: 'button-size', name: 'Button Size' }], tokens: [] },
    ], extensions: {},
  });
  await writeJson(join(projectRoot, '.workbench', 'assets.json'), {
    schemaVersion: '0.1',
    assets: [
      {
        id: 'asset-service-hero',
        name: 'Service recovery hero',
        kind: 'image',
        source: { type: 'project-file', value: '/workbench-assets/service-recovery.webp', filePath: 'public/workbench-assets/service-recovery.webp' },
        tags: ['travel', 'service', 'recovery'],
        extensions: { previewIcons: [{ name: 'implementation detail that must not leak' }] },
      },
      {
        id: 'asset-large-data',
        name: 'Large data asset',
        kind: 'image',
        source: { type: 'url', value: `data:image/svg+xml,${'x'.repeat(5000)}` },
        tags: Array.from({ length: 30 }, (_, index) => `tag-${index}`),
        extensions: {},
      },
    ],
    extensions: { assetDefaults: { iconSetId: 'asset-lucide-preview', oversized: 'x'.repeat(2000) } },
  });
  await writeJson(join(projectRoot, '.workbench', 'notes.json'), {
    schemaVersion: '0.1',
    comments: [{
      id: 'note-service-promise',
      body: 'Keep the recovery promise calm, concrete, and operationally honest.',
      status: 'open',
      target: { kind: 'project', projectId: 'authoring-test' },
      createdAt: '2026-07-14T00:00:00.000Z',
      updatedAt: '2026-07-14T00:00:00.000Z',
      extensions: { title: 'Service promise', type: 'intent' },
    }],
    extensions: {},
  });
  await mkdir(join(projectRoot, 'docs', 'workbench-agent'), { recursive: true });
  await writeFile(join(projectRoot, 'docs', 'workbench-agent', 'WORKBENCH-ORGANIZATIONAL-CONTEXT.md'), `
# Organizational Context

Audience: public
Status: curated

Unstructured private-retrospective text must never be returned.

## Purpose and product principles

- Keep service recovery decisions explainable and source-backed.
- Contact maintainer@example.com for private details.

## Known limitations

- Runtime-heavy timeline internals may remain read-only behind an honest component boundary.
`, 'utf8');
  await writeJson(join(projectRoot, '.workbench', 'selection.json'), {
    schemaVersion: '0.1',
    activeTarget: { kind: 'page', pageId: 'page-active-service', sourceFile: 'src/workbench-pages/ActiveService.tsx' },
    selectedTargets: [{ kind: 'page', pageId: 'page-active-service', sourceFile: 'src/workbench-pages/ActiveService.tsx' }],
    updatedAt: '2026-07-14T00:00:00.000Z',
    extensions: {
      activeWorkbenchSurface: 'design',
      activeDesignTargetKind: 'page',
      activeDesignTargetId: 'page-active-service',
      activeDesignSourceFile: 'src/workbench-pages/ActiveService.tsx',
      activeDesignLayerId: 'source:active-service:hero',
      designPreviewViewport: { width: 1280, height: 800, presetId: 'desktop' },
      designPreviewAppearance: 'light',
    },
  });
  await writeJson(join(projectRoot, 'src', 'workbench-pages', 'ActiveService.workbench-notes.json'), {
    schemaVersion: '0.1',
    comments: [{ id: 'note-active', title: 'Active page intent', body: 'Prioritize recovery options.', status: 'open' }],
    extensions: {},
  });
  await writeJson(join(projectRoot, 'src', 'workbench-pages', 'OtherService.workbench-notes.json'), {
    schemaVersion: '0.1',
    comments: [{ id: 'note-other', title: 'Other page intent', body: 'Secondary service context.', status: 'open' }],
    extensions: {},
  });
  await writeJson(join(projectRoot, '..', `${basename(projectRoot)}-outside.workbench-notes.json`), {
    schemaVersion: '0.1',
    comments: [{ id: 'note-secret', title: 'Outside secret', body: 'Must never be returned.', status: 'open' }],
    extensions: {},
  });
  await writeFile(join(projectRoot, 'src', 'workbench-pages', 'ActiveService.tsx'), `
export function ActiveService() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header><h1>Service recovery timeline</h1></header>
      <section aria-label="Recovery events">
        <article><time>22:15</time><h2>Performance completed</h2></article>
        <article><time>22:35</time><h2>Departure at risk</h2></article>
      </section>
    </main>
  );
}
`, 'utf8');
  await writeFile(join(projectRoot, 'src', 'components', 'ui', 'button.tsx'), 'export function Button({ children }) { return <button>{children}</button>; }\n', 'utf8');
  await writeFile(join(projectRoot, 'src', 'components', 'ui', 'button.stories.tsx'), `
import { Button } from './button';
const LABELS = ['Button', 'Continue'] as const;
const DEFAULT_PROPS = { children: 'Button' } as const;
const meta = {
  component: Button,
  args: DEFAULT_PROPS,
  argTypes: {
    children: { control: 'select', options: LABELS },
  },
  authoring: {
    roles: ['control.action'],
    nativeReplacements: ['button'],
    priority: 100,
  },
  sourceInsert: { props: { children: DEFAULT_PROPS.children } },
};
export default meta;
export const Default = {};
`, 'utf8');
}

async function inflateMcpCompactBudgetFixture(projectRoot) {
  const pagesPath = join(projectRoot, '.workbench', 'pages.json');
  const pages = JSON.parse(await readFile(pagesPath, 'utf8'));
  pages.pages = pages.pages.map((page, index) => page.id === 'page-active-service' ? page : {
    ...page,
    id: `${page.id}-${'i'.repeat(120)}`,
    name: `${page.name} ${'n'.repeat(220)}`,
    route: `/${'r'.repeat(470)}-${index}`,
    sourceFile: `src/workbench-pages/${'S'.repeat(180)}/${'T'.repeat(180)}/${'U'.repeat(70)}${index}.tsx`,
  });
  const activePage = pages.pages.find((page) => page.id === 'page-active-service');
  pages.pages = [
    ...pages.pages.filter((page) => page.id !== 'page-active-service'),
    activePage,
  ].filter(Boolean);
  await writeJson(pagesPath, pages);

  const tokensPath = join(projectRoot, '.workbench', 'tokens.json');
  const tokens = JSON.parse(await readFile(tokensPath, 'utf8'));
  tokens.collections.push(...Array.from({ length: 77 }, (_, collectionIndex) => ({
    id: `budget-collection-${collectionIndex}-${'i'.repeat(120)}`,
    name: `Budget collection ${collectionIndex} ${'n'.repeat(200)}`,
    modes: [{ id: 'default', name: 'Default' }],
    activeMode: 'default',
    groups: [],
    tokens: Array.from({ length: 20 }, (_, tokenIndex) => ({
      id: `token-${collectionIndex}-${tokenIndex}`,
      name: `Token ${collectionIndex} ${tokenIndex}`,
      type: `budget-type-${tokenIndex}-${'t'.repeat(60)}`,
      groupId: 'budget',
      values: { default: { kind: 'raw', value: tokenIndex } },
    })),
  })));
  await writeJson(tokensPath, tokens);

  const assetsPath = join(projectRoot, '.workbench', 'assets.json');
  const assets = JSON.parse(await readFile(assetsPath, 'utf8'));
  assets.assets.push(...Array.from({ length: 78 }, (_, assetIndex) => ({
    id: `budget-asset-${assetIndex}-${'i'.repeat(120)}`,
    name: `Budget asset ${assetIndex} ${'n'.repeat(200)}`,
    kind: 'image',
    source: { type: 'url', value: `https://example.invalid/${'s'.repeat(1000)}-${assetIndex}` },
    tags: Array.from({ length: 20 }, (_, tagIndex) => `budget-tag-${tagIndex}-${'t'.repeat(100)}`),
    extensions: {},
  })));
  await writeJson(assetsPath, assets);
}

async function verifyMcpToolSurface(projectRoot) {
  const serverPath = join(process.cwd(), 'scripts', 'workbench-authoring-mcp.mjs');
  const childEnv = { ...process.env };
  delete childEnv.WORKBENCH_AUTHORING_PROJECT_ROOT;
  delete childEnv.WORKBENCH_AUTHORING_BRIDGE_URL;
  delete childEnv.WORKBENCH_AUTHORING_TOKEN;
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: childEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const messages = [];
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    let newline = stdout.indexOf('\n');
    while (newline >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (line) messages.push(JSON.parse(line));
      newline = stdout.indexOf('\n');
    }
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'check', version: '1' } } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'workbench_search_components', arguments: { roles: ['control.action'] } } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'workbench_inspect_design_context', arguments: { projectTarget: { projectId: 'authoring-test', projectName: 'Authoring Test', rootPath: projectRoot, evidence: { source: 'project', reference: 'Direct MCP fixture project.' } }, brief: { experienceType: 'service-touchpoint' } } } })}\n`);
  const deadline = Date.now() + 3000;
  while ((!messages.some((message) => message.id === 1) || !messages.some((message) => message.id === 2) || !messages.some((message) => message.id === 3) || !messages.some((message) => message.id === 4)) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'workbench_search_components', arguments: { roles: ['control.action'] } } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'workbench_inspect_design_context', arguments: { projectTarget: { projectId: 'authoring-test', projectName: 'Authoring Test', rootPath: projectRoot, evidence: { source: 'project', reference: 'Direct MCP full-profile fixture project.' } }, brief: { experienceType: 'service-touchpoint' }, responseProfile: 'full' } } })}\n`);
  const boundDeadline = Date.now() + 3000;
  while ((!messages.some((message) => message.id === 5) || !messages.some((message) => message.id === 6)) && Date.now() < boundDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  child.kill('SIGTERM');
  const toolResponse = messages.find((message) => message.id === 2);
  const names = toolResponse?.result?.tools?.map((tool) => tool.name) ?? [];
  assert(names.length === 10, `Default MCP authoring surface should expose the compact core page, token, asset, and component tools, got ${names.join(', ')}`);
  assert(names.includes('workbench_inspect_design_context'), 'MCP authoring surface is missing the design context tool');
  assert(!names.includes('workbench_confirm_design_requirements') && !names.includes('workbench_submit_render_evidence'), 'Default MCP profile should not advertise optional high-volume design and QA tools');
  assert(names.includes('workbench_search_components') && names.includes('workbench_plan_page') && names.includes('workbench_apply_page_operations') && names.includes('workbench_verify_page'), 'MCP authoring surface is missing a required page tool');
  assert(names.includes('workbench_inspect_tokens') && names.includes('workbench_upsert_tokens'), 'MCP authoring surface is missing token management tools');
  assert(names.includes('workbench_upsert_assets'), 'MCP authoring surface is missing the asset install and registration tool');
  assert(names.includes('workbench_inspect_component') && names.includes('workbench_upsert_component'), 'MCP authoring surface is missing approved component management tools');
  const unboundSearchResponse = messages.find((message) => message.id === 3);
  assert(unboundSearchResponse?.result?.isError === true && unboundSearchResponse.result.structuredContent?.code === 'WB-AUTH-PROJECT-SESSION-UNBOUND', 'MCP did not block authoring before explicit project binding');
  const searchResponse = messages.find((message) => message.id === 5);
  assert(searchResponse?.result?.structuredContent?.components?.some((component) => component.id === 'component-button'), 'MCP project-bound mode did not reach the component catalog after explicit inspection');
  const contextResponse = messages.find((message) => message.id === 4);
  const compactContext = contextResponse?.result?.structuredContent;
  assert(compactContext?.projectBinding?.projectId === 'authoring-test' && compactContext?.briefReadiness?.questions?.length <= 3, 'MCP design context did not preserve the explicit project binding and focused-question contract');
  assert(compactContext?.responseProfile === 'compact' && compactContext?.fullResponseAvailable === true, 'MCP design context did not default to the compact response profile');
  assert(compactContext?.organizationalContext?.status === 'collected' && compactContext.organizationalContext?.audience === 'public' && compactContext.organizationalContext?.filteredItemCount === 1, 'Compact MCP context omitted the filtered public organizational context');
  assert(compactContext?.responseTruncated === true && compactContext.pages?.items?.some((page) => page.id === 'page-active-service'), 'MCP compact budget reduction did not preserve the active page and advertise truncation');
  assert(compactContext?.mcp?.serverName === 'workbench-authoring' && compactContext.mcp.toolProfile === 'core' && compactContext.mcp.transport?.mode === 'direct-filesystem' && compactContext.mcp.transport?.localBridgeConnected === false && compactContext.mcp.transport?.previewCssSynchronization === 'direct-managed', 'Compact MCP design context did not expose its server identity, direct transport, preview CSS synchronization, and tool profile');
  assert(compactContext?.previewCss?.renderFreshness?.ready === true && compactContext.previewCss.renderFreshness?.state === 'ready', 'Compact MCP design context omitted bounded preview CSS readiness');
  assert(!compactContext?.briefReadiness?.instruction?.includes('workbench_confirm_design_requirements'), 'Core MCP context instructed the agent to call a hidden full-profile tool');
  assert(!Object.hasOwn(compactContext?.activeSource ?? {}, 'excerpt') && !Object.hasOwn(compactContext?.briefReadiness ?? {}, 'requirementChecklist'), 'Compact MCP design context retained high-volume source or readiness detail');
  assert(contextResponse?.result?.content?.[0]?.text?.length < 30_000, 'Compact MCP design context exceeded its delivered JSON text budget');
  const fullContext = messages.find((message) => message.id === 6)?.result?.structuredContent;
  assert(fullContext?.responseProfile === 'full' && fullContext?.mcp?.toolProfile === 'core' && Object.hasOwn(fullContext?.activeSource ?? {}, 'excerpt') && Object.hasOwn(fullContext?.briefReadiness ?? {}, 'requirementChecklist'), 'MCP full response profile did not preserve the complete design context and runtime metadata');
  assert(fullContext?.organizationalContext?.sections?.limitations?.length === 1 && !JSON.stringify(fullContext.organizationalContext).includes('private-retrospective'), 'MCP full context did not preserve the curated boundary');
  assert(JSON.stringify(fullContext).length > JSON.stringify(compactContext).length, 'MCP full response profile should contain more detail than compact');
  const inspectTool = toolResponse?.result?.tools?.find((tool) => tool.name === 'workbench_inspect_design_context');
  assert(inspectTool?.inputSchema?.properties?.projectTarget?.description?.includes('evidence') && inspectTool?.inputSchema?.properties?.responseProfile?.default === 'compact', 'MCP design context schema does not explain explicit binding evidence and compact response defaults');
  assert(
    inspectTool?.description?.includes('reference-implementation-intent')
      && inspectTool?.inputSchema?.properties?.brief?.properties?.referenceAnalysis?.properties?.implementationMode?.enum?.includes('exact-conversion')
      && inspectTool?.inputSchema?.properties?.brief?.properties?.referenceAnalysis?.properties?.implementationMode?.enum?.includes('adapt-to-project'),
    'MCP design context schema does not require an explicit exact-conversion versus adapt-to-project decision for supplied references',
  );
  const initializeResponse = messages.find((message) => message.id === 1);
  const instructions = initializeResponse?.result?.instructions ?? '';
  assert(instructions.includes('Bind explicitly') && instructions.includes('never infer a project') && instructions.includes('compact inspection') && instructions.includes('public/curated organizational context') && instructions.includes('never mine private history') && instructions.includes('real editable source') && instructions.includes('Option/Alt') && instructions.includes('unmodified input selects') && instructions.length < 600, 'MCP initialize instructions are missing the bounded public-safe core contract or are too verbose');
}

async function verifyDirectMcpPreviewCssSync() {
  const projectRoot = await mkdtemp(join(tmpdir(), 'workbench-authoring-tailwind-'));
  const outsidePath = join(projectRoot, '..', `${basename(projectRoot)}-outside.workbench-notes.json`);
  let child = null;
  try {
    await createProject(projectRoot);
    const configPath = join(projectRoot, '.workbench', 'workbench.config.json');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    config.paths.tokenCss = 'src/workbench-tokens.css';
    config.extensions = {
      ...config.extensions,
      projectTemplate: { id: 'tailwind', name: 'React + Tailwind' },
      tailwind: {
        enabled: true,
        provider: 'tailwind',
        style: null,
        sourceCss: 'src/index.css',
        compiledCss: 'src/workbench-tailwind.css',
        tokenCss: 'src/workbench-tokens.css',
      },
    };
    await writeJson(configPath, config);
    await writeJson(join(projectRoot, 'package.json'), {
      name: 'workbench-authoring-tailwind-test',
      private: true,
      dependencies: { tailwindcss: '4.0.0' },
    });
    await writeFile(join(projectRoot, 'src', 'index.css'), ':root { --background: #ffffff; --foreground: #111111; }\n', 'utf8');
    await writeFile(join(projectRoot, 'src', 'workbench-tailwind.css'), '.grid { display: grid; }\n', 'utf8');
    await writeFile(join(projectRoot, 'src', 'workbench-tokens.css'), '/* direct MCP token CSS must remain unchanged */\n', 'utf8');
    const preservedAuthoringFiles = {
      config: await readFile(configPath, 'utf8'),
      tokenCss: await readFile(join(projectRoot, 'src', 'workbench-tokens.css'), 'utf8'),
      tokens: await readFile(join(projectRoot, '.workbench', 'tokens.json'), 'utf8'),
    };
    const viteBin = join(projectRoot, 'node_modules', '.bin', 'vite');
    await mkdir(join(projectRoot, 'node_modules', '.bin'), { recursive: true });
    await writeFile(viteBin, `#!/usr/bin/env node
const fs = require('node:fs');
fs.mkdirSync('dist/assets', { recursive: true });
fs.writeFileSync('dist/assets/fixture.css', '/* direct MCP project build */ .grid { display: grid; gap: 1rem; }\\n');
`, 'utf8');
    await chmod(viteBin, 0o755);

    const serverPath = join(process.cwd(), 'scripts', 'workbench-authoring-mcp.mjs');
    child = spawn(process.execPath, [serverPath], {
      cwd: projectRoot,
      env: {
        ...process.env,
        WORKBENCH_AUTHORING_BRIDGE_URL: '',
        WORKBENCH_AUTHORING_PROJECT_ROOT: '',
        WORKBENCH_AUTHORING_TOKEN: '',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const messages = [];
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      let newline = stdout.indexOf('\n');
      while (newline >= 0) {
        const line = stdout.slice(0, newline).trim();
        stdout = stdout.slice(newline + 1);
        if (line) messages.push(JSON.parse(line));
        newline = stdout.indexOf('\n');
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    const request = async (id, method, params) => {
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
      const deadline = Date.now() + 10_000;
      while (!messages.some((message) => message.id === id) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const response = messages.find((message) => message.id === id);
      if (!response) throw new Error(`Timed out waiting for direct MCP response ${id}: ${stderr}`);
      return response;
    };

    await request(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'preview-css-check', version: '1' } });
    const contextResponse = await request(2, 'tools/call', {
      name: 'workbench_inspect_design_context',
      arguments: {
        projectTarget: {
          projectId: 'authoring-test',
          projectName: 'Authoring Test',
          rootPath: projectRoot,
          evidence: { source: 'project', reference: 'Direct MCP Tailwind synchronization fixture.' },
        },
        brief: { experienceType: 'screen' },
      },
    });
    const context = contextResponse.result?.structuredContent;
    assert(context?.previewCss?.mode === 'compiled' && context.previewCss.status === 'stale', 'Direct MCP must conservatively report compiled CSS as stale before a verified session build');
    assert(context?.mcp?.transport?.previewCssSynchronization === 'direct-managed', 'Direct MCP did not advertise its managed preview CSS synchronization path');

    const inspectedResponse = await request(3, 'tools/call', {
      name: 'workbench_inspect_component',
      arguments: { sourceFile: 'src/components/ui/button.tsx', storyFile: 'src/components/ui/button.stories.tsx' },
    });
    const inspected = inspectedResponse.result?.structuredContent;
    assert(inspected?.source?.contents && inspected?.story?.contents, 'Direct MCP component inspection did not return source contracts');

    const upsertResponse = await request(4, 'tools/call', {
      name: 'workbench_upsert_component',
      arguments: {
        sourceFile: 'src/components/ui/button.tsx',
        storyFile: 'src/components/ui/button.stories.tsx',
        exportName: 'Button',
        sourceRevision: inspected.source.revision,
        storyRevision: inspected.story.revision,
        sourceContents: inspected.source.contents,
        storyContents: inspected.story.contents,
      },
    });
    const upsert = upsertResponse.result?.structuredContent;
    assert(upsertResponse.result?.isError !== true, `Direct MCP component upsert failed: ${upsertResponse.result?.content?.[0]?.text ?? stderr}`);
    assert(upsert?.previewCss?.status === 'synchronized' && upsert.previewCss.renderFreshness?.ready === true, 'Direct MCP component write did not return synchronized render-ready Tailwind CSS');
    assert(upsert.previewCss.renderFreshness.inputRevision && upsert.previewCss.renderFreshness.outputRevision, 'Direct MCP synchronized result omitted input or output revisions');
    assert(await readFile(configPath, 'utf8') === preservedAuthoringFiles.config, 'Preview CSS synchronization unexpectedly rewrote the Workbench project config');
    assert(await readFile(join(projectRoot, '.workbench', 'tokens.json'), 'utf8') === preservedAuthoringFiles.tokens, 'Preview CSS synchronization unexpectedly rewrote the token registry');
    assert(await readFile(join(projectRoot, 'src', 'workbench-tokens.css'), 'utf8') === preservedAuthoringFiles.tokenCss, 'Preview CSS synchronization unexpectedly rewrote token CSS');

    const refreshedResponse = await request(5, 'tools/call', {
      name: 'workbench_inspect_design_context',
      arguments: {
        projectTarget: {
          rootPath: projectRoot,
          evidence: { source: 'project', reference: 'Reinspect the bound direct MCP Tailwind fixture.' },
        },
        brief: { experienceType: 'screen' },
      },
    });
    const refreshed = refreshedResponse.result?.structuredContent;
    assert(refreshed?.previewCss?.renderFreshness?.ready === true && refreshed.previewCss.status === 'synchronized', 'Direct MCP did not retain verified preview CSS readiness for a same-session context read');
  } finally {
    child?.kill('SIGTERM');
    await rm(projectRoot, { force: true, recursive: true });
    await rm(outsidePath, { force: true });
  }
}

async function verifyBridgeMcpTransport(activeBridge, projectRoot) {
  const serverPath = join(process.cwd(), 'scripts', 'workbench-authoring-mcp.mjs');
  const childEnv = {
    ...process.env,
    WORKBENCH_AUTHORING_BRIDGE_URL: activeBridge.url,
    WORKBENCH_AUTHORING_PROJECT_ROOT: '',
    WORKBENCH_AUTHORING_TOKEN: activeBridge.authoringToken,
  };
  delete childEnv.WORKBENCH_AUTHORING_TOOL_PROFILE;
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: childEnv,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const messages = [];
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    let newline = stdout.indexOf('\n');
    while (newline >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (line) messages.push(JSON.parse(line));
      newline = stdout.indexOf('\n');
    }
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  try {
    const request = async (id, method, params) => {
      child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
      const deadline = Date.now() + 5_000;
      while (!messages.some((message) => message.id === id) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      const response = messages.find((message) => message.id === id);
      if (!response) throw new Error(`Timed out waiting for bridge MCP response ${id}: ${stderr}`);
      return response;
    };

    await request(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'bridge-transport-check', version: '1' } });
    const response = await request(2, 'tools/call', {
      name: 'workbench_inspect_design_context',
      arguments: {
        projectTarget: {
          projectId: 'authoring-test',
          projectName: 'Authoring Test',
          rootPath: projectRoot,
          evidence: { source: 'project', reference: 'Authenticated local bridge MCP fixture.' },
        },
        brief: { experienceType: 'service-touchpoint' },
      },
    });
    const context = response.result?.structuredContent;
    assert(response.result?.isError !== true, `Bridge MCP inspection failed: ${response.result?.content?.[0]?.text ?? stderr}`);
    assert(context?.mcp?.serverName === 'workbench-authoring' && context.mcp.serverVersion === '0.16.0' && context.mcp.toolProfile === 'core', 'Bridge MCP context omitted its server identity, version, or core tool profile');
    assert(context?.mcp?.transport?.mode === 'local-bridge' && context.mcp.transport.localBridgeConnected === true, 'Bridge MCP context did not report its authenticated local bridge transport');
    assert(context.mcp.transport.previewCssSynchronization === 'bridge-managed', 'Bridge MCP context did not report bridge-managed preview CSS synchronization');
    assert(response.result?.content?.[0]?.text?.length < 30_000, 'Bridge MCP compact response exceeded its delivered JSON text budget');
  } finally {
    child.kill('SIGTERM');
  }
}

async function verifyFullMcpToolProfile(projectRoot) {
  const serverPath = join(process.cwd(), 'scripts', 'workbench-authoring-mcp.mjs');
  const child = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      WORKBENCH_AUTHORING_TOOL_PROFILE: 'full',
      WORKBENCH_AUTHORING_PROJECT_ROOT: '',
      WORKBENCH_AUTHORING_BRIDGE_URL: '',
      WORKBENCH_AUTHORING_TOKEN: '',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const messages = [];
  let stdout = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    let newline = stdout.indexOf('\n');
    while (newline >= 0) {
      const line = stdout.slice(0, newline).trim();
      stdout = stdout.slice(newline + 1);
      if (line) messages.push(JSON.parse(line));
      newline = stdout.indexOf('\n');
    }
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'check-full', version: '1' } } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} })}\n`);
  const deadline = Date.now() + 3000;
  while (!messages.some((message) => message.id === 2) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  child.kill('SIGTERM');
  const names = messages.find((message) => message.id === 2)?.result?.tools?.map((tool) => tool.name) ?? [];
  assert(names.length === 16, `Full MCP profile should expose all 16 tools, got ${names.join(', ')}`);
  assert(names.includes('workbench_confirm_design_requirements') && names.includes('workbench_prepare_page_prompt') && names.includes('workbench_confirm_page_prompt'), 'Full MCP profile is missing optional requirements or prompt tools');
  assert(names.includes('workbench_submit_render_evidence') && names.includes('workbench_submit_visual_review') && names.includes('workbench_confirm_visual_approval'), 'Full MCP profile is missing optional high-assurance QA tools');
}

async function prepareExecutionPrompt(activeBridge, requirementsId, page) {
  return fetchJson(`${activeBridge.url}/__workbench/authoring/execution-prompt.json`, {
    method: 'POST',
    headers: authoringHeaders(activeBridge),
    body: JSON.stringify({
      requirementsId,
      ...page,
      compositionApproach: 'One source-backed operational surface organized around the real workflow and strict action hierarchy.',
      contentOutline: ['Context and current consequence', 'Chronological operational events', 'Decision evidence and quiet supporting detail'],
      interactionOutline: ['Keep one primary action; disclose secondary evidence contextually and place agent contact at tertiary hierarchy.'],
      responsiveOutline: ['Wide view preserves the workflow and supporting context without full-height partitions.', 'Compact view keeps incident, affected event, and primary action first.'],
      authoringConstraints: ['Use explicit editable JSX, registered semantic components, registered assets, and no automatic image generation.'],
    }),
  });
}

async function approveExecutionPrompt(activeBridge, promptId, reference) {
  return fetchJson(`${activeBridge.url}/__workbench/authoring/execution-prompt/confirm.json`, {
    method: 'POST',
    headers: authoringHeaders(activeBridge),
    body: JSON.stringify({ promptId, approvalEvidence: { source: 'user', reference } }),
  });
}

async function prepareAndApproveExecutionPrompt(activeBridge, requirementsId, page) {
  const prepared = await prepareExecutionPrompt(activeBridge, requirementsId, page);
  const approved = await approveExecutionPrompt(activeBridge, prepared.executionPrompt.id, `User approved the exact ${page.pageName} execution prompt.`);
  return approved.approval.id;
}

function createProjectTarget() {
  return {
    projectId: 'authoring-test',
    projectName: 'Authoring Test',
    evidence: { source: 'project', reference: 'The test fixture owns this explicit Workbench project identity.' },
  };
}

function createReadyBrief() {
  return {
    experienceType: 'service-touchpoint',
    productName: 'Roadsync',
    servicePurpose: 'Help tour operators recover transport plans when a performance delay affects departure.',
    audience: 'Tour operations coordinators managing a delayed performance',
    journeyMoment: 'After a performance delay is confirmed and before replacement transport is dispatched',
    surfaceRole: 'exception-workspace',
    defaultState: 'The operator sees the current tour schedule and no active disruption.',
    healthyState: 'The performance and planned transport remain on schedule.',
    exceptionState: 'A delayed performance threatens the planned departure and requires a recovery decision.',
    commonElements: ['Product navigation', 'account and organization context'],
    pageElements: ['Performance context', 'transport plan'],
    exceptionElements: ['Disruption impact', 'recovery options', 'approval action'],
    primaryOutcome: 'Select and confirm the best recovery path',
    primaryAction: 'Approve replacement transport',
    actionConsequence: 'Dispatch the selected provider and supersede the original transport.',
    nextStep: 'Dispatch the selected provider and notify affected staff',
    workflowModel: 'A chronological service flow from event context through disruption, recovery decision, dispatch, and notification.',
    domainObjects: ['Performance event', 'planned transport', 'disruption event', 'replacement option', 'agent update'],
    keyDecisions: ['Whether the disruption requires intervention', 'which replacement protects the next committed event'],
    actionHierarchy: ['Primary: approve the selected replacement', 'Secondary: inspect option consequences', 'Tertiary: contact the agent'],
    operationalRules: ['If no response arrives before the hold expires, release the quote and escalate to the tour manager.'],
    failureModes: ['Provider cancellation', 'stale availability quote', 'approval window expires'],
    sampleContent: ['Performance ended at 22:15', 'Original departure 22:35 is no longer viable', 'Replacement van arrives 22:28 and preserves a 45-minute airport buffer'],
    nonGoals: ['Do not expose every provider detail on the default surface.'],
    successSignals: ['The user can identify the affected event and consequence before acting.'],
    dataRequirements: ['Performance identity and timing', 'venue and route', 'transport availability and freshness'],
    contentPriorities: ['Current incident and required decision', 'performance context', 'recovery consequences'],
    surfaceModel: 'single-surface',
    density: 'minimal',
    borderPolicy: 'borderless',
    cardPolicy: 'avoid',
    overlayPolicy: 'contextual-only',
    dividerPolicy: 'rows-only',
    disclosureStrategy: 'Keep decision evidence inline; use contextual popovers for conditions and one workflow-owned drawer for agent activity.',
    persistentRegions: ['Global product navigation'],
    forbiddenPartitions: ['Full-height content columns', 'fixed bottom action band', 'drawer rendered as a grid column'],
    responsivePriorities: ['Keep the incident, affected timeline event, and primary action first on compact screens.', 'Move supporting service detail after the decision evidence.'],
    accessibilityRequirements: ['Announce incident status and action consequence.', 'Keep every timeline event and action keyboard reachable.'],
    creativeDirection: 'Calm, editorial tour operations with a visible hierarchy grounded in the supplied target.',
    visualTargetStatus: 'user-supplied',
    visualTargetReferences: ['fixture:service-timeline-reference'],
    referenceStatus: 'provided',
    referenceArtifacts: ['fixture:service-timeline-reference'],
    referenceAnalysis: {
      implementationMode: 'adapt-to-project',
      sourcePrecedence: 'User requirements override the supplied reference; the artifact defines timeline structure and spatial rhythm only.',
      pageLandmarks: ['Large context area', 'chronological event stream', 'quiet supporting rail'],
      repeatedPatterns: ['Time-grouped event rows with compact status treatment'],
      hierarchyObservations: ['One dominant context region followed by smaller timeline events'],
      interactionPatterns: ['Event rows open contextual detail without replacing the timeline'],
      responsiveBehavior: ['Compact view preserves chronology and removes nonessential atmosphere'],
      deliberateDeviations: ['Use operational tour events instead of public event discovery content'],
    },
  };
}

function createRequirementsConfirmation(contextRevision) {
  const notApplicable = (rationale) => ({ applicability: 'not-applicable', rationale });
  const required = (description, trigger, visibleChanges, recovery, rationale = 'Required for this operational workflow.') => ({
    applicability: 'required', rationale, description, trigger, visibleChanges, recovery,
  });
  const evidenceFields = [
    'product.name', 'product.purpose', 'product.primaryUser', 'surface.role', 'surface.primaryOutcome',
    'surface.primaryAction', 'surface.actionConsequence', 'surface.nextStep',
    'designIntelligence.workflow', 'designIntelligence.decisions', 'designIntelligence.operationalRules', 'designIntelligence.content', 'designIntelligence.reference',
    'ownership.common', 'ownership.page', 'ownership.exception',
    'states.default', 'states.healthy', 'states.incident', 'sections', 'dataRequirements',
    'visualComposition.surfaceModel', 'visualComposition.borderPolicy', 'visualComposition.disclosures',
  ];
  return {
    contextRevision,
    product: {
      name: 'Roadsync',
      purpose: 'Recover tour transport plans when performance delays threaten departure.',
      primaryUser: 'Tour operations coordinator',
    },
    surface: {
      role: 'exception-workspace',
      entryContext: 'The user opens an incident after a confirmed performance delay.',
      primaryOutcome: 'Choose a viable replacement transport plan.',
      primaryAction: 'Approve replacement transport.',
      actionConsequence: 'The provider is dispatched and the original transport is superseded.',
      nextStep: 'Notify affected staff and monitor dispatch.',
    },
    ownership: {
      common: ['Product navigation', 'Organization switcher'],
      page: ['Performance context', 'Transport plan'],
      exception: ['Disruption impact', 'Recovery decision'],
    },
    states: {
      default: required('Current performance and transport context.', 'Surface entry', ['Show the selected performance and planned transport.'], 'Remain in the default state.'),
      healthy: required('The performance and transport are on schedule.', 'Schedule data confirms no risk.', ['Show an on-time status without incident controls.'], 'Return to default monitoring.'),
      warning: notApplicable('This workflow escalates directly from confirmed delay to incident.'),
      incident: required('The delayed performance threatens departure.', 'Delay exceeds the transport buffer.', ['Show impact, recovery options, and approval.'], 'Move to dispatch monitoring after approval.'),
      empty: notApplicable('The page is opened from a known performance context.'),
      loading: notApplicable('Loading behavior is handled by the shared shell.'),
      error: notApplicable('Fatal retrieval errors are handled by the shared shell.'),
    },
    sections: [
      {
        id: 'app-shell', name: 'Application shell', intent: 'Provide global product and organization navigation.', ownership: 'common',
        visibleStates: ['default', 'healthy', 'incident'], requiredInformation: ['Current organization', 'primary navigation'],
        decisionSupported: 'Confirm product and organization context.', primaryAction: 'Navigate to another workspace.', nextStep: 'Open the selected workspace.', emphasis: 'low',
      },
      {
        id: 'performance-context', name: 'Performance context', intent: 'Identify the affected performance and planned transport.', ownership: 'page',
        visibleStates: ['default', 'healthy', 'incident'], requiredInformation: ['Artist', 'venue', 'performance time', 'planned departure'],
        decisionSupported: 'Confirm that the incident belongs to the correct event.', primaryAction: 'Review schedule details.', nextStep: 'Assess transport impact.', emphasis: 'medium',
      },
      {
        id: 'recovery-decision', name: 'Recovery decision', intent: 'Resolve the transport risk caused by the delay.', ownership: 'exception',
        visibleStates: ['incident'], requiredInformation: ['Delay impact', 'replacement options', 'cost and arrival consequence'],
        decisionSupported: 'Choose the safest viable replacement.', primaryAction: 'Approve replacement transport.', nextStep: 'Dispatch and notify.', emphasis: 'high',
      },
    ],
    dataRequirements: [
      { id: 'performance', name: 'Performance schedule', source: 'Tour schedule service', freshness: 'Updated within one minute', requiredStates: ['default', 'healthy', 'incident'], fallback: 'Show last updated time and block approval if stale.' },
      { id: 'transport', name: 'Transport availability', source: 'Provider availability service', freshness: 'Live quote under two minutes old', requiredStates: ['incident'], fallback: 'Mark unavailable and request a fresh quote.' },
    ],
    designIntelligence: {
      workflow: {
        model: 'Performance event -> disruption event -> recovery decision -> dispatch -> notification.',
        domainObjects: ['Performance event', 'transport event', 'disruption', 'replacement option', 'agent update'],
        failureModes: ['Departure becomes impossible', 'quote expires', 'replacement provider cancels'],
      },
      decisions: {
        keyDecisions: ['Choose the replacement that protects the next committed event.'],
        actionHierarchy: ['Primary: approve replacement', 'Secondary: inspect consequences', 'Tertiary: contact agent'],
        operationalRules: ['If the user does not respond before hold expiry, release the quote and escalate to the tour manager.'],
      },
      content: {
        sampleContent: ['Show ended at 22:15', 'Original departure 22:35', 'Replacement arrival 22:28'],
        nonGoals: ['Do not expose the full provider audit log by default.'],
        successSignals: ['The affected event, consequence, and next action are understood in one scan.'],
      },
      reference: {
        status: 'provided',
        artifacts: ['fixture:service-timeline-reference'],
        implementationMode: 'adapt-to-project',
        sourcePrecedence: 'User requirements override the reference; timeline structure and rhythm transfer.',
        pageLandmarks: ['Context region', 'chronological event stream', 'supporting rail'],
        repeatedPatterns: ['Time-grouped event rows'],
        hierarchyObservations: ['One dominant incident followed by quieter events'],
        interactionPatterns: ['Rows disclose contextual detail'],
        responsiveBehavior: ['Chronology remains first on compact screens'],
        deliberateDeviations: ['Replace event discovery with tour operations'],
      },
    },
    visualComposition: {
      surfaceModel: 'single-surface',
      density: 'minimal',
      borderPolicy: 'borderless',
      cardPolicy: 'avoid',
      overlayPolicy: 'contextual-only',
      dividerPolicy: 'rows-only',
      limits: {
        contentSurfaceCount: 1,
        persistentRegionCount: 1,
        outlinedContainerCount: 0,
        cardCount: 0,
        fullHeightPartitionCount: 0,
      },
      persistentRegions: ['Global product navigation'],
      forbiddenPartitions: ['Full-height content columns', 'fixed bottom action band', 'drawer rendered as a grid column'],
      disclosures: [
        { content: 'Replacement itinerary', owner: 'inline', trigger: 'Expand the selected option', rationale: 'Direct decision evidence belongs with the recommendation.' },
        { content: 'Fare and refund conditions', owner: 'popover', trigger: 'Activate the fare condition trigger', rationale: 'Conditions explain one value and should remain contextual.' },
        { content: 'Agent activity and conversation', owner: 'drawer', trigger: 'Open agent activity', rationale: 'The drawer owns one communication workflow rather than all secondary information.' },
      ],
      constraints: [
        { id: 'single-content-surface', requirement: 'The page-owned content reads as one continuous surface.', verification: 'No full-height background split or vertical content divider appears in either viewport.' },
        { id: 'borderless-content', requirement: 'Page-owned groups use spacing and alignment instead of outlined containers.', verification: 'No outlined page content container appears; dividers are limited to list rows.' },
        { id: 'contextual-disclosure', requirement: 'Each secondary information group remains with its confirmed interaction owner.', verification: 'The recommendation expands inline, fare uses a popover, and the agent drawer contains only activity and conversation.' },
      ],
    },
    responsiveAccessibility: {
      wide: 'Keep context and decision visible without giving equal weight to support detail.',
      compact: 'Stack context before decision and keep the approval action reachable without horizontal scrolling.',
      keyboard: 'All navigation, option selection, and approval actions must be keyboard operable with visible focus.',
      screenReader: 'Announce incident status, option consequences, and approval confirmation in a logical heading order.',
    },
    fieldEvidence: evidenceFields.map((field) => ({ field, source: 'user', reference: `Confirmed test brief: ${field}` })),
    unresolvedQuestions: [],
  };
}

function createDesignContract() {
  return {
    authoringSessionId: 'gateway-authoring-session',
    geometryContract: {
      gridUnitPx: 8,
      geometryTolerancePx: 0,
      minimumPositivePaddingPx: 8,
      uniformPadding: true,
      opticalBalanceTolerancePx: 1,
    },
    designEvidence: {
      skill: 'product-design:ideate',
      capability: {
        host: 'codex',
        provider: 'codex-product-design',
        status: 'used',
        skill: 'product-design:ideate',
        evidenceReferences: ['fixture:service-timeline-reference'],
      },
      visualExploration: {
        status: 'resolved',
        rationale: 'The supplied visible reference grounds art direction, so no new visual alternatives are needed.',
        options: [{ id: 'supplied-target', displayOrder: 1, visualLanguage: 'Calm editorial tour operations', reference: 'fixture:service-timeline-reference' }],
        selectedOptionId: 'supplied-target',
        selectionEvidence: { source: 'artifact', reference: 'fixture:service-timeline-reference' },
      },
      mode: 'divergent',
      presentationSetId: 'gateway-meaningful-options-v1',
      modeRationale: 'The brief leaves open whether the customer should commit from an agent recommendation or first inspect the recovery sequence.',
      options: [
        {
          id: 'decision-led',
          displayOrder: 1,
          experienceHypothesis: 'Customers trust a recovery service when the agent converts operational complexity into one accountable recommendation.',
          primaryDecision: 'Approve the recommended recovery path.',
          dominantEvidence: 'Arrival, buffer, cost, and risk consequences of the agent recommendation.',
          interactionModel: 'decision-first',
          disclosureModel: 'contextual-overlays',
          informationArchitecture: ['Event context', 'Incident impact', 'Recommended commitment', 'Alternative consequences', 'Secondary service details'],
          serviceTradeoff: 'Optimizes decision speed while making the operational audit trail secondary.',
          visualLanguage: 'Calm and restrained',
          reference: 'composition-brief:decision-led',
        },
        {
          id: 'timeline-led',
          displayOrder: 2,
          experienceHypothesis: 'Customers trust a recovery service when they can verify how the incident and agent response change the tour schedule.',
          primaryDecision: 'Approve a recovery path after inspecting schedule protection.',
          dominantEvidence: 'Cause, response, and schedule-protection milestones across time.',
          interactionModel: 'timeline-first',
          disclosureModel: 'inline-progressive',
          informationArchitecture: ['Event context', 'Disruption chronology', 'Recovery milestones', 'Option comparison', 'Approval'],
          serviceTradeoff: 'Optimizes auditability and shared understanding while requiring more reading before commitment.',
          visualLanguage: 'Editorial operations log',
          reference: 'composition-brief:timeline-led',
        },
      ],
      differentiation: [
        {
          leftOptionId: 'decision-led',
          rightOptionId: 'timeline-led',
          axes: ['experience-hypothesis', 'primary-decision', 'dominant-evidence', 'information-architecture', 'interaction-model', 'disclosure-model', 'service-tradeoff'],
          consequence: 'The first shortens commitment time; the second increases traceability before approval.',
        },
      ],
      selectedOptionId: 'decision-led',
      selectionRationale: 'The primary service outcome is a confident recovery decision.',
      constraintAssessments: [
        { constraintId: 'single-content-surface', status: 'pass', note: 'The selected mock keeps page-owned content on one continuous base surface.' },
        { constraintId: 'borderless-content', status: 'pass', note: 'The selected mock uses spacing and list-row dividers instead of outlined content containers.' },
        { constraintId: 'contextual-disclosure', status: 'pass', note: 'The selected mock assigns each secondary information group to its confirmed contextual owner.' },
      ],
    },
    visualHierarchy: {
      attentionOrder: ['Confirm recovery path', 'Compare consequences', 'Review operational detail'],
      primaryFocus: 'Confirm recovery path',
      quietRegions: ['Supporting operational notes'],
      gestalt: {
        figureGround: 'Use one dominant decision surface against a quiet page field.',
        proximity: 'Keep decision evidence adjacent to the action it supports.',
        similarity: 'Reserve repeated row treatment for genuinely comparable options.',
        continuity: 'Lead the eye from decision to consequences to operational detail.',
        visualRelief: 'Use open spacing and low-contrast support copy between dense regions.',
      },
      emphasis: {
        highEmphasisLimit: 1,
        highEmphasisElements: ['Confirm recovery path'],
        borderStrategy: 'Prefer spacing and one divider; avoid nested boxes.',
        typographyStrategy: 'Use strong weight only for the decision and section anchors.',
        spacingStrategy: 'Use a larger gap before supporting operational detail.',
      },
    },
  };
}

function createExploredVisualDesignContract() {
  const contract = createFocusedDesignContract();
  contract.designEvidence.capability = {
    host: 'codex',
    provider: 'codex-product-design',
    status: 'used',
    skill: 'product-design:ideate',
    evidenceReferences: ['visual-option:quiet-editorial', 'visual-option:documentary-stage'],
  };
  contract.designEvidence.visualExploration = {
    status: 'explored',
    rationale: 'The user explicitly requested alternatives, so the Product Design plugin produced two independently visible art directions.',
    options: [
      { id: 'quiet-editorial', displayOrder: 1, visualLanguage: 'Quiet editorial itinerary', reference: 'visual-option:quiet-editorial' },
      { id: 'documentary-stage', displayOrder: 2, visualLanguage: 'Documentary stage journal', reference: 'visual-option:documentary-stage' },
    ],
    selectedOptionId: 'documentary-stage',
    selectionEvidence: { source: 'user', reference: 'user-selection:documentary-stage' },
  };
  return contract;
}

function createFocusedDesignContract() {
  const contract = createDesignContract();
  const selectedOption = contract.designEvidence.options.find((option) => option.id === contract.designEvidence.selectedOptionId);
  return {
    ...contract,
    designEvidence: {
      ...contract.designEvidence,
      mode: 'focused',
      presentationSetId: 'gateway-focused-target-v1',
      modeRationale: 'Prior user feedback already selected a decision-first recovery experience, so alternative product hypotheses would be artificial.',
      options: [selectedOption],
      differentiation: [],
    },
  };
}

function createAcceptedVisualReview({ sourceFile = 'src/workbench-pages/GatewayPage.tsx', sourceRevision, renderRevision, wideBeforeId, wideAfterId, compactBeforeId, compactAfterId }) {
  const pass = (note) => ({ status: 'pass', note });
  const score = (note) => ({ score: 88, status: 'pass', note });
  return {
    sourceFile,
    sourceRevision,
    renderRevision,
    outcome: 'accept',
    targetReference: 'composition-brief:decision-led',
    reviewer: { kind: 'independent', sessionId: 'gateway-review-session', method: 'separate-agent', reference: 'test:independent-quality-review' },
    comparisons: [
      { beforeEvidenceId: wideBeforeId, afterEvidenceId: wideAfterId, observedAttentionOrder: ['Confirm recovery path', 'Compare consequences', 'Review operational detail'], findings: ['The action is the first high-contrast target.'] },
      { beforeEvidenceId: compactBeforeId, afterEvidenceId: compactAfterId, observedAttentionOrder: ['Confirm recovery path', 'Compare consequences', 'Review operational detail'], findings: ['The compact flow preserves the same attention order without horizontal overflow.'] },
    ],
    scorecard: {
      visualHierarchy: score('The primary decision owns the first read.'),
      compositionRhythm: score('Section spacing creates a deliberate decision-to-detail rhythm.'),
      typography: score('Type scale and weight preserve clear semantic levels.'),
      color: score('Color is restrained and semantic.'),
      componentCoherence: score('Registered and native elements share one visual language.'),
      responsiveContinuity: score('Wide and compact views preserve the same direction.'),
      briefSpecificity: score('The composition is specific to transport recovery decisions.'),
      interactionClarity: score('Action consequence and next step remain legible.'),
    },
    blockers: [],
    gestaltAssessment: {
      figureGround: pass('The decision surface separates from the quiet base surface.'),
      proximity: pass('Evidence remains adjacent to the action it supports.'),
      similarity: pass('Only comparable items repeat the same treatment.'),
      continuity: pass('The reading path is decision, consequences, then detail.'),
      visualRelief: pass('Supporting copy and open space provide a deliberate quiet interval.'),
    },
    constraintAssessments: [
      { constraintId: 'single-content-surface', status: 'pass', note: 'Both screenshots keep page-owned content on one continuous surface without full-height content partitions.' },
      { constraintId: 'borderless-content', status: 'pass', note: 'Rendered content groups use whitespace and row dividers without outlined containers.' },
      { constraintId: 'contextual-disclosure', status: 'pass', note: 'Rendered secondary information remains with its confirmed inline, popover, and agent drawer owners.' },
    ],
    refinement: {
      status: 'completed',
      changes: ['Reduced secondary border emphasis after the first render.'],
      rationale: 'The refinement restored one dominant focal point.',
      sourceChangesReference: 'source-diff:test-gateway-refinement',
    },
    warningResolutions: [],
  };
}

async function submitRenderEvidence(activeBridge, { sourceFile = 'src/workbench-pages/GatewayPage.tsx', sourceRevision, renderRevision, phase, width, height, seed, renderer = width >= 1024 ? 'workbench-browser-preview' : 'workbench-design-canvas', metrics = {}, geometry = createGeometryMeasurements(width, height) }) {
  return fetchJson(`${activeBridge.url}/__workbench/authoring/render-evidence.json`, {
    method: 'POST',
    headers: authoringHeaders(activeBridge),
    body: JSON.stringify({
      sourceFile,
      sourceRevision,
      renderRevision,
      phase,
      viewport: { width, height, deviceScaleFactor: 1 },
      capture: {
        renderer,
        route: sourceFile.includes('Saturated') ? '/saturated' : '/gateway',
        capturedAt: new Date().toISOString(),
        domSnapshotHash: `sha256:${String(seed).padStart(64, 'a').slice(-64)}`,
        computedStyleHash: `sha256:${String(seed).padStart(64, 'b').slice(-64)}`,
        metrics: {
          documentScrollWidth: width,
          documentClientWidth: width,
          clippedElementCount: 0,
          contrastViolationCount: 0,
          focusIndicatorViolationCount: 0,
          touchTargetViolationCount: 0,
          missingAltTextCount: 0,
          ...metrics,
        },
        geometry,
      },
      artifact: { mediaType: 'image/png', dataBase64: createPngBase64(width, height, seed) },
    }),
  });
}

function createGeometryMeasurements(viewportWidth, viewportHeight) {
  const rectWidth = Math.min(400, Math.floor((viewportWidth - 16) / 8) * 8);
  const rectHeight = Math.min(240, Math.floor((viewportHeight - 16) / 8) * 8);
  return {
    measurementVersion: 'dom-geometry-v1',
    eligibleElementCount: 1,
    elements: [{
      id: 'primary-surface',
      kind: 'surface',
      rect: { x: 8, y: 8, width: rectWidth, height: rectHeight },
      paddingExpectation: 'uniform',
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      opticalBalanceExpectation: 'symmetric',
      inkBounds: { x: 24, y: 24, width: rectWidth - 32, height: rectHeight - 32 },
      opticalCentroid: { x: 8 + rectWidth / 2, y: 8 + rectHeight / 2 },
    }],
    spacing: [
      { id: 'primary-gap', kind: 'gap', axis: 'vertical', value: 24 },
      { id: 'text-baseline', kind: 'baseline', axis: 'vertical', value: 32 },
    ],
  };
}

function createPngBase64(width, height, seed) {
  const color = Number(seed) % 251;
  const rowLength = 1 + width * 4;
  const raw = Buffer.alloc(rowLength * height);
  for (let y = 0; y < height; y += 1) {
    const offset = y * rowLength;
    raw[offset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixel = offset + 1 + x * 4;
      raw[pixel] = color;
      raw[pixel + 1] = (color + x) % 251;
      raw[pixel + 2] = (color + y) % 251;
      raw[pixel + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([signature, createPngChunk('IHDR', header), createPngChunk('IDAT', deflateSync(raw)), createPngChunk('IEND', Buffer.alloc(0))]).toString('base64');
}

function createPngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (0xedb88320 & -(value & 1));
  }
  return (value ^ 0xffffffff) >>> 0;
}

async function verifyGeneratedDesignSkill() {
  const files = new Map(createWorkbenchProjectGuideFiles({ templateId: 'standard' }));
  const canonicalPath = `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`;
  const metadataPath = `${WORKBENCH_AGENT_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/agents/openai.yaml`;
  const claudePath = `${WORKBENCH_CLAUDE_SKILLS_DIR}/${WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL}/SKILL.md`;
  const skill = files.get(canonicalPath) ?? '';
  assert(skill.includes('projectTarget') && skill.includes('projectBinding') && skill.includes('responseProfile: "full"') && skill.includes('real project source') && skill.includes('Native semantic HTML') && skill.includes('Ordinary React patterns') && skill.includes('catalog match never forces replacement') && skill.includes('Binding/source boundaries') && skill.includes('optional') && skill.includes('There is no mandatory 8px grid') && !skill.includes('exactly three visible art-direction options'), 'generated design skill is missing the relaxed editable-v1 contract');
  assert((files.get(metadataPath) ?? '').includes('allow_implicit_invocation: true'), 'generated Codex design skill does not allow implicit invocation');
  assert((files.get(claudePath) ?? '').includes('visual-design capability') && (files.get(claudePath) ?? '').includes('optional') && (files.get(claudePath) ?? '').includes('../../../.agents/skills/workbench-design-authoring/SKILL.md'), 'generated Claude skill does not treat an installed visual-design capability as optional before delegating to the shared workflow');
}

async function openProject(activeBridge, projectRoot) {
  await fetchJson(`${activeBridge.url}/__workbench/project.json`, {
    method: 'POST',
    headers: bridgeHeaders(activeBridge),
    body: JSON.stringify({ action: 'open', rootPath: projectRoot }),
  });
}

function bridgeHeaders(activeBridge) {
  return { Authorization: `Bearer ${activeBridge.token}`, 'Content-Type': 'application/json' };
}

function authoringHeaders(activeBridge) {
  return { Authorization: `Bearer ${activeBridge.authoringToken}`, 'X-Workbench-Authoring-Project-Id': 'authoring-test', 'Content-Type': 'application/json' };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

async function expectStatus(responsePromise, expected, label) {
  const response = await responsePromise;
  assert(response.status === expected, `${label}: expected ${expected}, got ${response.status}`);
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
