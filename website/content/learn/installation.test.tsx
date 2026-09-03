import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { InstallationGuide } from './installation'

test('renders the published stable release state', async () => {
  render(await InstallationGuide({ version: '5.0.0' }))

  expect(
    screen.queryByText('Prepared release', { exact: true }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText('is not published yet', { exact: false }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText('After publication', { exact: true }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'shell code' })).toBeVisible()
  expect(screen.getByRole('region', { name: 'shell code' })).toHaveTextContent(
    'npm install @nipe-solutions/react-spring-bottom-sheet',
  )
  expect(screen.queryByText('latest', { exact: true })).not.toBeInTheDocument()
  expect(
    screen.queryByText('Prerelease channel', { exact: true }),
  ).not.toBeInTheDocument()
})
