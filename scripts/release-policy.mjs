export function validateReleasePolicy({ packageJson, workflow }) {
  const errors = []
  const requirePattern = (pattern, message) => {
    if (!pattern.test(workflow)) errors.push(message)
  }

  requirePattern(/workflow_dispatch:/, 'release workflow must be manual')
  requirePattern(
    /publish:\s*\n\s+name: Publish to npm\s*\n\s+needs: verify/,
    'verification must precede publication',
  )
  requirePattern(/environment: npm/, 'publish job must use the npm environment')
  requirePattern(/id-token: write/, 'publish job must request OIDC')
  if (/NODE_AUTH_TOKEN|NPM_TOKEN/.test(workflow)) {
    errors.push('release workflow must not use long-lived npm tokens')
  }
  requirePattern(
    /test "\$PACKAGE_VERSION" = "\$VERSION"/,
    'requested version must match package.json',
  )
  requirePattern(
    /if npm view "\$NAME@\$VERSION" version[^;]*; then\s*[\s\S]*?exit 1\s*[\s\S]*?fi/,
    'published versions must be immutable',
  )
  requirePattern(
    /if test "\$CHANNEL" = "latest"; then\s*[\s\S]*?case "\$VERSION" in\s+\*-\*\) exit 1 ;; esac/,
    'latest must reject prerelease versions',
  )
  requirePattern(
    /else\s+case "\$VERSION" in\s+\*-\*\) ;; \*\) exit 1 ;; esac/,
    'next must require prerelease versions',
  )
  requirePattern(
    /test "\$GITHUB_REF_NAME" = "main"/,
    'latest releases must come from main',
  )
  requirePattern(
    /npm publish --access public --tag "\$CHANNEL"/,
    'publish must use the requested protected channel',
  )

  const publishIndex = workflow.indexOf('npm publish --access public')
  const registryIndex = workflow.lastIndexOf(
    'npm view "$NAME@$CHANNEL" version',
  )
  const releaseIndex = workflow.indexOf('gh release create')
  if (publishIndex < 0 || registryIndex < publishIndex) {
    errors.push('registry verification must follow publication')
  }
  if (releaseIndex < registryIndex) {
    errors.push('registry verification must precede release creation')
  }
  if (packageJson.publishConfig?.access !== 'public') {
    errors.push('package must publish with public access')
  }
  if (packageJson.publishConfig?.provenance !== true) {
    errors.push('package must publish with provenance')
  }
  return errors
}
