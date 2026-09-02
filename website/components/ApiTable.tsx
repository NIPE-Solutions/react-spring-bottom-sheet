import type {
  PublicApiContent,
  PublicApiEntry,
} from '../content/reference/public-api'

const sourceBase =
  'https://github.com/NIPE-Solutions/react-spring-bottom-sheet/blob/v5/'

interface ApiTableProps {
  entry: PublicApiEntry
  content: PublicApiContent
  caption?: string
  sourceLabel?: string
}

export function ApiTable({
  entry,
  content,
  caption = `${entry.name} API`,
  sourceLabel = entry.name,
}: ApiTableProps) {
  const rows = entry.members?.map((member) => ({
    ...member,
    description: content.members?.[member.name]?.description ?? '',
    defaultValue: content.members?.[member.name]?.defaultValue,
    state: member.required ? 'Required' : 'Optional',
  })) ?? [
    {
      name: entry.name,
      signature: entry.signature,
      description: content.summary,
      defaultValue: undefined,
      state: 'Exported',
    },
  ]

  const nameHeading = entry.id.endsWith('-props') ? 'Prop' : 'Name'

  return (
    <div className="docs-api-table-wrap">
      {entry.members ? (
        <>
          <p className="docs-api-summary">{content.summary}</p>
          <div className="docs-api-declaration" tabIndex={0}>
            <code>{entry.signature}</code>
          </div>
        </>
      ) : null}
      <table className="docs-api-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{nameHeading}</th>
            <th scope="col">Signature</th>
            <th scope="col">State</th>
            <th scope="col">Default</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <th data-label={nameHeading} scope="row">
                <code>{row.name}</code>
              </th>
              <td data-label="Signature">
                <code className="docs-api-signature" tabIndex={0}>
                  {row.signature}
                </code>
              </td>
              <td data-label="State">{row.state}</td>
              <td data-label="Default">
                {row.defaultValue ? (
                  <code>{row.defaultValue}</code>
                ) : (
                  <span aria-label="No default">—</span>
                )}
              </td>
              <td data-label="Description">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {content.notes?.length ? (
        <ul className="docs-api-notes">
          {content.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <p className="docs-api-source">
        <a href={`${sourceBase}${entry.source}`}>View {sourceLabel} source</a>
      </p>
    </div>
  )
}
