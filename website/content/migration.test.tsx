import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MigrationPageContent } from './migration'

test('introduces the independently maintained React 19 migration path', () => {
  render(<MigrationPageContent />)

  expect(
    screen.getByRole('heading', {
      level: 1,
      name: /migrate from react-spring-bottom-sheet/i,
    }),
  ).toBeVisible()
  expect(
    screen.getByText(/independently maintained continuation/i),
  ).toBeVisible()
  expect(screen.getByText('react-spring-bottom-sheet')).toBeVisible()
  expect(
    screen.getByText('@nipe-solutions/react-spring-bottom-sheet'),
  ).toBeVisible()
  expect(
    screen.getByRole('link', { name: /complete migration guide/i }),
  ).toHaveAttribute('href', '/docs/migration/')
  expect(
    screen.getByRole('region', { name: 'Migration API mapping' }),
  ).toBeVisible()

  const mapping = screen.getByRole('region', { name: 'Migration API mapping' })
  expect(mapping).not.toHaveTextContent('`')
  expect(
    screen
      .getByRole('cell', { name: 'Replace with modal.' })
      .querySelector('code'),
  ).toHaveTextContent('modal')
})
