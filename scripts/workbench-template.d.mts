export const WORKBENCH_SCHEMA_VERSION: '0.1';
export const WORKBENCH_APP_ID: 'workbench-v1';
export const WORKBENCH_DEFAULT_DEV_COMMAND: 'npm run dev';
export const WORKBENCH_DEFAULT_PAGE_ID: 'page-untitled-page';
export const WORKBENCH_DEFAULT_PAGE_NAME: 'Untitled page';
export const WORKBENCH_DEFAULT_PAGE_SOURCE_FILE: 'src/workbench-pages/UntitledPage.tsx';
export const WORKBENCH_DEFAULT_PAGE_ROUTE: '/untitled-page';
export const WORKBENCH_DEFAULT_TOKEN_CSS_FILE: 'src/workbench-tokens.css';
export const WORKBENCH_DEFAULT_SITE_CSS_FILE: 'src/site.css';
export const WORKBENCH_DEFAULT_TAILWIND_COMPILED_CSS_FILE: 'src/workbench-tailwind.css';
export const WORKBENCH_SHADCN_BASE_COMPILED_CSS_FILE: 'src/workbench-shadcn.css';
export const WORKBENCH_DEFAULT_MAIN_FILE: 'src/main.tsx';
export const WORKBENCH_BUNDLED_COMPONENT_DIR: 'src/components';
export const WORKBENCH_LUCIDE_PREVIEW_ICON_DIR: 'public/workbench-assets/icons/lucide-preview';
export const WORKBENCH_SAMPLE_DIR: 'sample';
export const WORKBENCH_AGENT_GUIDE_DIR: 'docs/workbench-agent';
export const WORKBENCH_PROJECT_AGENT_GUIDE_FILE: 'docs/workbench-agent/WORKBENCH-PROJECT-GUIDE.md';
export const WORKBENCH_COMPONENT_AGENT_GUIDE_FILE: 'docs/workbench-agent/WORKBENCH-COMPONENT-AUTHORING.md';
export const WORKBENCH_AGENT_SKILLS_DIR: '.agents/skills';
export const WORKBENCH_CLAUDE_SKILLS_DIR: '.claude/skills';
export const WORKBENCH_PROJECT_DESIGN_AUTHORING_SKILL: 'workbench-design-authoring';
export const WORKBENCH_PROJECT_AUTHORING_SKILL: 'workbench-project-authoring';
export const WORKBENCH_PROJECT_COMPONENT_AUTHORING_SKILL: 'workbench-project-component-authoring';
export const WORKBENCH_PROJECT_PREVIEW_RUNTIME_SKILL: 'workbench-project-preview-runtime';
export const WORKBENCH_PROJECT_TEMPLATE_STANDARD: 'standard';
export const WORKBENCH_PROJECT_TEMPLATE_TAILWIND: 'tailwind';
export const WORKBENCH_PROJECT_TEMPLATE_SHADCN_BASE: 'shadcn-base';
export const WORKBENCH_PROJECT_TEMPLATE_ASTRYX: 'astryx';

export type WorkbenchProjectTemplateId = 'standard' | 'tailwind' | 'shadcn-base' | 'astryx';

export type WorkbenchProjectFile = [fileName: string, value: unknown];
export type WorkbenchProjectSourceFile = [fileName: string, contents: string | Uint8Array];
export type WorkbenchProjectGuideFile = [fileName: string, contents: string];
export type WorkbenchProjectSampleFile = [fileName: string, contents: string];

export function createWorkbenchProjectFiles(input: {
  projectId: string;
  projectName: string;
  createdAt: string;
  templateId?: WorkbenchProjectTemplateId;
}): WorkbenchProjectFile[];

export function createWorkbenchProjectSourceFiles(input?: {
  projectName?: string;
  templateId?: WorkbenchProjectTemplateId;
}): WorkbenchProjectSourceFile[];

export function createWorkbenchProjectPackageJson(projectName: string, templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectIndexHtml(projectName: string): string;

export function createWorkbenchProjectTsconfig(templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectViteConfig(templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectMainSource(templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectSiteCss(templateId?: WorkbenchProjectTemplateId): string;

export function createInitialWorkbenchTailwindCompiledCss(templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectGuideFiles(input?: {
  templateId?: WorkbenchProjectTemplateId;
}): WorkbenchProjectGuideFile[];

export function createWorkbenchProjectDesignAuthoringSkill(templateId?: WorkbenchProjectTemplateId): string;

export function createWorkbenchProjectSampleFiles(input?: {
  templateId?: WorkbenchProjectTemplateId;
}): WorkbenchProjectSampleFile[];

export function createDefaultWorkbenchPage(): unknown;

export function createWorkbenchConfig(input: {
  projectId: string;
  projectName: string;
  createdAt: string;
  templateId?: WorkbenchProjectTemplateId;
}): unknown;

export function createInitialTokenRegistry(input?: { templateId?: WorkbenchProjectTemplateId }): unknown;

export function createInitialAssetRegistry(input: {
  createdAt: string;
  templateId?: WorkbenchProjectTemplateId;
}): unknown;

export function createInitialComponentRegistry(input: {
  createdAt: string;
  templateId?: WorkbenchProjectTemplateId;
}): unknown;

export function createInitialWorkbenchTokenCss(): string;

export function createWorkbenchDesignPageSource(pageName: string, templateId?: WorkbenchProjectTemplateId): string;
