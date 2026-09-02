import type { ReactNode } from 'react'
import { Backdrop } from './Backdrop.js'
import type { SheetBackdropProps } from './Backdrop.js'
import { Content } from './Content.js'
import type { SheetContentProps } from './Content.js'
import { Description } from './Description.js'
import { Handle } from './Handle.js'
import { Portal } from './Portal.js'
import { Root } from './Root.js'
import type { SheetRootProps } from './Root.js'
import { Title } from './Title.js'
import { Viewport } from './Viewport.js'
import type { SheetViewportProps } from './Viewport.js'

export interface BottomSheetProps extends Omit<SheetRootProps, 'children'> {
  children: ReactNode
  title: ReactNode
  description?: ReactNode
  backdropProps?: SheetBackdropProps
  contentProps?: SheetContentProps
  viewportProps?: SheetViewportProps
}

export function BottomSheet({
  backdropProps,
  children,
  contentProps,
  description,
  title,
  viewportProps,
  ...rootProps
}: BottomSheetProps) {
  return (
    <Root {...rootProps}>
      <Portal>
        <Backdrop {...backdropProps} />
        <Viewport {...viewportProps}>
          <Content {...contentProps}>
            <Handle />
            <Title>{title}</Title>
            {description === undefined ? null : (
              <Description>{description}</Description>
            )}
            {children}
          </Content>
        </Viewport>
      </Portal>
    </Root>
  )
}
