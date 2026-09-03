import type { Metadata } from 'next'
import { LegalPage } from '../../components/LegalPage'
import { legalOperator } from '../../content/legal'

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'How this documentation website handles personal data.',
  alternates: {
    canonical: '/privacy/',
    languages: { de: '/de/datenschutz/', en: '/privacy/' },
  },
}

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Legal / Data protection"
      title="Privacy"
      intro="This notice describes the limited processing required to deliver and protect this static documentation website."
      sections={[
        {
          title: 'Controller',
          content: (
            <p>
              The controller is {legalOperator.company}, {legalOperator.street},{' '}
              {legalOperator.city}. Contact:{' '}
              <a href={`mailto:${legalOperator.email}`}>
                {legalOperator.email}
              </a>
              .
            </p>
          ),
        },
        {
          title: 'Website delivery and security',
          content: (
            <p>
              When you request a page, technically necessary information such as
              the requested URL, timestamp, IP address, browser information, and
              response status may be processed in server and security logs. This
              supports reliable delivery, fault diagnosis, and protection
              against abuse. The legal basis is the controller’s legitimate
              interest in secure and reliable operation under Article 6(1)(f)
              GDPR.
            </p>
          ),
        },
        {
          title: 'Hosting and recipients',
          content: (
            <p>
              The website is hosted by Vercel Inc. Vercel and its subprocessors
              may process request data outside the European Economic Area under
              applicable transfer safeguards. Current provider details are
              available in the{' '}
              <a href="https://vercel.com/legal/privacy-policy">
                Vercel privacy policy
              </a>{' '}
              and{' '}
              <a href="https://vercel.com/legal/dpa">
                data processing addendum
              </a>
              .
            </p>
          ),
        },
        {
          title: 'Cookies and analytics',
          content: (
            <p>
              This project website does not intentionally set non-essential
              cookies and does not run a product analytics service. External
              destinations such as GitHub and npm apply their own privacy terms
              after you follow a link to them.
            </p>
          ),
        },
        {
          title: 'Contact and retention',
          content: (
            <p>
              If you contact the operator by email, the supplied contact and
              message data is processed to answer your request and retained only
              as long as needed for that purpose or applicable legal
              obligations. Operational log retention is limited by the hosting
              provider’s configured service and security requirements.
            </p>
          ),
        },
        {
          title: 'Your rights',
          content: (
            <p>
              Subject to the GDPR’s conditions, you may request access,
              rectification, erasure, restriction, portability, or object to
              processing. You may complain to the{' '}
              <a href="https://www.dsb.gv.at/">
                Austrian Data Protection Authority
              </a>
              . Contact the controller to exercise a right.
            </p>
          ),
        },
      ]}
    />
  )
}
