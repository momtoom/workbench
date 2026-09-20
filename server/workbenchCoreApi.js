import { parse } from '@babel/parser';

const WORKBENCH_CORE_PROTOCOL_VERSION = 1;
const MAX_JSON_BODY_BYTES = 1024 * 1024;
const MAX_SOURCE_ANALYSIS_BYTES = 300 * 1024;
const MAX_SOURCE_WRITE_PLAN_BYTES = 900 * 1024;
const SOURCE_WRITE_EXTENSION_PATTERN = /\.(?:css|html?|json|jsx?|tsx?)$/i;

export async function handleWorkbenchCoreRequest(request, response, route) {
  if (!applyCoreCorsHeaders(request, response)) {
    response.status(403).send('Workbench core origin is not allowed');
    return;
  }

  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  try {
    if (route === 'health' && request.method === 'GET') {
      sendJson(response, {
        ok: true,
        protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
        service: 'workbench-hosted-core',
      });
      return;
    }

    if (route === 'bootstrap' && request.method === 'POST') {
      const body = await readJsonBody(request);
      sendJson(response, createBootstrapResponse(body));
      return;
    }

    if (route === 'features' && request.method === 'GET') {
      sendJson(response, createFeatures());
      return;
    }

    if (route === 'templates' && request.method === 'GET') {
      sendJson(response, createTemplates());
      return;
    }

    if (route === 'plan-operation' && request.method === 'POST') {
      const body = await readJsonBody(request);
      sendJson(response, createOperationPlanResponse(body));
      return;
    }

    if (route === 'source-analyze' && request.method === 'POST') {
      const body = await readJsonBody(request);
      sendJson(response, createSourceAnalysisResponse(body));
      return;
    }

    response.setHeader('Allow', getAllowedMethods(route));
    response.status(405).send('Method not allowed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workbench core request failed';
    response.status(400).send(message);
  }
}

function createBootstrapResponse(body) {
  return {
    ok: true,
    mode: 'remote',
    protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
    features: createFeatures(body?.client?.storageKind),
  };
}

function createFeatures(storageKind = 'local-folder') {
  return [
    {
      enabled: true,
      id: 'remote-operation-planning',
      reason: `Hosted core is active for ${storageKind}.`,
    },
    {
      enabled: true,
      id: 'remote-source-write-validation',
      reason: 'Hosted core validates source-write plan metadata before the local bridge writes files.',
    },
    {
      enabled: isRemoteSourceWritePlanRequired(),
      id: 'remote-source-write-required',
      reason: isRemoteSourceWritePlanRequired()
        ? 'Source writes are configured to require hosted core validation.'
        : 'Source writes currently use hosted validation as an advisory gate.',
    },
    {
      enabled: true,
      id: 'remote-template-catalog',
      reason: 'Templates can be served from hosted core without shipping them in the desktop app.',
    },
    {
      enabled: true,
      id: 'local-folder-storage',
      reason: 'Local file access remains scoped to the active project folder through the desktop bridge.',
    },
  ];
}

function isRemoteSourceWritePlanRequired() {
  const value = process.env.WORKBENCH_REQUIRE_REMOTE_WRITE_PLAN;
  return typeof value === 'string' && ['1', 'true', 'yes', 'required'].includes(value.trim().toLowerCase());
}

function createTemplates() {
  return [
    {
      description: 'Hosted-core contract smoke template. It returns a message plan until source-write review is enabled.',
      id: 'hosted-core-message-plan',
      kind: 'page',
      name: 'Hosted core message plan',
    },
  ];
}

export function createOperationPlanResponse(body) {
  if (body?.intent === 'validate-edit' && body?.operation?.kind === 'source.write') {
    return createSourceWriteValidationPlan(body);
  }

  const intent = typeof body?.intent === 'string' ? body.intent : 'unknown';
  const projectName = typeof body?.project?.projectName === 'string'
    ? body.project.projectName
    : 'unknown project';
  return {
    ok: true,
    mode: 'remote',
    plan: {
      createdAt: new Date().toISOString(),
      id: `hosted-plan-${Date.now().toString(36)}`,
      steps: [
        {
          body: `Hosted core received ${intent} for ${projectName}. Local file writes still require a bridge-reviewed operation plan.`,
          kind: 'message',
        },
      ],
      summary: 'Message-only hosted core plan.',
    },
  };
}

function createSourceWriteValidationPlan(body) {
  const operation = body.operation;
  const sourceFile = typeof operation.sourceFile === 'string' ? operation.sourceFile.trim() : '';
  const byteLength = Number.isFinite(operation.byteLength) ? operation.byteLength : 0;
  const maxPatchBytes = Number.isFinite(body?.constraints?.maxPatchBytes)
    ? body.constraints.maxPatchBytes
    : MAX_SOURCE_WRITE_PLAN_BYTES;

  if (body?.constraints?.allowSourceWrites !== true) {
    return {
      ok: false,
      message: 'Hosted core denied source write planning because allowSourceWrites is false.',
    };
  }

  if (!isSafeProjectRelativeSourcePath(sourceFile)) {
    return {
      ok: false,
      message: 'Hosted core denied source write planning for an unsafe source path.',
    };
  }

  if (byteLength <= 0 || byteLength > Math.min(maxPatchBytes, MAX_SOURCE_WRITE_PLAN_BYTES)) {
    return {
      ok: false,
      message: `Hosted core denied source write planning for ${sourceFile}: ${byteLength} bytes is outside the allowed range.`,
    };
  }

  const projectName = typeof body?.project?.projectName === 'string'
    ? body.project.projectName
    : 'unknown project';
  const label = typeof operation.label === 'string' && operation.label.trim()
    ? operation.label.trim()
    : 'source write';
  const contentHash = typeof operation.contentHash === 'string' ? operation.contentHash : 'unhashed';

  return {
    ok: true,
    mode: 'remote',
    plan: {
      createdAt: new Date().toISOString(),
      id: `hosted-source-write-${Date.now().toString(36)}`,
      steps: [
        {
          body: [
            `Hosted core validated ${label} for ${projectName}.`,
            `Source: ${sourceFile}.`,
            `Size: ${byteLength} bytes.`,
            `Hash: ${contentHash}.`,
            'The local bridge must still apply the scoped file write.',
          ].join(' '),
          kind: 'message',
        },
      ],
      summary: `Validated source write for ${sourceFile}.`,
    },
  };
}

export function createSourceAnalysisResponse(body) {
  const source = body?.source;
  const contents = typeof source?.contents === 'string' ? source.contents : '';
  const sourceFile = typeof source?.sourceFile === 'string' && source.sourceFile.trim()
    ? source.sourceFile.trim()
    : 'source.tsx';
  if (!contents.trim()) {
    return {
      ok: false,
      message: 'Missing source.contents for hosted source analysis.',
    };
  }

  const byteLength = Buffer.byteLength(contents, 'utf8');
  if (byteLength > MAX_SOURCE_ANALYSIS_BYTES) {
    return {
      ok: false,
      message: `Source is too large for hosted analysis (${byteLength} bytes).`,
    };
  }

  try {
    const ast = parse(contents, {
      errorRecovery: false,
      plugins: ['typescript', 'jsx'],
      sourceType: 'module',
    });
    const exportedComponents = collectExportedComponentNames(ast.program);
    const primaryComponent = pickPrimaryComponent(ast.program, source?.preferredComponentNames);
    const jsxRoot = primaryComponent ? getReturnedJsx(primaryComponent.node) : null;
    return {
      analysis: {
        byteLength,
        diagnostic: primaryComponent
          ? `Hosted core parsed ${sourceFile} and found ${primaryComponent.name}.`
          : `Hosted core parsed ${sourceFile}, but no readable component return was found.`,
        exportedComponents,
        jsx: jsxRoot ? analyzeJsx(jsxRoot) : null,
        parseable: true,
        primaryComponentName: primaryComponent?.name ?? null,
        sourceFile,
      },
      mode: 'remote',
      ok: true,
      protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
    };
  } catch (error) {
    return {
      analysis: {
        byteLength,
        diagnostic: error instanceof Error ? error.message : `${sourceFile} could not be parsed.`,
        exportedComponents: [],
        jsx: null,
        parseable: false,
        primaryComponentName: null,
        sourceFile,
      },
      mode: 'remote',
      ok: true,
      protocolVersion: WORKBENCH_CORE_PROTOCOL_VERSION,
    };
  }
}

function collectExportedComponentNames(program) {
  const names = new Set();
  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration') {
      if (statement.declaration) {
        const declared = getDeclaredComponentName(statement.declaration);
        if (declared) names.add(declared);
      }
      for (const specifier of statement.specifiers ?? []) {
        const exported = specifier.exported;
        const name = exported?.type === 'Identifier' ? exported.name : exported?.value;
        if (name && isComponentName(name)) names.add(name);
      }
    }
    if (statement.type === 'ExportDefaultDeclaration') {
      const declared = getDeclaredComponentName(statement.declaration);
      if (declared) names.add(declared);
    }
  }
  return [...names].sort();
}

function pickPrimaryComponent(program, preferredComponentNames) {
  const candidates = collectComponentCandidates(program);
  const preferredNames = Array.isArray(preferredComponentNames)
    ? preferredComponentNames.filter((name) => typeof name === 'string')
    : [];
  for (const name of preferredNames) {
    const preferred = candidates.find((candidate) => candidate.name === name);
    if (preferred) return preferred;
  }
  return candidates.find((candidate) => candidate.isDefaultExport) ??
    candidates.find((candidate) => candidate.isNamedExport) ??
    candidates[0] ??
    null;
}

function collectComponentCandidates(program) {
  const candidates = [];
  const declarationsByName = new Map();
  for (const statement of program.body) {
    for (const candidate of getStatementComponentCandidates(statement)) {
      candidates.push(candidate);
      declarationsByName.set(candidate.name, candidate);
    }
  }

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration') {
      const declared = statement.declaration ? getFirstStatementComponentCandidate(statement.declaration) : null;
      if (declared) {
        declared.isNamedExport = true;
        declarationsByName.set(declared.name, declared);
      }
      for (const specifier of statement.specifiers ?? []) {
        const localName = specifier.local?.name;
        const exportedName = specifier.exported?.name ?? specifier.exported?.value;
        const existing = localName ? declarationsByName.get(localName) : null;
        if (existing && exportedName && isComponentName(exportedName)) existing.isNamedExport = true;
      }
    }
    if (statement.type === 'ExportDefaultDeclaration') {
      const declared = getFirstStatementComponentCandidate(statement.declaration);
      if (declared) {
        declared.isDefaultExport = true;
        declarationsByName.set(declared.name, declared);
      } else if (statement.declaration?.type === 'Identifier') {
        const existing = declarationsByName.get(statement.declaration.name);
        if (existing) existing.isDefaultExport = true;
      }
    }
  }

  return [...declarationsByName.values()];
}

function getStatementComponentCandidates(statement) {
  const direct = getFirstStatementComponentCandidate(statement);
  return direct ? [direct] : [];
}

function getFirstStatementComponentCandidate(statement) {
  if (!statement) return null;
  if (statement.type === 'FunctionDeclaration' && statement.id?.name && isComponentName(statement.id.name)) {
    return { name: statement.id.name, node: statement, isDefaultExport: false, isNamedExport: false };
  }
  if (statement.type === 'VariableDeclaration') {
    for (const declaration of statement.declarations ?? []) {
      if (declaration.id?.type !== 'Identifier') continue;
      const name = declaration.id.name;
      if (!isComponentName(name)) continue;
      if (declaration.init?.type === 'ArrowFunctionExpression' || declaration.init?.type === 'FunctionExpression') {
        return { name, node: declaration.init, isDefaultExport: false, isNamedExport: false };
      }
    }
  }
  if (statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration') {
    return getFirstStatementComponentCandidate(statement.declaration);
  }
  if (statement.type === 'ArrowFunctionExpression' || statement.type === 'FunctionExpression') {
    return { name: 'DefaultComponent', node: statement, isDefaultExport: false, isNamedExport: false };
  }
  return null;
}

function getDeclaredComponentName(node) {
  const candidate = getFirstStatementComponentCandidate(node);
  if (candidate) return candidate.name;
  if (node?.type === 'Identifier' && isComponentName(node.name)) return node.name;
  return null;
}

function getReturnedJsx(node) {
  if (!node) return null;
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
    if (node.body?.type === 'JSXElement' || node.body?.type === 'JSXFragment') return node.body;
    if (node.body?.type === 'ParenthesizedExpression') return unwrapJsx(node.body.expression);
    if (node.body?.type === 'BlockStatement') {
      for (const statement of node.body.body ?? []) {
        if (statement.type !== 'ReturnStatement') continue;
        const argument = unwrapJsx(statement.argument);
        if (argument) return argument;
      }
    }
  }
  return null;
}

function unwrapJsx(node) {
  let current = node;
  while (current?.type === 'ParenthesizedExpression' || current?.type === 'TSAsExpression' || current?.type === 'TSSatisfiesExpression') {
    current = current.expression;
  }
  return current?.type === 'JSXElement' || current?.type === 'JSXFragment' ? current : null;
}

function analyzeJsx(root) {
  const summary = {
    componentInstances: 0,
    elements: 0,
    intrinsicElements: 0,
    maxDepth: 0,
    textNodes: 0,
  };
  visitJsx(root, 1, summary);
  return summary;
}

function visitJsx(node, depth, summary) {
  if (!node) return;
  if (node.type === 'JSXElement') {
    summary.elements += 1;
    summary.maxDepth = Math.max(summary.maxDepth, depth);
    const name = getJsxElementName(node.openingElement?.name);
    if (name && /^[a-z]/.test(name)) summary.intrinsicElements += 1;
    else summary.componentInstances += 1;
    for (const child of node.children ?? []) visitJsx(child, depth + 1, summary);
    return;
  }
  if (node.type === 'JSXFragment') {
    summary.maxDepth = Math.max(summary.maxDepth, depth);
    for (const child of node.children ?? []) visitJsx(child, depth + 1, summary);
    return;
  }
  if (node.type === 'JSXText' && node.value.trim()) {
    summary.textNodes += 1;
  }
}

function getJsxElementName(nameNode) {
  if (!nameNode) return null;
  if (nameNode.type === 'JSXIdentifier') return nameNode.name;
  if (nameNode.type === 'JSXMemberExpression') {
    const objectName = getJsxElementName(nameNode.object);
    const propertyName = getJsxElementName(nameNode.property);
    return objectName && propertyName ? `${objectName}.${propertyName}` : objectName ?? propertyName;
  }
  if (nameNode.type === 'JSXNamespacedName') return `${nameNode.namespace.name}:${nameNode.name.name}`;
  return null;
}

function isComponentName(name) {
  return /^[A-Z]/.test(name);
}

function isSafeProjectRelativeSourcePath(path) {
  if (!path || path.startsWith('/') || path.startsWith('~') || path.includes('\\')) return false;
  const parts = path.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) return false;
  return SOURCE_WRITE_EXTENSION_PATTERN.test(path);
}

function applyCoreCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (!isAllowedOrigin(request, origin)) return false;

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Headers', 'authorization, content-type, x-workbench-core-protocol');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Max-Age', '300');
  response.setHeader('Vary', 'Origin');
  return true;
}

function isAllowedOrigin(request, origin) {
  try {
    const parsed = new URL(origin);
    const host = request.headers['x-forwarded-host'] ?? request.headers.host;
    if (host && parsed.host === host) return true;
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost' || parsed.hostname === '::1') return true;
    return false;
  } catch {
    return false;
  }
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;
    if (size > MAX_JSON_BODY_BYTES) {
      throw new Error('Workbench core request body is too large.');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) return null;
  const rawBody = Buffer.concat(chunks).toString('utf8').trim();
  return rawBody ? JSON.parse(rawBody) : null;
}

function sendJson(response, payload) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.status(200).send(JSON.stringify(payload));
}

function getAllowedMethods(route) {
  if (
    route === 'features' ||
    route === 'templates' ||
    route === 'health'
  ) return 'GET, OPTIONS';
  return 'POST, OPTIONS';
}
