# Maintainer-led adoption campaign

## Purpose

Grow adoption of `@nipe-solutions/react-spring-bottom-sheet` by helping users of
the original package discover a credible, actively maintained React 19 path.
The campaign is led personally by Nicholas, preserves the project's lineage,
and prioritizes useful migration work over bulk promotion.

## Positioning

The primary message is:

> An independently maintained React 19 continuation of
> `react-spring-bottom-sheet`, rebuilt around accessible compound components,
> explicit styling contracts, and current-browser verification.

The project must not describe itself as the official successor unless the
original maintainer explicitly grants that status. “Maintained continuation”
must always appear with the independent-maintenance and lineage context.

Maintenance is evidence, not the whole value proposition. Public copy should
lead with React 19 compatibility, accessibility, composability, and verified
browser behavior. Claims must be backed by repository tests, release metadata,
or published documentation.

## Audiences

1. Existing direct users of `react-spring-bottom-sheet` who need React 19.
2. Maintainers whose dependency trees still contain the original package.
3. Component-library and application maintainers evaluating sheet primitives.
4. React and accessibility practitioners interested in the rebuild.

## Repository conversion surface

### README

The README opening should answer, without scrolling:

- what the package is;
- how it relates to the original project;
- why a team would choose it now;
- the supported React version;
- where to see a live example and migration guide;
- how to install it.

Add a restrained proof row for the npm version, CI status, license, React 19,
and package size only where those badges resolve to maintained sources. Include
a compact feature list, a live-demo call to action, and a dedicated migration
section that links to the full guide. Preserve prominent attribution to Cody
Olsen and Jasmine GH.

### GitHub metadata

Set the repository description to a factual, search-friendly summary:

> Accessible, composable React 19 bottom sheets — an independently maintained
> continuation of react-spring-bottom-sheet.

Set the website field to the production documentation URL. Use focused topics:

- `react`
- `react-19`
- `bottom-sheet`
- `drawer`
- `dialog`
- `accessibility`
- `typescript`
- `gesture`
- `headless-ui`
- `react-spring-bottom-sheet`

Do not use unrelated or competitor names as tags.

### Migration discovery page

Add a first-class website route aimed at users searching for a maintained
version of the original package. It should include:

- an explicit independent-continuation statement;
- package-name and installation changes;
- a minimal old/new controlled example;
- the major prop, callback, and CSS mappings;
- React and browser requirements;
- links to the complete guide, examples, API reference, npm, and GitHub;
- metadata targeting factual migration and React 19 queries without keyword
  stuffing.

The page becomes the canonical destination used in outreach and migration PRs.

## Maintainer outreach

Outreach is written in the first person as Nicholas. Messages should be short,
specific to the recipient, technically accurate, and free of pressure.

### Original maintainers

Contact the original project maintainer first. Ask whether they would be
comfortable adding a README pointer for users seeking an actively maintained
React 19 implementation. Offer the migration page as the destination.

Do not ask for npm ownership, package transfer, deprecation, or an “official”
endorsement in the first message. Those may be discussed only if the maintainer
raises them or Nicholas separately approves a follow-up.

### Dependency maintainers

Contact maintainers only after tracing the exact dependency and API ownership.
For the Hyperlane case, explain that the path is
`starknetkit → @argent/x-ui → react-spring-bottom-sheet`, and direct the
migration proposal to the component that wraps the old API. Do not propose a
Hyperlane package-manager override as a migration.

### Channels and records

Prefer an existing repository discussion or narrowly scoped issue when no
private contact channel is connected. Avoid duplicate outreach across email,
issues, and social channels. Record the URL, date, recipient, purpose, status,
and follow-up date in a campaign tracker. Never publish private email addresses
in repository files.

## Real-world migrations

Research active public repositories that directly import the original package.
Score candidates on:

- recent maintenance activity;
- React 19 compatibility or an active React 19 migration;
- direct rather than purely transitive usage;
- manageable API and styling surface;
- available automated tests or reproducible build;
- visible benefit from v5 accessibility and maintenance.

Select at most three initial candidates. Before opening a PR, migrate the code
fully, preserve behavior and styling, run the repository's own verification,
and explain any intentional differences. Do not submit dependency-only PRs for
breaking migrations and do not automate bulk pull requests.

If repeated migration friction reveals a small faithfully mappable legacy
surface, document the evidence and propose a compatibility adapter separately.
Do not build an adapter speculatively.

## Technical launch content

Prepare one substantial article with the working title:

> Rebuilding react-spring-bottom-sheet for React 19: accessibility, gestures,
> and six years of ecosystem change

The article should explain the lineage, engineering constraints, new component
model, accessibility choices, gesture and interruption behavior, styling
contract, browser matrix, and migration path. It must be useful independently
of the promotional call to action.

Prepare channel-specific excerpts for developer communities, but do not publish
the same generic copy everywhere. Public launch follows the migration page and
at least one of: an upstream acknowledgement, an accepted migration, or a
documented production integration. This supplies external evidence before a
broad announcement.

## Campaign tracker

Keep a local, non-published tracker outside product documentation when it may
contain contact details or draft correspondence. The publishable repository may
contain a generic adoption checklist, but not personal data or private notes.

For each action track:

- target and dependency relationship;
- public URL, if any;
- current status;
- last action and next follow-up date;
- response or technical blocker;
- resulting referral, PR, or adoption evidence.

Follow up at most once after a reasonable interval. A non-response ends the
sequence.

## Execution phases

### Phase 1: Conversion foundation

1. Improve README positioning and calls to action.
2. Add and verify the migration discovery page.
3. Update GitHub description, website field, and topics.
4. Prepare the private campaign tracker.

### Phase 2: Targeted outreach

1. Contact the original maintainer.
2. Contact the owner of the `@argent/x-ui` integration or its reachable parent
   project.
3. Inform Hyperlane with the upstream migration context where useful.
4. Research and rank direct-user migration candidates.

### Phase 3: Adoption evidence

1. Complete up to three tested migrations.
2. Incorporate recurring migration lessons into documentation.
3. Collect only verifiable public adoption evidence.

### Phase 4: Technical launch

1. Finish the technical article and channel-specific excerpts.
2. Publish only after the evidence threshold is met.
3. Respond to technical feedback and measure qualified traffic and migrations.

## Verification

Repository changes must pass `npm run check` and the relevant website browser
tests. The migration page must be included in navigation, sitemap, metadata,
link verification, narrow-layout coverage, and accessibility checks.

GitHub metadata must be read back after mutation. Every public issue, discussion,
or PR must be opened against the intended repository from the intended account,
then read back and recorded. External migrations must pass the target project's
available checks before submission.

## Success criteria

Initial success is measured by qualified outcomes rather than raw impressions:

- the migration page is indexed and receives relevant referrals;
- the original maintainer responds or adds a discovery pointer;
- at least one upstream dependency owner engages with the migration;
- at least one real application completes or accepts a migration;
- new-package downloads show sustained growth over multiple completed months;
- issues reveal successful usage rather than unresolved migration confusion.

Download counts must be reported with their npm date window and must not be
presented as a count of active developers.

## Authority and escalation

Nicholas authorizes targeted public contact and technically complete public PRs
under the authenticated `Cylop` GitHub identity. Routine wording, issue creation,
and PR iteration are in scope.

Return to Nicholas before accepting ownership transfers, npm access, legal or
commercial commitments, paid promotion, sponsorship terms, coordinated release
dates, or any request to characterize the project as official. Destructive or
irreversible repository actions remain out of scope.
