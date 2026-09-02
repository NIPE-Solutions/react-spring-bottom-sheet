import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'

const expectedBrowserProjects = ['chromium', 'firefox', 'webkit']
const browserLabels = {
  chromium: 'Chromium',
  firefox: 'Firefox',
  webkit: 'WebKit',
}

export async function collectBuildEvidence({
  packagePath,
  modulePath,
  browserConfigPath = 'playwright.website.config.ts',
}) {
  const [packageContents, moduleContents, browserConfig] = await Promise.all([
    readFile(packagePath, 'utf8'),
    readFile(modulePath),
    import(pathToFileURL(resolve(browserConfigPath)).href),
  ])
  const packageMetadata = JSON.parse(packageContents)
  const browserProjects = browserConfig.default.projects.map(({ name }) => name)

  if (
    browserProjects.length !== expectedBrowserProjects.length ||
    browserProjects.some(
      (project, index) => project !== expectedBrowserProjects[index],
    )
  ) {
    throw new Error(
      'Website CI must test Chromium, Firefox, and WebKit before publishing that browser claim.',
    )
  }

  return {
    version: packageMetadata.version,
    moduleGzipBytes: gzipSync(moduleContents).byteLength,
    browserEngines: browserProjects.map((project) => browserLabels[project]),
    reactRange: packageMetadata.peerDependencies.react,
  }
}

function quote(value) {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

export async function writeWebsiteEvidence({
  packagePath = 'package.json',
  modulePath = 'dist/index.js',
  outputPath = 'website/content/evidence.ts',
  browserConfigPath = 'playwright.website.config.ts',
} = {}) {
  const evidence = await collectBuildEvidence({
    packagePath,
    modulePath,
    browserConfigPath,
  })
  const output = `export interface BuildEvidence {
  version: string
  moduleGzipBytes: number
  browserEngines: readonly ['Chromium', 'Firefox', 'WebKit']
  reactRange: string
}

export const buildEvidence = {
  version: ${quote(evidence.version)},
  moduleGzipBytes: ${evidence.moduleGzipBytes},
  browserEngines: [${evidence.browserEngines.map(quote).join(', ')}],
  reactRange: ${quote(evidence.reactRange)},
} as const satisfies BuildEvidence
`

  await writeFile(outputPath, output)
  return evidence
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeWebsiteEvidence()
}
