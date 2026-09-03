import Link from 'next/link'

export function LaunchPath({ version }: { version: string }) {
  const prerelease = version.includes('-')

  return (
    <section className="docs-launch-path" aria-labelledby="launch-title">
      <p className="docs-home-kicker">Release confidence</p>
      <div>
        <h2 id="launch-title">A deliberate path to 5.0.</h2>
        <p>
          {prerelease
            ? `Version ${version} is the current prerelease build. Install it from the next channel to validate the redesigned API before stable promotion.`
            : `Version ${version} is available from the stable npm channel.`}
        </p>
      </div>
      <div className="docs-launch-actions">
        <code>
          npm install @nipe-solutions/react-spring-bottom-sheet
          {prerelease ? '@next' : ''}
        </code>
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
