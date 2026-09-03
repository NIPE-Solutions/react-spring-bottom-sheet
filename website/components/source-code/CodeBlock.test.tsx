import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeBlock } from './CodeBlock'

function sourceCodeValue(region: HTMLElement) {
  return region.querySelector('code')?.textContent
}

describe('CodeBlock', () => {
  it('renders shell source with only the required chrome', async () => {
    const source = 'npm install @nipe-solutions/react-spring-bottom-sheet\n'
    const block = await CodeBlock({ source, language: 'shell' })

    render(block)

    const region = screen.getByRole('region', { name: 'shell code' })
    expect(sourceCodeValue(region)).toBe(source)
    expect(screen.queryByRole('button', { name: 'Copy source' })).toBeNull()
    expect(region.querySelector('[data-code-block-header]')).toBeNull()
    expect(region.querySelector('[data-code-line-numbers]')).toBeNull()
  })

  it('keeps line numbers outside the selectable TSX source value', async () => {
    const source = 'const open = true\n'
    const block = await CodeBlock({
      source,
      language: 'tsx',
      filename: 'Example.tsx',
      lineNumbers: true,
      copy: true,
    })

    render(block)

    const region = screen.getByRole('region', {
      name: 'Example.tsx source code',
    })
    expect(screen.getByRole('button', { name: 'Copy source' })).toBeVisible()
    expect(screen.getByText('Example.tsx')).toBeVisible()
    expect(region.querySelector('[data-code-line-numbers]')).toHaveTextContent(
      '1',
    )
    expect(sourceCodeValue(region)).toBe(source)
    expect(sourceCodeValue(region)).not.toContain('1')
    expect(
      region.querySelector('[data-source-trailing-newline]'),
    ).toBeInTheDocument()
  })
})
