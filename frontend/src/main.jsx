import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { VisitPlanProvider } from './context/VisitPlanContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <VisitPlanProvider>
        <App />
      </VisitPlanProvider>
    </AuthProvider>
  </StrictMode>,
)
