import { expect, test } from 'vitest'
import { getReleasePresentation } from './release'

test('prereleases install from the next channel', () => {
  expect(getReleasePresentation('5.0.0-alpha.0')).toEqual({
    channel: 'next',
    installCommand:
      'npm install @nipe-solutions/react-spring-bottom-sheet@next',
    prerelease: true,
    published: true,
  })
})

test('stable releases install from the default channel', () => {
  expect(getReleasePresentation('5.0.0')).toEqual({
    channel: 'latest',
    installCommand: 'npm install @nipe-solutions/react-spring-bottom-sheet',
    prerelease: false,
    published: true,
  })
})
