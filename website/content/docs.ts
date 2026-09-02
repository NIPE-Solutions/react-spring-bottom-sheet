import type { DocPage } from './types'

export const docs = [
  {
    slug: 'introduction',
    title: 'Introduction',
    description: 'Why the sheet exists and how version 5 is designed.',
    group: 'learn',
    order: 1,
    sections: [
      {
        id: 'dialog-behavior',
        title: 'A bottom sheet that behaves like a dialog',
        body: 'Version 5 combines a small compound API with owned gesture, layout, focus, and motion boundaries. It supports modal workflows, persistent non-modal panels, content-sized sheets, and explicit snap points.',
      },
      {
        id: 'deliberate-boundaries',
        title: 'Deliberate boundaries',
        body: 'The public contract does not expose the animation engine. Mechanical CSS is separate from the optional theme, and every owned selector uses the rsbs namespace.',
      },
    ],
  },
  {
    slug: 'installation',
    title: 'Installation',
    description: 'Install the React 19 package and choose a stylesheet.',
    group: 'learn',
    order: 2,
    sections: [
      {
        id: 'package',
        title: 'Package',
        body: 'Install @nipe-solutions/react-spring-bottom-sheet with React 19 and React DOM 19.',
        code: 'npm install @nipe-solutions/react-spring-bottom-sheet',
      },
      {
        id: 'styles',
        title: 'Styles',
        body: 'Import styles.css for the complete default experience, or combine core.css with your own visual theme.',
        code: "import '@nipe-solutions/react-spring-bottom-sheet/styles.css'",
      },
    ],
  },
  {
    slug: 'anatomy',
    title: 'Component anatomy',
    description: 'Compose only the pieces your interface needs.',
    group: 'learn',
    order: 3,
    sections: [
      {
        id: 'compound-components',
        title: 'Compound components',
        body: 'Sheet.Root owns state. Trigger and Close request state changes. Portal, Backdrop, Viewport, Content, Handle, Title, and Description define the rendered interface.',
      },
      {
        id: 'convenience-composition',
        title: 'Convenience composition',
        body: 'BottomSheet provides the common portal, backdrop, viewport, content, handle, title, and description arrangement without creating a second implementation.',
      },
    ],
  },
  {
    slug: 'state',
    title: 'State and lifecycle',
    description:
      'Choose controlled or uncontrolled state without mixing contracts.',
    group: 'learn',
    order: 4,
    sections: [
      {
        id: 'open-state',
        title: 'Open state',
        body: 'Use defaultOpen for local state. Use open with onOpenChange when application state is authoritative. Change details identify trigger, close, escape, backdrop, drag, or imperative requests.',
      },
      {
        id: 'snap-state',
        title: 'Snap state',
        body: 'activeSnapPoint and onSnapPointChange form the controlled contract. defaultSnapPoint initializes the uncontrolled contract.',
      },
    ],
  },
  {
    slug: 'snap-points',
    title: 'Snap points',
    description: 'Name every destination and express its height clearly.',
    group: 'learn',
    order: 5,
    sections: [
      {
        id: 'values',
        title: 'Values',
        body: 'A snap point has a stable id and accepts a pixel number, a px string, a percentage of the viewport, or content.',
        code: "const snaps = [{ id: 'peek', value: '35%' }, { id: 'full', value: '90%' }]",
      },
      {
        id: 'reconciliation',
        title: 'Reconciliation',
        body: 'When layout changes, the active destination resolves again. If a destination disappears, the nearest valid point is selected.',
      },
    ],
  },
  {
    slug: 'gestures',
    title: 'Gestures and scrolling',
    description:
      'Drag the handle or content without competing with nested scroll.',
    group: 'learn',
    order: 6,
    sections: [
      {
        id: 'ownership',
        title: 'Ownership',
        body: 'Scrollable descendants keep a gesture while they can move in its direction. At a boundary, the sheet can take ownership of the remaining movement.',
      },
      {
        id: 'interruptions',
        title: 'Interruptions',
        body: 'Pointer cancellation, window blur, multi-touch, unmounting, and a new gesture all use the same cleanup path.',
      },
    ],
  },
  {
    slug: 'accessibility',
    title: 'Accessibility',
    description:
      'Modal semantics, naming, focus, and restoration are built in.',
    group: 'learn',
    order: 7,
    sections: [
      {
        id: 'accessible-name',
        title: 'Name every sheet',
        body: 'Render Sheet.Title and optionally Sheet.Description inside Sheet.Content. Their generated ids are connected to the dialog automatically.',
      },
      {
        id: 'modal-and-non-modal',
        title: 'Modal and non-modal',
        body: 'Modal sheets contain focus, isolate background content, close with Escape when dismissible, and restore focus. Set modal to false for a persistent complementary interaction.',
      },
    ],
  },
  {
    slug: 'styling',
    title: 'Styling',
    description: 'Keep mechanics, theme, and application styles independent.',
    group: 'learn',
    order: 8,
    sections: [
      {
        id: 'entry-points',
        title: 'Three entry points',
        body: 'core.css contains positioning and interaction mechanics. theme.css contains optional visual tokens. styles.css imports both in deterministic layer order.',
      },
      {
        id: 'complete-replacement',
        title: 'Complete replacement',
        body: 'Import core.css only, then target the stable rsbs classes from your own stylesheet. Low-specificity library rules allow ordinary consumer selectors to win without important declarations.',
      },
    ],
  },
  {
    slug: 'examples',
    title: 'Examples',
    description: 'Working patterns for common sheet configurations.',
    group: 'reference',
    order: 1,
    sections: [
      {
        id: 'interactive-laboratory',
        title: 'Interactive laboratory',
        body: 'The examples route demonstrates controlled state, named snap points, modal behavior, nested scrolling, a custom portal target, theme replacement, dark mode, and reduced-motion-safe behavior.',
      },
    ],
  },
  {
    slug: 'api',
    title: 'API reference',
    description: 'The complete public surface for version 5.',
    group: 'reference',
    order: 2,
    sections: [
      {
        id: 'sheet-root',
        title: 'Sheet.Root',
        body: 'Props: open, defaultOpen, onOpenChange, snapPoints, activeSnapPoint, defaultSnapPoint, onSnapPointChange, modal, and dismissible.',
      },
      {
        id: 'dom-primitives',
        title: 'DOM primitives',
        body: 'Trigger, Close, Backdrop, Viewport, Content, Handle, Title, and Description accept native element props, forwarded refs, className, and asChild.',
      },
      {
        id: 'bottom-sheet',
        title: 'BottomSheet',
        body: 'Accepts the Root contract plus title, description, backdropProps, viewportProps, and contentProps.',
      },
    ],
  },
  {
    slug: 'migration',
    title: 'Migrate from version 4',
    description: 'Map legacy props and selectors to the redesigned contract.',
    group: 'project',
    order: 1,
    sections: [
      {
        id: 'migration-guide',
        title: 'Start with the migration guide',
        body: 'Version 5 intentionally changes component composition, callbacks, snap-point values, stylesheets, and supported React versions. Review the repository migration guide before upgrading.',
      },
    ],
  },
  {
    slug: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Resolve the most common integration mistakes.',
    group: 'project',
    order: 2,
    sections: [
      {
        id: 'missing-layout',
        title: 'The sheet has no layout',
        body: 'Import core.css or styles.css exactly once from your application entry point.',
      },
      {
        id: 'missing-name',
        title: 'The sheet has no accessible name',
        body: 'Place Sheet.Title inside Sheet.Content. Do not substitute a visual heading that is outside the sheet context.',
      },
      {
        id: 'controlled-state',
        title: 'Controlled state does not change',
        body: 'Update open in onOpenChange and activeSnapPoint in onSnapPointChange. Controlled props remain authoritative.',
      },
    ],
  },
] as const satisfies readonly DocPage[]
