export function getReleasePresentation(version: string) {
  const prerelease = version.includes('-')
  const publishedVersions = new Set(['4.1.0', '5.0.0-alpha.0'])
  return {
    channel: prerelease ? ('next' as const) : ('latest' as const),
    installCommand: `npm install @nipe-solutions/react-spring-bottom-sheet${
      prerelease ? '@next' : ''
    }`,
    prerelease,
    published: publishedVersions.has(version),
  }
}
