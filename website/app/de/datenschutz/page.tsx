import type { Metadata } from 'next'
import { LegalPage } from '../../../components/LegalPage'
import { legalOperator } from '../../../content/legal'

export const metadata: Metadata = {
  title: 'Datenschutz',
  description:
    'Informationen zur Verarbeitung personenbezogener Daten auf dieser Dokumentationswebsite.',
  alternates: {
    canonical: '/de/datenschutz/',
    languages: { de: '/de/datenschutz/', en: '/privacy/' },
  },
}

export default function Datenschutz() {
  return (
    <LegalPage
      eyebrow="Rechtliches / Datenschutz"
      title="Datenschutz"
      language="de"
      contactLabel="Kontakt des Verantwortlichen"
      intro="Diese Erklärung beschreibt die begrenzte Verarbeitung, die für Bereitstellung und Schutz dieser statischen Dokumentationswebsite erforderlich ist."
      sections={[
        {
          title: 'Verantwortlicher',
          content: (
            <p>
              Verantwortlicher ist {legalOperator.company},{' '}
              {legalOperator.street}, {legalOperator.city}. Kontakt:{' '}
              <a href={`mailto:${legalOperator.email}`}>
                {legalOperator.email}
              </a>
              .
            </p>
          ),
        },
        {
          title: 'Bereitstellung und Sicherheit',
          content: (
            <p>
              Beim Abruf können technisch erforderliche Angaben wie URL,
              Zeitpunkt, IP-Adresse, Browserinformationen und Antwortstatus in
              Server- und Sicherheitsprotokollen verarbeitet werden. Zweck sind
              sichere Auslieferung, Fehleranalyse und Missbrauchsschutz.
              Rechtsgrundlage ist das berechtigte Interesse am sicheren und
              zuverlässigen Betrieb gemäß Art. 6 Abs. 1 lit. f DSGVO.
            </p>
          ),
        },
        {
          title: 'Hosting und Empfänger',
          content: (
            <p>
              Hosting-Anbieter ist Vercel Inc. Vercel und dessen
              Unterauftragsverarbeiter können Anfragedaten unter den jeweils
              anwendbaren Garantien außerhalb des EWR verarbeiten. Details
              stehen in der{' '}
              <a href="https://vercel.com/legal/privacy-policy">
                Datenschutzerklärung von Vercel
              </a>{' '}
              und im{' '}
              <a href="https://vercel.com/legal/dpa">
                Auftragsverarbeitungsnachtrag
              </a>
              .
            </p>
          ),
        },
        {
          title: 'Cookies und Analyse',
          content: (
            <p>
              Diese Projektwebsite setzt bewusst keine nicht erforderlichen
              Cookies ein und verwendet keinen Produktanalysedienst. Für externe
              Ziele wie GitHub und npm gelten nach dem Aufruf deren eigene
              Datenschutzbestimmungen.
            </p>
          ),
        },
        {
          title: 'Kontakt und Speicherdauer',
          content: (
            <p>
              Bei einer Kontaktaufnahme per E-Mail werden die übermittelten
              Daten zur Bearbeitung der Anfrage und nur so lange gespeichert,
              wie dies dafür oder aufgrund gesetzlicher Pflichten erforderlich
              ist. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, soweit die
              Anfrage einen Vertrag oder vorvertragliche Maßnahmen betrifft,
              andernfalls Art. 6 Abs. 1 lit. f DSGVO—das berechtigte Interesse
              an der Beantwortung von Projekt- und Geschäftskorrespondenz. Ein
              E-Mail-Dienstleister kann die Nachricht im Auftrag und, soweit
              erforderlich, unter geeigneten Garantien für internationale
              Übermittlungen verarbeiten. Betriebsprotokolle werden nach den
              konfigurierten Sicherheits- und Servicefristen des
              Hosting-Anbieters begrenzt.
            </p>
          ),
        },
        {
          title: 'Ihre Rechte',
          content: (
            <p>
              Unter den Voraussetzungen der DSGVO bestehen insbesondere Rechte
              auf Auskunft, Berichtigung, Löschung, Einschränkung,
              Datenübertragbarkeit und Widerspruch. Beschwerden können an die{' '}
              <a href="https://www.dsb.gv.at/">
                Österreichische Datenschutzbehörde
              </a>{' '}
              gerichtet werden. Zur Ausübung eines Rechts kontaktieren Sie den
              Verantwortlichen.
            </p>
          ),
        },
      ]}
    />
  )
}
