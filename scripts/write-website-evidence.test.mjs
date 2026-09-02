import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { gzipSync } from 'node:zlib'
import {
  collectBuildEvidence,
  writeWebsiteEvidence,
} from './write-website-evidence.mjs'

test('collects published facts from package metadata and the built module', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsbs-evidence-'))
  const packagePath = join(directory, 'package.json')
  const modulePath = join(directory, 'index.js')
  const browserConfigPath = join(directory, 'playwright.config.mjs')
  const moduleContents = 'export const sheet = true\n'.repeat(20)

  await writeFile(
    packagePath,
    JSON.stringify({
      version: '5.1.0-beta.2',
      peerDependencies: { react: '^19.1.0', 'react-dom': '^19.1.0' },
    }),
  )
  await writeFile(modulePath, moduleContents)
  await writeFile(
    browserConfigPath,
    "export default { projects: [{ name: 'chromium' }, { name: 'firefox' }, { name: 'webkit' }] }",
  )

  assert.deepEqual(
    await collectBuildEvidence({ packagePath, modulePath, browserConfigPath }),
    {
      version: '5.1.0-beta.2',
      moduleGzipBytes: gzipSync(moduleContents).byteLength,
      browserEngines: ['Chromium', 'Firefox', 'WebKit'],
      reactRange: '^19.1.0',
    },
  )
})

test('rejects a browser claim that has drifted from the CI matrix', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsbs-evidence-'))
  const packagePath = join(directory, 'package.json')
  const modulePath = join(directory, 'index.js')
  const browserConfigPath = join(directory, 'playwright.config.mjs')

  await writeFile(
    packagePath,
    JSON.stringify({
      version: '5.0.0',
      peerDependencies: { react: '^19.0.0' },
    }),
  )
  await writeFile(modulePath, 'export {}')
  await writeFile(
    browserConfigPath,
    "export default { projects: [{ name: 'chromium' }, { name: 'firefox' }] }",
  )

  await assert.rejects(
    collectBuildEvidence({ packagePath, modulePath, browserConfigPath }),
    /Chromium, Firefox, and WebKit/,
  )
})

test('writes an importable typed evidence module', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'rsbs-evidence-'))
  const packagePath = join(directory, 'package.json')
  const modulePath = join(directory, 'index.js')
  const outputPath = join(directory, 'evidence.ts')
  const browserConfigPath = join(directory, 'playwright.config.mjs')

  await writeFile(
    packagePath,
    JSON.stringify({
      version: '5.0.0-alpha.4',
      peerDependencies: { react: '^19.0.0' },
    }),
  )
  await writeFile(modulePath, 'export {}')
  await writeFile(
    browserConfigPath,
    "export default { projects: [{ name: 'chromium' }, { name: 'firefox' }, { name: 'webkit' }] }",
  )
  await writeWebsiteEvidence({
    packagePath,
    modulePath,
    outputPath,
    browserConfigPath,
  })

  const output = await readFile(outputPath, 'utf8')
  assert.match(output, /export interface BuildEvidence/)
  assert.match(output, /version: '5\.0\.0-alpha\.4'/)
  assert.match(output, /browserEngines: \['Chromium', 'Firefox', 'WebKit'\]/)
})
