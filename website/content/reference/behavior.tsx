import Link from 'next/link'
import { ApiTable } from '../../components/ApiTable'
import generatedPublicApi from '../../generated/public-api.json'
import {
  createPublicApiReference,
  publicApiBehavior,
  publicApiBehaviorKeys,
  publicApiContent,
  publicApiPresentation,
  type PublicApiEntry,
  type PublicApiReferenceItem,
} from './public-api'

const entries = generatedPublicApi as readonly PublicApiEntry[]
const reference = createPublicApiReference(
  entries,
  publicApiContent,
  publicApiBehavior,
  publicApiPresentation,
)

function ReferenceEntry({
  entry,
  content,
  presentation,
}: PublicApiReferenceItem) {
  return (
    <div className="docs-api-entry" data-api-id={entry.id}>
      <h3>
        <code>{presentation.title}</code>
      </h3>
      <ApiTable
        caption={presentation.caption}
        content={content}
        entry={entry}
        sourceLabel={presentation.sourceLabel}
      />
    </div>
  )
}

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
        {reference.composition.map((item) => (
          <ReferenceEntry {...item} key={item.entry.id} />
        ))}
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
        {reference.primitives.map((item) => (
          <ReferenceEntry {...item} key={item.entry.id} />
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
        {reference['convenience-api'].map((item) => (
          <ReferenceEntry {...item} key={item.entry.id} />
        ))}
      </section>

      <section id="public-types">
        <h2>Public types</h2>
        <p>
          State callbacks report stable reasons, and snap points pair a stable
          identifier with a validated height value.
        </p>
        {reference['public-types'].map((item) => (
          <ReferenceEntry {...item} key={item.entry.id} />
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
          {publicApiBehaviorKeys.map((key) => (
            <li key={key}>{publicApiBehavior[key]}</li>
          ))}
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
