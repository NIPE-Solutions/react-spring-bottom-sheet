import type { Metadata } from 'next'
import { LegalPage } from '../../components/LegalPage'
import { legalOperator } from '../../content/legal'

export const metadata: Metadata = {
  title: 'Accessibility statement',
  description:
    'Accessibility approach, tested boundaries, limitations, and feedback contact.',
  alternates: { canonical: '/accessibility/' },
}

export default function Accessibility() {
  return (
    <LegalPage
      eyebrow="Project / Accessibility"
      title="Accessibility"
      intro="The project aims to make its documentation and examples usable with a keyboard, screen reader, zoom, and reduced-motion preferences."
      sections={[
        {
          title: 'What we design for',
          content: (
            <p>
              Pages use semantic headings and landmarks, visible keyboard focus,
              descriptive links, responsive layouts, sufficient contrast, and
              motion that respects the reduced-motion preference. Interactive
              examples use the library’s real focus and dialog behavior.
            </p>
          ),
        },
        {
          title: 'How we test',
          content: (
            <p>
              Automated accessibility scans, keyboard interaction tests, narrow
              viewport checks, and browser tests run in the project suite.
              Manual assistive-technology and physical-device checks complement
              automation because automated scans cannot verify the complete
              screen-reader experience.
            </p>
          ),
        },
        {
          title: 'Known limitations',
          content: (
            <p>
              This statement does not claim formal WCAG conformance. Browser and
              assistive-technology combinations can announce dynamic dialogs
              differently, and code samples may require horizontal scrolling at
              high zoom. Findings are tracked and fixed through the public issue
              workflow.
            </p>
          ),
        },
        {
          title: 'Report a barrier',
          content: (
            <p>
              Open an accessibility issue on{' '}
              <a href="https://github.com/NIPE-Solutions/react-spring-bottom-sheet/issues">
                GitHub
              </a>{' '}
              or email{' '}
              <a href={`mailto:${legalOperator.email}`}>
                {legalOperator.email}
              </a>
              . Include the page, task, browser, device, and assistive
              technology when possible.
            </p>
          ),
        },
      ]}
    />
  )
}
