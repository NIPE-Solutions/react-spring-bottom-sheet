import type { BuildEvidence } from '../content/evidence'

function formatKilobytes(bytes: number) {
  return `${(bytes / 1000).toFixed(1)} kB gzip`
}

export function Evidence({ evidence }: { evidence: BuildEvidence }) {
  return (
    <section className="docs-evidence" aria-labelledby="evidence-title">
      <header>
        <p>Published facts</p>
        <h2 id="evidence-title">What the current build proves.</h2>
      </header>
      <dl>
        <div>
          <dt>Current channel</dt>
          <dd>{evidence.version}</dd>
        </div>
        <div>
          <dt>JavaScript module</dt>
          <dd>{formatKilobytes(evidence.moduleGzipBytes)}</dd>
        </div>
        <div>
          <dt>CI browser engines</dt>
          <dd>{evidence.browserEngines.join(', ')}</dd>
        </div>
        <div>
          <dt>React peer range</dt>
          <dd>React {evidence.reactRange}</dd>
        </div>
      </dl>
      <p className="docs-evidence-note">
        Generated from package metadata and the production artifact during every
        website build.
      </p>
    </section>
  )
}
