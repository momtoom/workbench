import { existsSync, readFileSync } from "node:fs"
import { dirname, posix, resolve } from "node:path"
import ts from "typescript"

const root = process.cwd()
const EXTERNAL_ASSET_REFERENCE = /^(?:[a-z][a-z0-9+.-]*:)?\/\/|^figma:/
const pages = read(".workbench/pages.json").pages ?? []
const components = read(".workbench/components.json").components ?? []
const assets = read(".workbench/assets.json").assets ?? []
const registered = new Set(components.map((item) => strip(normalize(item.sourceFile))).filter(Boolean))
const registeredNames = new Set(components.flatMap((item) => [item.importName, item.sourceExportName, item.name]).filter(Boolean))
const registeredAssetUrls = new Set()
const assetByUrl = new Map()
assets.forEach((asset) => collectAssetUrls(asset, registeredAssetUrls, assetByUrl, asset))
const errors = []

for (const page of pages) {
  const file = normalize(page.sourceFile)
  if (!/\.[jt]sx$/i.test(file)) continue
  verify(file, readFileSync(resolve(root, file), "utf8"))
}

if (errors.length) {
  console.error("Workbench page authoring contract failed:")
  errors.forEach((item) => console.error(`- ${item.file}:${item.line} [${item.code}] ${item.message}`))
  process.exit(1)
}
console.log(`Workbench page authoring contract passed (${pages.length} page(s)).`)

function verify(file, contents) {
  const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const registeredImports = new Set()
  const imports = new Set()
  const roots = new Set()

  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && modifier(statement, ts.SyntaxKind.ExportKeyword) && modifier(statement, ts.SyntaxKind.DefaultKeyword)) roots.add(statement.name.text)
    if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) roots.add(statement.expression.text)
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const path = statement.moduleSpecifier.text
    if (path.startsWith("figma:")) fail(statement, "WB-AUTH-EXTERNAL-ASSET", `${path} is a Figma asset import that cannot resolve in a Workbench project. Install the file under public/workbench-assets/ and register it in .workbench/assets.json.`)
    const linked = path.startsWith(".") && isRegistered(file, path)
    const clause = statement.importClause
    if (!clause) continue
    if (clause.name) addImport(clause.name.text, linked)
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) clause.namedBindings.elements.forEach((item) => addImport(item.name.text, linked))
  }

  walk(source)

  function addImport(name, linked) {
    imports.add(name)
    if (linked) registeredImports.add(name)
  }

  function walk(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const name = jsxName(node.tagName)
      if (name && /^[A-Z]/.test(name) && !registeredImports.has(name)) fail(node, "WB-AUTH-UNREGISTERED-COMPONENT", imports.has(name)
        ? `${name} is imported from a package or unregistered source instead of a registered Workbench component.`
        : `${name} does not resolve to a registered Workbench component.`)
      verifySemanticNative(node, name)
      verifyAssetReference(node)
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map") {
      fail(node, "WB-AUTH-MAP", "Designer-editable page structure cannot be generated with .map().")
    }
    if (isFunction(node) && containsJsx(node.body)) {
      const name = functionName(node)
      if (!name || !roots.has(name)) fail(node, "WB-AUTH-LOCAL-JSX-FUNCTION", `${name || "Anonymous JSX function"} is a page-local JSX helper/component.`)
    }
    ts.forEachChild(node, walk)
  }

  function fail(node, code, message) {
    const point = source.getLineAndCharacterOfPosition(node.getStart(source))
    errors.push({ code, file, line: point.line + 1, message })
  }

  function verifySemanticNative(node, name) {
    if (!name || !/^[a-z]/.test(name)) return
    const type = jsxAttribute(node, "type")
    const role = jsxAttribute(node, "role")
    const popup = jsxAttribute(node, "aria-haspopup")
    const roledescription = jsxAttribute(node, "aria-roledescription")
    if (name === "input" && type === "range" && registeredNames.has("Slider")) {
      fail(node, "WB-AUTH-SEMANTIC-COMPONENT", "Use the registered Slider component instead of a native range input.")
      return
    }
    if (role === "slider" && registeredNames.has("Slider")) {
      fail(node, "WB-AUTH-SEMANTIC-COMPONENT", "Use the registered Slider component instead of recreating slider semantics in page markup.")
      return
    }
    if (role === "listitem" && registeredNames.has("Item")) {
      fail(node, "WB-AUTH-SEMANTIC-COMPONENT", "Use the registered Item component for this repeated item surface.")
      return
    }
    if (roledescription === "carousel" && registeredNames.has("Carousel")) {
      fail(node, "WB-AUTH-SEMANTIC-COMPONENT", "Use the registered Carousel component instead of recreating carousel semantics in page markup.")
      return
    }
    if (popup === "menu" && (registeredNames.has("DropdownMenu") || registeredNames.has("Popover"))) {
      fail(node, "WB-AUTH-SEMANTIC-COMPONENT", "Use a registered DropdownMenu or Popover component for this menu interaction.")
    }
  }

  function verifyAssetReference(node) {
    for (const attributeName of ["src", "poster"]) {
      const value = jsxAttribute(node, attributeName)
      if (value) verifyAssetValue(node, `${attributeName} references`, value)
    }
    jsxStyleAssetUrls(node).forEach((value) => verifyAssetValue(node, "style background references", value))
  }

  function verifyAssetValue(node, label, value) {
    if (EXTERNAL_ASSET_REFERENCE.test(value)) {
      fail(node, "WB-AUTH-EXTERNAL-ASSET", `${label} ${value}, which is not a project asset. Install it under public/workbench-assets/ and register it in .workbench/assets.json.`)
      return
    }
    if (!value.startsWith("/workbench-assets/")) return
    if (!registeredAssetUrls.has(value)) {
      fail(node, "WB-AUTH-UNREGISTERED-ASSET", `${label} ${value}, which is not registered in .workbench/assets.json.`)
      return
    }
    const asset = assetByUrl.get(value)
    const filePath = normalize(asset?.source?.filePath)
    if (filePath && !existsSync(resolve(root, filePath))) {
      fail(node, "WB-AUTH-ASSET-FILE-MISSING", `${value} is registered but its project file is missing at ${filePath}.`)
    }
  }
}

function jsxStyleAssetUrls(node) {
  const attribute = node.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.text === "style")
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer || !ts.isJsxExpression(attribute.initializer)) return []
  const expression = attribute.initializer.expression
  if (!expression || !ts.isObjectLiteralExpression(expression)) return []
  const urls = []
  for (const property of expression.properties) {
    if (!ts.isPropertyAssignment(property) || !ts.isStringLiteralLike(property.initializer)) continue
    const name = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : ""
    if (name !== "background" && name !== "backgroundImage") continue
    for (const match of property.initializer.text.toLowerCase().matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) urls.push(match[1].trim())
  }
  return urls
}

function collectAssetUrls(value, urls, byUrl, owner) {
  if (Array.isArray(value)) return value.forEach((item) => collectAssetUrls(item, urls, byUrl, owner))
  if (!value || typeof value !== "object") return
  for (const [key, item] of Object.entries(value)) {
    if (key === "value" && typeof item === "string" && item.startsWith("/workbench-assets/")) {
      urls.add(item.toLowerCase())
      byUrl.set(item.toLowerCase(), owner)
    } else collectAssetUrls(item, urls, byUrl, owner)
  }
}

function jsxAttribute(node, name) {
  const attribute = node.attributes.properties.find((item) => ts.isJsxAttribute(item) && item.name.text === name)
  if (!attribute || !ts.isJsxAttribute(attribute) || !attribute.initializer) return null
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text.toLowerCase()
  const expression = ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression : null
  return expression && ts.isStringLiteralLike(expression) ? expression.text.toLowerCase() : null
}

function modifier(node, kind) {
  return node.modifiers?.some((item) => item.kind === kind) ?? false
}
function isFunction(node) {
  return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)
}
function functionName(node) {
  if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) && node.name) return node.name.text
  return ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) ? node.parent.name.text : null
}
function containsJsx(node) {
  if (!node) return false
  let found = false
  const scan = (item) => {
    if (ts.isJsxElement(item) || ts.isJsxSelfClosingElement(item) || ts.isJsxFragment(item)) found = true
    else if (!found) ts.forEachChild(item, scan)
  }
  scan(node)
  return found
}
function jsxName(tag) {
  if (ts.isIdentifier(tag)) return tag.text
  if (ts.isPropertyAccessExpression(tag)) return jsxName(tag.expression)
  return null
}
function isRegistered(file, importPath) {
  const path = normalize(posix.normalize(posix.join(dirname(file), importPath)))
  return registered.has(strip(path)) || registered.has(strip(posix.join(path, "index")))
}
function strip(value) {
  return value.replace(/\.(?:jsx?|tsx?)$/i, "")
}
function normalize(value) {
  return typeof value === "string" ? value.trim().replace(/\\/g, "/").replace(/^\/+|^\.\//g, "") : ""
}
function read(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"))
}
