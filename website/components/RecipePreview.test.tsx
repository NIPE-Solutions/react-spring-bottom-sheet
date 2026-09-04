import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecipePreview } from './RecipePreview'
import { SourceInspector } from './source-code/SourceInspector'

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams('device=phone&orientation=portrait'),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/examples/basic/',
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
  }),
  useSearchParams: () => navigation.searchParams,
}))

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('RecipePreview source action', () => {
  it('opens source from the heading without replacing the preview iframe', async () => {
    render(
      <RecipePreview
        slug="basic"
        title="Basic"
        sourceAction={
          <SourceInspector filename="BasicSheet.tsx">
            <pre>const open = true</pre>
          </SourceInspector>
        }
      />,
    )
    const iframe = screen.getByTitle('Basic interactive preview')
    const trigger = screen.getByRole('button', { name: 'View source' })

    expect(trigger.closest('.docs-recipe-section-heading')).not.toBeNull()
    fireEvent.click(trigger)
    await screen.findByRole('dialog', { name: 'BasicSheet.tsx source' })

    expect(screen.getByTitle('Basic interactive preview')).toBe(iframe)
  })
})
