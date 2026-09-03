import { ImageResponse } from 'next/og'

export const alt =
  'React Spring Bottom Sheet — accessible and composable for React 19'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-static'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#f7f8fb',
        color: '#161923',
        display: 'flex',
        fontFamily: 'sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '80px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: '720px' }}>
        <div style={{ color: '#5056d8', fontSize: 28 }}>
          React 19 · Version 5
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: '-4px',
            lineHeight: 0.98,
            marginTop: 32,
          }}
        >
          A bottom sheet with boundaries you can trust.
        </div>
      </div>
      <div
        style={{
          border: '3px solid #d9dce6',
          display: 'flex',
          height: '420px',
          position: 'relative',
          width: '280px',
        }}
      >
        <div
          style={{
            background: '#5056d8',
            bottom: 0,
            display: 'flex',
            height: '230px',
            left: 24,
            position: 'absolute',
            width: 232,
            borderRadius: '18px 18px 0 0',
          }}
        />
      </div>
    </div>,
    size,
  )
}
