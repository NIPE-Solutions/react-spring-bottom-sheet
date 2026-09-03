import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Fixture } from './Fixture.js'
import '../../src/styles/core.css'
import './styles.css'
import './custom-theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture customTheme />
  </StrictMode>,
)
