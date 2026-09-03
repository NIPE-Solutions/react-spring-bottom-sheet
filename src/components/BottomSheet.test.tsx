import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BottomSheet } from './BottomSheet.js'

describe('BottomSheet', () => {
  it('composes the public primitives for a common modal sheet', async () => {
    render(
      <BottomSheet defaultOpen title="Filters" description="Refine the results">
        <button>Apply</button>
      </BottomSheet>,
    )

    const dialog = await screen.findByRole('dialog', {
      name: 'Filters',
      description: 'Refine the results',
    })
    expect(dialog).toHaveAttribute('data-rsbs-content', '')
    expect(
      document.body.querySelector('[data-rsbs-backdrop]'),
    ).toBeInTheDocument()
    expect(dialog.querySelector('[data-rsbs-handle]')).toBeInTheDocument()
  })
})
