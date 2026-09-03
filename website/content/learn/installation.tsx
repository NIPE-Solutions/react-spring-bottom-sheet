import Link from 'next/link'
import { CodeBlock } from '../../components/source-code/CodeBlock'
import { buildEvidence } from '../evidence'
import { getReleasePresentation } from '../release'

export async function InstallationGuide({
  version = buildEvidence.version,
}: {
  version?: string
}) {
  const release = getReleasePresentation(version)
  const installCode = await CodeBlock({
    source: release.installCommand,
    language: 'shell',
  })
  const stylesCode = await CodeBlock({
    source: "import '@nipe-solutions/react-spring-bottom-sheet/styles.css'",
    language: 'tsx',
  })

  return (
    <>
      <section id="package">
        <h2>Package</h2>
        <p>
          Install the package alongside React 19 and React DOM 19.{' '}
          {!release.published ? (
            <>
              <strong>Prepared release</strong>: version {version} is not
              published yet. After publication, it will be available from
              npm&apos;s <code>{release.channel}</code> tag.
            </>
          ) : release.prerelease ? (
            <>
              <strong>Prerelease channel</strong>: version {version} is
              available from npm&apos;s <code>{release.channel}</code> tag.
            </>
          ) : null}
        </p>
        {!release.published ? <p>After publication</p> : null}
        {installCode}
        <p>
          Import components from the package root. The package publishes ESM,
          CommonJS, and TypeScript declarations through explicit exports.
        </p>
      </section>
      <section id="styles">
        <h2>Styles</h2>
        <p>Choose one styling path at the application entry point:</p>
        <ul>
          <li>
            <code>styles.css</code> includes mechanics and the default theme.
          </li>
          <li>
            <code>core.css</code> includes mechanics only for a complete
            restyle.
          </li>
          <li>
            <code>theme.css</code> and <code>tokens.css</code> support selective
            composition.
          </li>
        </ul>
        {stylesCode}
        <p>
          <Link href="/examples/basic/">Build the first working sheet</Link>
        </p>
      </section>
    </>
  )
}
