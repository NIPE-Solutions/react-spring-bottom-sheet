export function getReleasePresentation(version: string) {
  const prerelease = version.includes('-')
  return {
    channel: prerelease ? ('next' as const) : ('latest' as const),
    installCommand: `npm install @nipe-solutions/react-spring-bottom-sheet${
      prerelease ? '@next' : ''
    }`,
    prerelease,
  }
}
