import { copyFile, mkdir } from 'node:fs/promises'

const sourceDirectory = new URL('../src/styles/', import.meta.url)
const outputDirectory = new URL('../dist/', import.meta.url)

await mkdir(outputDirectory, { recursive: true })

await Promise.all(
  ['core.css', 'theme.css', 'tokens.css', 'styles.css'].map((filename) =>
    copyFile(
      new URL(filename, sourceDirectory),
      new URL(filename, outputDirectory),
    ),
  ),
)
