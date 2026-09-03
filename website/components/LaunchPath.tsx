import Link from 'next/link'
import { getReleasePresentation } from '../content/release'

export function LaunchPath({ version }: { version: string }) {
  const release = getReleasePresentation(version)

  return (
    <section className="docs-launch-path" aria-labelledby="launch-title">
      <p className="docs-home-kicker">Release confidence</p>
      <div>
        <h2 id="launch-title">A deliberate path to 5.0.</h2>
        <p>
          {release.prerelease && !release.published
            ? `Version ${version} is the prepared prerelease build, but it is not published yet. After the protected release workflow publishes it, the next channel will support consumer validation before stable promotion.`
            : release.prerelease
              ? `Version ${version} is the current prerelease build. Install it from the next channel to validate the redesigned API before stable promotion.`
              : `Version ${version} is available from the stable npm channel.`}
        </p>
      </div>
      <div className="docs-launch-actions">
        {release.prerelease && !release.published ? (
          <span className="docs-launch-command-label">After publication</span>
        ) : null}
        <code>{release.installCommand}</code>
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
