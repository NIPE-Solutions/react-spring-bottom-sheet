import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { InstallationGuide } from './installation'

test('renders the prepared stable release state before publication', () => {
  render(<InstallationGuide version="5.0.0" />)

  expect(screen.getByText('Prepared release', { exact: true })).toBeVisible()
  expect(
    screen.getByText('is not published yet', { exact: false }),
  ).toBeVisible()
  expect(screen.getByText('After publication', { exact: true })).toBeVisible()
  expect(
    screen.getByText('npm install @nipe-solutions/react-spring-bottom-sheet', {
      exact: true,
    }),
  ).toBeVisible()
  expect(screen.getByText('latest', { exact: true })).toBeVisible()
  expect(
    screen.queryByText('Prerelease channel', { exact: true }),
  ).not.toBeInTheDocument()
})
