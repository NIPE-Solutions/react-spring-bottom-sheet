import type { Metadata } from 'next'
import { LegalPage } from '../../../components/LegalPage'
import { legalOperator } from '../../../content/legal'

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung und Offenlegung für dieses Projekt.',
  alternates: {
    canonical: '/de/impressum/',
    languages: { de: '/de/impressum/', en: '/impressum/' },
  },
}

export default function Impressum() {
  return (
    <LegalPage
      eyebrow="Rechtliches / Anbieterinformation"
      title="Impressum"
      intro="Anbieterkennzeichnung, Offenlegung und Medieninhaber der Website und des Open-Source-Projekts React Spring Bottom Sheet."
      sections={[
        {
          title: 'Diensteanbieter, Medieninhaber und Herausgeber',
          content: (
            <>
              <p>
                <strong>{legalOperator.company}</strong>
                <br />
                Inhaber: {legalOperator.proprietor}
                <br />
                {legalOperator.street}
                <br />
                {legalOperator.city}, {legalOperator.country}
              </p>
              <p>
                E-Mail:{' '}
                <a href={`mailto:${legalOperator.email}`}>
                  {legalOperator.email}
                </a>
                <br />
                Telefon:{' '}
                <a href={`tel:${legalOperator.phoneHref}`}>
                  {legalOperator.phone}
                </a>
              </p>
            </>
          ),
        },
        {
          title: 'Unternehmensdaten',
          content: (
            <p>
              UID-Nummer: {legalOperator.vatId}
              <br />
              Firmenbuchnummer: {legalOperator.registerNumber}
              <br />
              Firmenbuchgericht: {legalOperator.registerCourt}
              <br />
              Firmensitz: Wien
            </p>
          ),
        },
        {
          title: 'Gewerbe und Aufsicht',
          content: (
            <p>
              Gewerbe: {legalOperator.trade}. Aufsichts- und Gewerbebehörde:{' '}
              {legalOperator.authority}. Mitglied der {legalOperator.chamber}.
              Anwendbare Rechtsvorschrift ist die Gewerbeordnung, abrufbar im{' '}
              <a href="https://www.ris.bka.gv.at/">
                Rechtsinformationssystem des Bundes
              </a>
              .
            </p>
          ),
        },
        {
          title: 'Blattlinie',
          content: (
            <p>
              Technische Dokumentation, Beispiele und Projektinformationen zur
              Open-Source-Bibliothek React Spring Bottom Sheet. Medieninhaber
              und verantwortlich für den Inhalt: {legalOperator.company},{' '}
              {legalOperator.street}, {legalOperator.city}.
            </p>
          ),
        },
      ]}
    />
  )
}
