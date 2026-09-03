export function getReleasePresentation(version: string) {
  const prerelease = version.includes('-')
  const publishedPrereleaseVersions = new Set<string>()
  return {
    channel: prerelease ? ('next' as const) : ('latest' as const),
    installCommand: `npm install @nipe-solutions/react-spring-bottom-sheet${
      prerelease ? '@next' : ''
    }`,
    prerelease,
    published: !prerelease || publishedPrereleaseVersions.has(version),
  }
}
