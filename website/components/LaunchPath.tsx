import Link from 'next/link'
import { CodeBlock } from './source-code/CodeBlock'
import { getReleasePresentation } from '../content/release'

export async function LaunchPath({ version }: { version: string }) {
  const release = getReleasePresentation(version)
  const installCode = await CodeBlock({
    source: release.installCommand,
    language: 'shell',
    label: 'Release install command',
  })

  return (
    <section className="docs-launch-path" aria-labelledby="launch-title">
      <p className="docs-home-kicker">Release confidence</p>
      <div>
        <h2 id="launch-title">A deliberate path to 5.0.</h2>
        <p>
          {!release.published
            ? `Version ${version} is the prepared release, but it is not published yet. After the protected release workflow publishes it, the ${release.channel} channel will make it available.`
            : release.prerelease
              ? `Version ${version} is the current prerelease build. Install it from the next channel to validate the redesigned API before stable promotion.`
              : `Version ${version} is available from the stable npm channel.`}
        </p>
      </div>
      <div className="docs-launch-actions">
        {!release.published ? (
          <span className="docs-launch-command-label">After publication</span>
        ) : null}
        {installCode}
        <Link className="docs-button" href="/docs/installation/">
          Installation details
        </Link>
        <Link className="docs-button" href="/docs/migration/">
          Migrate from v4
        </Link>
      </div>
    </section>
  )
}
