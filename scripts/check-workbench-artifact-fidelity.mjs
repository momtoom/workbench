import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import ts from 'typescript'

const root = process.cwd()
const contractsDirectory = path.join(root, 'scripts', 'artifact-fidelity-contracts')
const renderedHtmlArgument = process.argv.find((argument) => argument.startsWith('--rendered-html='))
const contractArgument = process.argv.find((argument) => argument.startsWith('--contract='))
const renderedHtmlPath = renderedHtmlArgument?.slice('--rendered-html='.length)
const requestedContractId = contractArgument?.slice('--contract='.length)

const failures = []
const coveredSourceFiles = new Set()
let contractFiles = []
let selectedContract = null

try {
  contractFiles = (await readdir(contractsDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
} catch {
  failures.push('scripts/artifact-fidelity-contracts is missing')
}

for (const contractFile of contractFiles) {
  const contractPath = path.join(contractsDirectory, contractFile)
  const contract = JSON.parse(await readFile(contractPath, 'utf8'))

  validateContractShape(contract, contractFile)
  if (requestedContractId && contract.id !== requestedContractId) continue
  if (requestedContractId) selectedContract = contract

  for (const target of contract.targets ?? []) {
    coveredSourceFiles.add(target.sourceFile)
    await verifySourceTarget(contract, target)
  }

  if (renderedHtmlPath && (!requestedContractId || contract.id === requestedContractId)) {
    await verifyRenderedHtml(contract, renderedHtmlPath)
  }
}

if (requestedContractId && !selectedContract) {
  failures.push(`Unknown artifact fidelity contract: ${requestedContractId}`)
}

await requireContractsForStarterArtifactPages()

if (failures.length > 0) {
  console.error('Workbench artifact fidelity check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  `Workbench artifact fidelity check passed (${contractFiles.length} contract${contractFiles.length === 1 ? '' : 's'}).`,
)

function validateContractShape(contract, contractFile) {
  if (contract.version !== 1) failures.push(`${contractFile}: version must be 1`)
  if (!contract.id) failures.push(`${contractFile}: id is required`)
  if (contract.status !== 'approved') failures.push(`${contractFile}: status must be approved`)
  if (!Array.isArray(contract.targets) || contract.targets.length === 0) {
    failures.push(`${contractFile}: at least one target is required`)
  }

  const hash = contract.canonicalArtifact?.sha256
  if (!/^[a-f0-9]{64}$/.test(hash ?? '')) {
    failures.push(`${contractFile}: canonicalArtifact.sha256 must be a SHA-256 hex digest`)
  }

  const manifest = contract.artifactManifest
  if (!manifest || typeof manifest !== 'object') {
    failures.push(`${contractFile}: artifactManifest is required`)
    return
  }
  for (const key of ['sourcePrecedence', 'pageBoundary', 'orderedTracks']) {
    if (!manifest[key]) failures.push(`${contractFile}: artifactManifest.${key} is required`)
  }
}

async function verifySourceTarget(contract, target) {
  const absoluteSourceFile = path.join(root, target.sourceFile)
  let source
  try {
    source = await readFile(absoluteSourceFile, 'utf8')
  } catch {
    failures.push(`${contract.id}: missing protected source ${target.sourceFile}`)
    return
  }

  if (target.sha256) {
    const actualHash = createHash('sha256').update(source).digest('hex')
    if (actualHash !== target.sha256) {
      failures.push(`${contract.id}: ${target.sourceFile} SHA-256 changed`)
    }
  }

  const sourceFile = ts.createSourceFile(
    absoluteSourceFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const jsxCounts = collectJsxElementCounts(sourceFile)
  const imports = collectImports(sourceFile)

  for (const [elementName, expectedCount] of Object.entries(target.jsxElementCounts ?? {})) {
    const actualCount = jsxCounts.get(elementName) ?? 0
    if (actualCount !== expectedCount) {
      failures.push(
        `${contract.id}: ${target.sourceFile} requires ${elementName}=${expectedCount}, found ${actualCount}`,
      )
    }
  }

  for (const elementName of target.forbiddenJsxElements ?? []) {
    const actualCount = jsxCounts.get(elementName) ?? 0
    if (actualCount > 0) {
      failures.push(
        `${contract.id}: ${target.sourceFile} forbids <${elementName}> (${actualCount} found)`,
      )
    }
  }

  for (const requirement of target.requiredImports ?? []) {
    const importedNames = imports.get(requirement.from) ?? new Set()
    for (const importedName of requirement.names ?? []) {
      if (!importedNames.has(importedName)) {
        failures.push(
          `${contract.id}: ${target.sourceFile} must import ${importedName} from ${requirement.from}`,
        )
      }
    }
  }

  for (const forbiddenText of target.forbiddenSourceText ?? []) {
    if (source.includes(forbiddenText)) {
      failures.push(
        `${contract.id}: ${target.sourceFile} contains forbidden approximation text ${JSON.stringify(forbiddenText)}`,
      )
    }
  }

  for (const requiredText of target.requiredSourceText ?? []) {
    if (!source.includes(requiredText)) {
      failures.push(
        `${contract.id}: ${target.sourceFile} is missing required contract text ${JSON.stringify(requiredText)}`,
      )
    }
  }
}

async function verifyRenderedHtml(contract, htmlPath) {
  const absoluteHtmlPath = path.resolve(root, htmlPath)
  const html = await readFile(absoluteHtmlPath, 'utf8')
  const actualCounts = countDataSlots(html)
  const expectedCounts = contract.renderedContract?.dataSlotCounts ?? {}

  for (const [slot, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = actualCounts.get(slot) ?? 0
    if (actualCount !== expectedCount) {
      failures.push(
        `${contract.id}: rendered HTML requires data-slot=${slot} count ${expectedCount}, found ${actualCount}`,
      )
    }
  }

  if (contract.renderedContract?.requireExactDataSlotSet) {
    const expectedSlots = new Set(Object.keys(expectedCounts))
    for (const slot of actualCounts.keys()) {
      if (!expectedSlots.has(slot)) {
        failures.push(`${contract.id}: rendered HTML contains unexpected data-slot=${slot}`)
      }
    }
  }
}

async function requireContractsForStarterArtifactPages() {
  const starterRoot = path.join(root, 'scripts', 'workbench-starter')
  const starterNames = await readdir(starterRoot)

  for (const starterName of starterNames) {
    const pagesDirectory = path.join(starterRoot, starterName, 'src', 'workbench-pages')
    let pageFiles
    try {
      pageFiles = await readdir(pagesDirectory)
    } catch {
      continue
    }

    for (const pageFile of pageFiles) {
      if (!pageFile.endsWith('.tsx') || pageFile === 'UntitledPage.tsx') continue
      const sourceFile = path.relative(root, path.join(pagesDirectory, pageFile))
      if (!coveredSourceFiles.has(sourceFile)) {
        failures.push(`Starter artifact page has no fidelity contract: ${sourceFile}`)
      }
    }
  }
}

function collectJsxElementCounts(sourceFile) {
  const counts = new Map()
  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = node.tagName.getText(sourceFile)
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return counts
}

function collectImports(sourceFile) {
  const imports = new Map()
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const moduleName = statement.moduleSpecifier.text
    const importedNames = imports.get(moduleName) ?? new Set()
    const clause = statement.importClause
    if (clause?.name) importedNames.add('default')
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        importedNames.add(element.propertyName?.text ?? element.name.text)
      }
    }
    imports.set(moduleName, importedNames)
  }
  return imports
}

function countDataSlots(html) {
  const counts = new Map()
  const markupOnly = html.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  for (const match of markupOnly.matchAll(/<[a-z][^>]*\sdata-slot=["']([^"']+)["']/gi)) {
    counts.set(match[1], (counts.get(match[1]) ?? 0) + 1)
  }
  return counts
}
