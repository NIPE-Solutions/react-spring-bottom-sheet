import Link from 'next/link'
import { ApiTable } from '../../components/ApiTable'
import generatedPublicApi from '../../generated/public-api.json'
import { publicApiContent, type PublicApiEntry } from './public-api'

const entries = generatedPublicApi as readonly PublicApiEntry[]
const entriesById = new Map(entries.map((entry) => [entry.id, entry]))

function getEntry(id: string): PublicApiEntry {
  const entry = entriesById.get(id)
  if (!entry) throw new Error(`Missing generated public API entry: ${id}`)
  return entry
}

interface ReferenceEntryProps {
  id: keyof typeof publicApiContent
  title: string
  caption?: string
  sourceLabel?: string
}

function ReferenceEntry({
  id,
  title,
  caption,
  sourceLabel,
}: ReferenceEntryProps) {
  const entry = getEntry(id)
  const content = publicApiContent[id]

  if (!content) throw new Error(`Missing maintained public API content: ${id}`)

  return (
    <div className="docs-api-entry">
      <h3>
        <code>{title}</code>
      </h3>
      <ApiTable
        caption={caption}
        content={content}
        entry={entry}
        sourceLabel={sourceLabel}
      />
    </div>
  )
}

const primitiveEntries = [
  ['sheet-trigger-props', 'Sheet.Trigger'],
  ['sheet-portal-props', 'Sheet.Portal'],
  ['sheet-backdrop-props', 'Sheet.Backdrop'],
  ['sheet-viewport-props', 'Sheet.Viewport'],
  ['sheet-content-props', 'Sheet.Content'],
  ['sheet-handle-props', 'Sheet.Handle'],
  ['sheet-title-props', 'Sheet.Title'],
  ['sheet-description-props', 'Sheet.Description'],
  ['sheet-close-props', 'Sheet.Close'],
] as const

const publicTypeEntries = [
  ['open-change-details', 'OpenChangeDetails'],
  ['open-change-reason', 'OpenChangeReason'],
  ['snap-point', 'SnapPoint'],
  ['snap-point-value', 'SnapPointValue'],
] as const

export function ApiReference() {
  return (
    <div className="docs-api-reference">
      <section id="composition">
        <h2>Composition</h2>
        <p>
          <code>Sheet.Root</code> coordinates state and behavior while the
          remaining primitives describe the DOM. Use controlled values when
          another part of the application owns open or snap-point state.
        </p>
        <ReferenceEntry
          caption="Sheet.Root props"
          id="sheet-root-props"
          sourceLabel="Sheet.Root"
          title="Sheet.Root"
        />
        <p>
          <Link href="/examples/controlled/">
            Run the controlled-state recipe
          </Link>
          .
        </p>
      </section>

      <section id="primitives">
        <h2>Primitives</h2>
        <p>
          Each DOM primitive forwards its ref and native element props. Set{' '}
          <code>asChild</code> when an application-owned element should receive
          those props instead.
        </p>
        <ReferenceEntry
          caption="Sheet namespace members"
          id="sheet"
          title="Sheet"
        />
        {primitiveEntries.map(([id, title]) => (
          <ReferenceEntry
            caption={`${title} props`}
            id={id}
            key={id}
            sourceLabel={title}
            title={title}
          />
        ))}
        <p>
          <Link href="/examples/custom-portal/">
            See the custom portal boundary
          </Link>
          .
        </p>
      </section>

      <section id="convenience-api">
        <h2>Convenience API</h2>
        <p>
          <code>BottomSheet</code> assembles the standard portal, backdrop,
          viewport, content, handle, title, and optional description around the
          same root behavior.
        </p>
        <ReferenceEntry id="bottom-sheet" title="BottomSheet" />
        <ReferenceEntry
          caption="BottomSheet props"
          id="bottom-sheet-props"
          title="BottomSheetProps"
        />
      </section>

      <section id="public-types">
        <h2>Public types</h2>
        <p>
          State callbacks report stable reasons, and snap points pair a stable
          identifier with a validated height value.
        </p>
        {publicTypeEntries.map(([id, title]) => (
          <ReferenceEntry id={id} key={id} title={title} />
        ))}
        <p>
          <Link href="/examples/snap-points/">
            Control named snap points in the runnable recipe
          </Link>
          .
        </p>
      </section>

      <section id="behavioral-guarantees">
        <h2>Behavioral guarantees</h2>
        <ul className="docs-api-guarantees">
          <li>
            Controlled <code>open</code> and <code>activeSnapPoint</code> values
            remain authoritative until their owners update them.
          </li>
          <li>
            Modal content receives and contains focus, isolates the background,
            and restores the previously focused element after closing.
          </li>
          <li>
            Portalled content remains mounted until its closing transition has
            finished.
          </li>
          <li>
            Escape, backdrop, and drag dismissal respect{' '}
            <code>dismissible</code>; explicit close controls remain available.
          </li>
          <li>
            Transitions settle immediately when the operating system requests
            reduced motion.
          </li>
        </ul>
        <p>
          Verify the motion contract with the{' '}
          <Link href="/examples/reduced-motion/">reduced-motion recipe</Link>,
          or compare dismissal boundaries in the{' '}
          <Link href="/examples/confirmation/">
            explicit-confirmation recipe
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
