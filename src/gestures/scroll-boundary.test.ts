import { describe, expect, it } from 'vitest'
import {
  decideGestureOwner,
  findScrollableAncestor,
} from './scroll-boundary.js'

describe('decideGestureOwner', () => {
  it('always assigns handle gestures to the sheet', () => {
    expect(
      decideGestureOwner({
        deltaY: -20,
        scrollTop: 100,
        scrollHeight: 1000,
        clientHeight: 300,
        startedOnHandle: true,
      }),
    ).toBe('sheet')
  })

  it('lets content consume upward movement while it can scroll down', () => {
    expect(
      decideGestureOwner({
        deltaY: -20,
        scrollTop: 100,
        scrollHeight: 1000,
        clientHeight: 300,
        startedOnHandle: false,
      }),
    ).toBe('content')
  })

  it('lets content consume downward movement above its top boundary', () => {
    expect(
      decideGestureOwner({
        deltaY: 20,
        scrollTop: 1,
        scrollHeight: 1000,
        clientHeight: 300,
        startedOnHandle: false,
      }),
    ).toBe('content')
  })

  it('hands movement to the sheet at the relevant boundary', () => {
    expect(
      decideGestureOwner({
        deltaY: 20,
        scrollTop: 0,
        scrollHeight: 1000,
        clientHeight: 300,
        startedOnHandle: false,
      }),
    ).toBe('sheet')
    expect(
      decideGestureOwner({
        deltaY: -20,
        scrollTop: 700,
        scrollHeight: 1000,
        clientHeight: 300,
        startedOnHandle: false,
      }),
    ).toBe('sheet')
  })

  it('assigns non-scrollable content to the sheet', () => {
    expect(
      decideGestureOwner({
        deltaY: -20,
        scrollTop: 0,
        scrollHeight: 300,
        clientHeight: 300,
        startedOnHandle: false,
      }),
    ).toBe('sheet')
  })
})

describe('findScrollableAncestor', () => {
  it('returns the nearest scrollable ancestor within the sheet', () => {
    const sheet = document.createElement('div')
    const outer = document.createElement('div')
    const inner = document.createElement('div')
    const target = document.createElement('button')
    sheet.append(outer)
    outer.append(inner)
    inner.append(target)
    Object.defineProperties(inner, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 500 },
    })
    inner.style.overflowY = 'auto'

    expect(findScrollableAncestor(target, sheet)).toBe(inner)
  })

  it('does not search outside the sheet boundary', () => {
    const outside = document.createElement('div')
    const sheet = document.createElement('div')
    const target = document.createElement('button')
    outside.append(sheet)
    sheet.append(target)
    Object.defineProperties(outside, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 500 },
    })

    expect(findScrollableAncestor(target, sheet)).toBeNull()
  })

  it('ignores clipped descendants with scroll geometry', () => {
    const sheet = document.createElement('div')
    const clipped = document.createElement('div')
    const target = document.createElement('button')
    sheet.append(clipped)
    clipped.append(target)
    clipped.style.overflowY = 'hidden'
    Object.defineProperties(clipped, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 500 },
    })

    expect(findScrollableAncestor(target, sheet)).toBeNull()
  })
})
