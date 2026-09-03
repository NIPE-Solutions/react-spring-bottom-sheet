import type { Metadata } from 'next'
import { LegalPage } from '../../../components/LegalPage'
import { legalOperator } from '../../../content/legal'

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Legal provider and publisher information for this project.',
  alternates: {
    canonical: '/impressum/',
    languages: { de: '/de/impressum/', en: '/impressum/' },
  },
}

export default function Imprint() {
  return (
    <LegalPage
      eyebrow="Legal / Provider information"
      title="Impressum"
      intro="Provider, media-owner, and publisher information for the React Spring Bottom Sheet project and documentation website."
      sections={[
        {
          title: 'Service provider, media owner, and publisher',
          content: (
            <>
              <p>
                <strong>{legalOperator.company}</strong>
                <br />
                Proprietor: {legalOperator.proprietor}
                <br />
                {legalOperator.street}
                <br />
                {legalOperator.city}, {legalOperator.country}
              </p>
              <p>
                Email:{' '}
                <a href={`mailto:${legalOperator.email}`}>
                  {legalOperator.email}
                </a>
                <br />
                Phone:{' '}
                <a href={`tel:${legalOperator.phoneHref}`}>
                  {legalOperator.phone}
                </a>
              </p>
            </>
          ),
        },
        {
          title: 'Company information',
          content: (
            <p>
              VAT ID: {legalOperator.vatId}
              <br />
              Company register number: {legalOperator.registerNumber}
              <br />
              Company register court: {legalOperator.registerCourt}
              <br />
              Registered office: Wien
            </p>
          ),
        },
        {
          title: 'Trade and supervision',
          content: (
            <>
              <p>Trade: {legalOperator.trade}.</p>
              <p>
                Supervisory and trade authority: {legalOperator.authority}.
                Chamber membership: {legalOperator.chamber}. Applicable trade
                law is the Austrian Trade Regulation Act (GewO), available
                through the{' '}
                <a href="https://www.ris.bka.gv.at/">
                  Austrian Legal Information System
                </a>
                .
              </p>
            </>
          ),
        },
        {
          title: 'Editorial direction',
          content: (
            <p>
              Technical documentation, examples, and project information for the
              open-source React Spring Bottom Sheet library. Media owner and
              editorial responsibility: {legalOperator.company},{' '}
              {legalOperator.street}, {legalOperator.city}.
            </p>
          ),
        },
        {
          title: 'Project and external links',
          content: (
            <p>
              The software is provided under the MIT License. Links to external
              websites, including GitHub, lead to services operated under their
              respective providers’ terms and privacy information.
            </p>
          ),
        },
      ]}
    />
  )
}
