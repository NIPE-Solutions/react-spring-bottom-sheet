import Link from 'next/link'
import { buildEvidence } from '../evidence'
import { getReleasePresentation } from '../release'

export function InstallationGuide() {
  const release = getReleasePresentation(buildEvidence.version)

  return (
    <>
      <section id="package">
        <h2>Package</h2>
        <p>
          Install the package alongside React 19 and React DOM 19.{' '}
          {release.prerelease ? (
            <>
              <strong>Prerelease channel</strong>: version{' '}
              {buildEvidence.version} is available from npm&apos;s{' '}
              <code>{release.channel}</code> tag while version 5 completes
              consumer validation.
            </>
          ) : null}
        </p>
        <pre>
          <code>{release.installCommand}</code>
        </pre>
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
        <pre>
          <code>
            {"import '@nipe-solutions/react-spring-bottom-sheet/styles.css'"}
          </code>
        </pre>
        <p>
          <Link href="/examples/basic/">Build the first working sheet</Link>
        </p>
      </section>
    </>
  )
}
