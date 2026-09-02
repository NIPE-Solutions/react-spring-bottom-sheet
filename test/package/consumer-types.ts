import type {
  OpenChangeDetails,
  OpenChangeReason,
  SnapPoint,
  SnapPointValue,
} from '@nipe-solutions/react-spring-bottom-sheet'

const reason: OpenChangeReason = 'trigger'
const details: OpenChangeDetails = { reason }
const value: SnapPointValue = '50%'
const snapPoint: SnapPoint = { id: 'half', value }

void details
void snapPoint
