import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Fixture } from './Fixture.js'
import '../../src/styles/core.css'
import '../../src/styles/theme.css'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
)
