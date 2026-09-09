# Spring driver size audit

The local prototype replaces Motion's general `animate()` engine with its
existing `spring()` generator and duration calculation, bundled at build time.
Motion is a development dependency; React and React DOM remain peer dependencies.
No public API or CSS changes are required.

## Measurements

Compared with published version 5.0.1. The prototype is based on current `main`
and measured with its lockfile, `npm run build:dist`, and
`npm pack --dry-run --json --ignore-scripts`:

| Measurement                                 |                         Before |                       Prototype |
| ------------------------------------------- | -----------------------------: | ------------------------------: |
| Package unpacked, including source maps     |                      260,368 B |                       321,604 B |
| Compressed npm tarball                      |                       65,234 B |                        83,938 B |
| ESM JavaScript, gzip                        |      8,213 B, excluding Motion | 10,405 B, including spring code |
| Runtime dependencies, excluding React peers | Motion and its dependency tree |                            None |

The package itself grows because it now contains its spring implementation.
The consumer no longer installs approximately 9.2 MB of Motion packages.
Compared with the reported 9.8 MB installation, the resulting roughly 322 KB
package is about 97% smaller, excluding React peers in both cases. Browser
download size and installed size are separate measurements.

## Behavior and maintenance

The adapter preserves stiffness 380, damping 38, drag velocity conversion,
Motion's duration sampling, and millisecond rounding. Reduced motion completes
synchronously. Normal completion is deferred to a microtask and suppressed
after cancellation. Stops retain the last delivered position rather than taking
Motion's extra stop-time sample. Callback scheduling is owned by this project.

Tests compare positions and completion against Motion's `JSAnimation` at
30, 60, and 120 Hz, including opposing velocity, short distances, and equal
endpoints. They also cover interruption, queued completion, cancellation from
an update, background pauses, and timestamps preceding startup.

Keep the Motion version and lockfile deliberate when upgrading, and rerun the
comparison tests. The published notice preserves Motion's MIT license. Package
verification enforces a 450 KB unpacked budget and checks that clean consumers
can load ESM, CommonJS, and TypeScript without installing Motion.

## Validation and remaining limits

`npm run release:check` passes on the PR branch, including 214 unit tests,
type checking, lint, formatting, package/API/bundle checks, CSS and website
checks, the production website build, and the browser scenario inventory. All 45 Chromium,
Firefox, and Chromium touch interaction tests pass on an isolated server port.
Independent review found no actionable correctness or packaging issues.

WebKit cannot create a page on this machine: Playwright reports
`Unknown setting: PushAPIEnabled`. A fresh download of the macOS 14 WebKit
build reproduces the problem before application code runs. WebKit validation
is still required on a supported environment before release.

This prototype has not been published.
