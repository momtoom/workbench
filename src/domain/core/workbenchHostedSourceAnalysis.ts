import {
  createWorkbenchCoreClient,
  type WorkbenchCoreSourceAnalysis,
} from './workbenchCoreClient';

export type WorkbenchHostedSourceAnalysisInput = {
  contents: string;
  preferredComponentNames?: string[];
  sourceFile: string;
};

export async function analyzeSourceWithHostedCore(
  input: WorkbenchHostedSourceAnalysisInput,
): Promise<WorkbenchCoreSourceAnalysis | null> {
  const client = createWorkbenchCoreClient();
  if (client.mode !== 'remote') return null;

  const result = await client.analyzeSource({
    protocolVersion: 1,
    source: {
      contents: input.contents,
      preferredComponentNames: input.preferredComponentNames,
      sourceFile: input.sourceFile,
    },
  });

  if (!result.ok || result.mode !== 'remote') return null;
  return result.analysis;
}

export function formatHostedSourceAnalysisDiagnostic(
  analysis: WorkbenchCoreSourceAnalysis | null,
): string | null {
  if (!analysis) return null;
  if (!analysis.parseable) return `Hosted core could not parse ${analysis.sourceFile}: ${analysis.diagnostic}`;
  const jsx = analysis.jsx;
  const jsxSummary = jsx
    ? `${jsx.elements} JSX element${jsx.elements === 1 ? '' : 's'}, ${jsx.componentInstances} component instance${jsx.componentInstances === 1 ? '' : 's'}`
    : 'no readable JSX return';
  return `${analysis.diagnostic} (${jsxSummary}).`;
}
