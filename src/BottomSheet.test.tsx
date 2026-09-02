import { describe, expect, it } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import {
  createSpringConfig,
  getPublicState,
  runSpringCallback,
} from './BottomSheet'
import { BottomSheet } from './index'

describe('getPublicState', () => {
  it('reports a parent state while the machine is in a nested child state', () => {
    const snapshot = {
      matches: (state: string) => state === 'opening',
    }

    expect(getPublicState(snapshot)).toBe('opening')
  })
})

describe('runSpringCallback', () => {
  it('waits for an asynchronous lifecycle callback', async () => {
    let release: () => void = () => undefined
    let completed = false
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    const callback = runSpringCallback(() => gate, { type: 'OPEN' }).then(
      () => {
        completed = true
      }
    )

    await Promise.resolve()
    expect(completed).toBe(false)

    release()
    await callback
    expect(completed).toBe(true)
  })
})

describe('createSpringConfig', () => {
  it('uses the latest consumer spring configuration', () => {
    expect(
      createSpringConfig(
        { tension: 170, friction: 26 },
        1,
        { mass: 2, tension: 210, friction: 30 }
      )
    ).toEqual({
      velocity: 1,
      mass: 2,
      tension: 210,
      friction: 30,
    })
  })
})

describe('dialog accessibility', () => {
  it('applies an accessible name to the dialog', async () => {
    render(
      <BottomSheet open aria-label="Filters">
        content
      </BottomSheet>
    )

    expect(
      await screen.findByRole('dialog', { name: 'Filters' })
    ).toHaveAttribute('aria-modal', 'true')
  })

  it('does not mark a non-blocking sheet as modal', async () => {
    render(
      <BottomSheet open blocking={false} aria-label="Filters">
        content
      </BottomSheet>
    )

    expect(await screen.findByRole('dialog')).not.toHaveAttribute('aria-modal')
  })

  it.each([true, false])(
    'has no automated accessibility violations when blocking is %s',
    async (blocking) => {
      render(
        <BottomSheet open blocking={blocking} aria-label="Filters">
          content
        </BottomSheet>
      )

      await screen.findByRole('dialog', { name: 'Filters' })
      expect((await axe(document.body)).violations).toEqual([])
    }
  )
})
