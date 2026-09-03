import type { ComponentType } from 'react'
import { AccessibilityGuide } from './accessibility'
import { AnatomyGuide } from './anatomy'
import { GesturesGuide } from './gestures'
import { InstallationGuide } from './installation'
import { IntroductionGuide } from './introduction'
import { SnapPointsGuide } from './snap-points'
import { StateGuide } from './state'
import { StylingGuide } from './styling'
import { TroubleshootingGuide } from './troubleshooting'

const guides: Readonly<Record<string, ComponentType>> = {
  introduction: IntroductionGuide,
  installation: InstallationGuide,
  anatomy: AnatomyGuide,
  state: StateGuide,
  'snap-points': SnapPointsGuide,
  gestures: GesturesGuide,
  accessibility: AccessibilityGuide,
  styling: StylingGuide,
  troubleshooting: TroubleshootingGuide,
}

export function getLearnGuide(slug: string): ComponentType | undefined {
  return guides[slug]
}
