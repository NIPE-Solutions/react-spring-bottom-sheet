import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RecipeSource } from './RecipeSource'

describe('RecipeSource', () => {
  it('delivers one server-highlighted source block through the inspector', async () => {
    const source = 'const first = true\r\nconst second = false\r\n'
    const inspector = await RecipeSource({
      filename: 'BasicSheet.tsx',
      source,
    })
    render(inspector)

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'View source' }))

    const region = await screen.findByRole('region', {
      name: 'BasicSheet.tsx source code',
    })
    expect(screen.getByRole('button', { name: 'Copy source' })).toBeVisible()
    expect(screen.getAllByRole('region')).toHaveLength(1)
    expect(region.querySelector('[data-code-line-numbers]')?.textContent).toBe(
      '1\n2\n3',
    )
    expect(region.querySelector('code')?.textContent).toBe(source)
  })
})
