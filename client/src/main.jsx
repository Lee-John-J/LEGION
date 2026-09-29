import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Typefaces are bundled and served from LEGION's own origin (no request to
// Google Fonts, so visitors' IP addresses never reach a third party). Only the
// weights the design uses; each file carries unicode-range subsets, so the
// browser downloads just the scripts a page needs.
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/ibm-plex-mono/300.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
