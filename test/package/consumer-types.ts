import type {
  OpenChangeDetails,
  OpenChangeReason,
  SnapPoint,
  SnapPointValue,
  SheetRootProps,
} from '@nipe-solutions/react-spring-bottom-sheet'

const reason: OpenChangeReason = 'trigger'
const details: OpenChangeDetails = { reason }
const value: SnapPointValue = '50%'
const snapPoint: SnapPoint = { id: 'half', value }
const rootProps: SheetRootProps = {
  defaultOpen: true,
  children: null,
  snapPoints: [snapPoint],
}

void details
void snapPoint
void rootProps
