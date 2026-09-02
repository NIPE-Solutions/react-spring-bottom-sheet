import { existsSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const SHEET_MEMBER_ORDER = [
  'Root',
  'Trigger',
  'Portal',
  'Backdrop',
  'Viewport',
  'Content',
  'Handle',
  'Title',
  'Description',
  'Close',
]

const PUBLIC_EXPORT_ORDER = [
  'Sheet',
  'BottomSheet',
  'BottomSheetProps',
  'SheetRootProps',
  'SheetTriggerProps',
  'SheetPortalProps',
  'SheetBackdropProps',
  'SheetViewportProps',
  'SheetContentProps',
  'SheetHandleProps',
  'SheetTitleProps',
  'SheetDescriptionProps',
  'SheetCloseProps',
  'OpenChangeDetails',
  'OpenChangeReason',
  'SnapPoint',
  'SnapPointValue',
]

const PUBLIC_EXPORT_RANK = new Map(
  PUBLIC_EXPORT_ORDER.map((name, index) => [name, index]),
)

const TYPE_FORMAT_FLAGS =
  ts.TypeFormatFlags.NoTruncation |
  ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope |
  ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeIdentifier(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function resolveAlias(symbol, checker) {
  let resolved = symbol

  while (resolved.flags & ts.SymbolFlags.Alias) {
    const next = checker.getAliasedSymbol(resolved)
    if (next === resolved) break
    resolved = next
  }

  return resolved
}

function declarationFor(symbol) {
  return symbol.valueDeclaration ?? symbol.declarations?.[0]
}

function sourcePathFor(declaration, projectRoot) {
  const declarationPath = path.resolve(declaration.getSourceFile().fileName)
  const relativeDeclarationPath = path.relative(projectRoot, declarationPath)
  const normalizedRelativePath = relativeDeclarationPath
    .split(path.sep)
    .join('/')

  if (
    !normalizedRelativePath.startsWith('dist/') ||
    !normalizedRelativePath.endsWith('.d.ts')
  ) {
    return normalizedRelativePath
  }

  const stem = normalizedRelativePath
    .slice('dist/'.length)
    .slice(0, -'.d.ts'.length)
  const sourceStem = path.join(projectRoot, 'src', stem)

  for (const extension of ['.tsx', '.ts', '.mts', '.cts']) {
    if (existsSync(`${sourceStem}${extension}`)) {
      return `src/${stem}${extension}`
    }
  }

  return normalizedRelativePath
}

function isPackageOwned(symbol, projectRoot) {
  return (symbol.declarations ?? []).some((declaration) => {
    const sourceFile = path.resolve(declaration.getSourceFile().fileName)
    const relativePath = path.relative(projectRoot, sourceFile)
    return (
      relativePath !== '' &&
      !relativePath.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativePath) &&
      !relativePath.startsWith(`node_modules${path.sep}`)
    )
  })
}

function formatType(type, checker, location) {
  return normalizeWhitespace(
    checker.typeToString(type, location, TYPE_FORMAT_FLAGS),
  )
}

function formatTypeNode(typeNode) {
  return normalizeWhitespace(typeNode.getText())
}

function propertyTypeNode(symbol) {
  const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
  return declaration && 'type' in declaration ? declaration.type : undefined
}

function collectTypeMembers(symbol, checker, projectRoot) {
  const type = checker.getDeclaredTypeOfSymbol(symbol)
  const directMembers = []
  const seen = new Set()

  for (const declaration of symbol.declarations ?? []) {
    if (
      !ts.isInterfaceDeclaration(declaration) &&
      !ts.isTypeLiteralNode(declaration)
    ) {
      continue
    }

    for (const member of declaration.members) {
      if (!('name' in member) || !member.name || !ts.isIdentifier(member.name))
        continue
      const memberSymbol = checker.getSymbolAtLocation(member.name)
      if (!memberSymbol || seen.has(memberSymbol.name)) continue
      seen.add(memberSymbol.name)
      directMembers.push(memberSymbol)
    }
  }

  const inheritedMembers = checker
    .getPropertiesOfType(type)
    .filter(
      (member) => !seen.has(member.name) && isPackageOwned(member, projectRoot),
    )

  const members = [...directMembers, ...inheritedMembers].map((member) => {
    const typeNode = propertyTypeNode(member)
    const declaration = declarationFor(member)
    const memberType = typeNode
      ? formatTypeNode(typeNode)
      : formatType(
          checker.getTypeOfSymbolAtLocation(member, declaration),
          checker,
          declaration,
        )

    return {
      name: member.name,
      signature: memberType,
      required: !(member.flags & ts.SymbolFlags.Optional),
    }
  })

  return members.length === 0 ? undefined : members
}

function interfaceSignature(declaration) {
  const heritage = declaration.heritageClauses
    ?.filter((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)
    .flatMap((clause) => clause.types.map((type) => formatTypeNode(type)))

  return heritage?.length
    ? `interface ${declaration.name.text} extends ${heritage.join(', ')}`
    : `interface ${declaration.name.text}`
}

function extractTypeEntry(name, symbol, checker, projectRoot) {
  const declaration = declarationFor(symbol)

  if (ts.isInterfaceDeclaration(declaration)) {
    const members = collectTypeMembers(symbol, checker, projectRoot)
    return {
      id: normalizeIdentifier(name),
      name,
      kind: 'type',
      signature: interfaceSignature(declaration),
      source: sourcePathFor(declaration, projectRoot),
      ...(members && { members }),
    }
  }

  if (ts.isTypeAliasDeclaration(declaration)) {
    const members = collectTypeMembers(symbol, checker, projectRoot)
    return {
      id: normalizeIdentifier(name),
      name,
      kind: 'type',
      signature: formatTypeNode(declaration.type),
      source: sourcePathFor(declaration, projectRoot),
      ...(members && { members }),
    }
  }

  return undefined
}

function extractSheetEntry(symbol, checker, projectRoot) {
  const declaration = declarationFor(symbol)
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)
  const properties = new Map(
    type.getProperties().map((property) => [property.name, property]),
  )
  const missingMembers = SHEET_MEMBER_ORDER.filter(
    (name) => !properties.has(name),
  )

  if (missingMembers.length > 0) {
    throw new Error(
      `Sheet namespace is incomplete: missing ${missingMembers.join(', ')}`,
    )
  }

  return {
    id: 'sheet',
    name: 'Sheet',
    kind: 'namespace',
    signature: 'Sheet',
    source: sourcePathFor(declaration, projectRoot),
    members: SHEET_MEMBER_ORDER.map((name) => {
      const member = properties.get(name)
      const memberDeclaration = declarationFor(member)
      return {
        name,
        signature: formatType(
          checker.getTypeOfSymbolAtLocation(member, memberDeclaration),
          checker,
          memberDeclaration,
        ),
        required: !(member.flags & ts.SymbolFlags.Optional),
      }
    }),
  }
}

function extractComponentEntry(name, symbol, checker, projectRoot) {
  const declaration = declarationFor(symbol)
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration)

  if (type.getCallSignatures().length === 0) return undefined

  return {
    id: normalizeIdentifier(name),
    name,
    kind: 'component',
    signature: formatType(type, checker, declaration),
    source: sourcePathFor(declaration, projectRoot),
  }
}

function extractEntry(exportSymbol, checker, projectRoot) {
  const name = exportSymbol.name
  const symbol = resolveAlias(exportSymbol, checker)

  if (name === 'Sheet') {
    return extractSheetEntry(symbol, checker, projectRoot)
  }

  if (symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias)) {
    return extractTypeEntry(name, symbol, checker, projectRoot)
  }

  return extractComponentEntry(name, symbol, checker, projectRoot)
}

function compareEntries(left, right) {
  const leftRank = PUBLIC_EXPORT_RANK.get(left.name)
  const rightRank = PUBLIC_EXPORT_RANK.get(right.name)

  if (leftRank !== undefined || rightRank !== undefined) {
    if (leftRank === undefined) return 1
    if (rightRank === undefined) return -1
    return leftRank - rightRank
  }

  return left.name < right.name ? -1 : left.name > right.name ? 1 : 0
}

export function extractPublicApi({ declarationFile, projectRoot }) {
  const root = path.resolve(projectRoot)
  const declarationRoot = path.resolve(declarationFile)

  if (!existsSync(declarationRoot)) {
    throw new Error(`Declaration root not found: ${declarationRoot}`)
  }

  const program = ts.createProgram({
    rootNames: [declarationRoot],
    options: {
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
    },
  })
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(declarationRoot)

  if (!sourceFile) {
    throw new Error(`Unable to load declaration root: ${declarationRoot}`)
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile)
  if (!moduleSymbol) {
    throw new Error(`Unable to read module exports from: ${declarationRoot}`)
  }

  const seenIdentifiers = new Map()
  const entries = checker
    .getExportsOfModule(moduleSymbol)
    .map((exportSymbol) => {
      const entry = extractEntry(exportSymbol, checker, root)
      if (!entry) {
        throw new Error(`Unsupported public export "${exportSymbol.name}"`)
      }

      const previous = seenIdentifiers.get(entry.id)
      if (previous) {
        throw new Error(
          `Duplicate normalized identifier "${entry.id}" for "${previous}" and "${entry.name}"`,
        )
      }
      seenIdentifiers.set(entry.id, entry.name)
      return entry
    })

  return entries.sort(compareEntries)
}

export function serializePublicApi(entries) {
  return `${JSON.stringify(entries, null, 2)}\n`
}
