const entryPoints = [
  ['styles.css', 'Mechanics, default tokens, and default theme'],
  ['core.css', 'Positioning, gestures, portals, and safe-area handling only'],
  ['theme.css', 'Default visual rules; imports tokens.css'],
  ['tokens.css', 'Default values for the public custom properties'],
] as const

const hooks = [
  ['.rsbs-trigger / .rsbs-close', 'Opening and closing controls'],
  ['.rsbs-backdrop', 'Modal backdrop'],
  ['.rsbs-viewport', 'Fixed clipping and stacking layer'],
  ['.rsbs-content', 'Animated sheet surface'],
  ['.rsbs-handle', 'Drag handle and its hit area'],
  ['.rsbs-title / .rsbs-description', 'Accessible label and description'],
] as const

const tokens = [
  ['--rsbs-z-index', 'Base stacking level'],
  ['--rsbs-backdrop-color / --rsbs-backdrop-opacity', 'Backdrop appearance'],
  ['--rsbs-content-background / --rsbs-content-color', 'Surface palette'],
  ['--rsbs-content-border / --rsbs-content-radius', 'Surface edge'],
  ['--rsbs-content-shadow', 'Surface elevation'],
  [
    '--rsbs-handle-color / --rsbs-handle-width / --rsbs-handle-height',
    'Handle mark',
  ],
  ['--rsbs-handle-hit-area', 'Minimum draggable handle area'],
  [
    '--rsbs-focus-color / --rsbs-focus-width / --rsbs-focus-offset',
    'Keyboard focus indicator',
  ],
] as const

function ReferenceTable({
  rows,
}: {
  rows: readonly (readonly [string, string])[]
}) {
  return (
    <div className="docs-reference-table-wrap">
      <table className="docs-reference-table">
        <thead>
          <tr>
            <th>Hook</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([hook, purpose]) => (
            <tr key={hook}>
              <td>
                <code>{hook}</code>
              </td>
              <td>{purpose}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StylesReference() {
  return (
    <div className="docs-styles-reference">
      <h3>Published stylesheets</h3>
      <ReferenceTable rows={entryPoints} />
      <h3>Stable class hooks</h3>
      <ReferenceTable rows={hooks} />
      <h3>Theme tokens</h3>
      <ReferenceTable rows={tokens} />
      <p>
        State is exposed through <code>data-rsbs-state</code> and{' '}
        <code>data-rsbs-dragging</code>. Treat <code>--rsbs-position</code> and
        safe-area variables as mechanical internals rather than theme inputs.
      </p>
    </div>
  )
}
