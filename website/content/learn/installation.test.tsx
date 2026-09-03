import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { InstallationGuide } from './installation'

test('renders the published stable release state', () => {
  render(<InstallationGuide version="5.0.0" />)

  expect(
    screen.queryByText('Prepared release', { exact: true }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText('is not published yet', { exact: false }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByText('After publication', { exact: true }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByText('npm install @nipe-solutions/react-spring-bottom-sheet', {
      exact: true,
    }),
  ).toBeVisible()
  expect(screen.queryByText('latest', { exact: true })).not.toBeInTheDocument()
  expect(
    screen.queryByText('Prerelease channel', { exact: true }),
  ).not.toBeInTheDocument()
})
