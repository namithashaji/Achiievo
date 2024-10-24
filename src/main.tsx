import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { LeaderboardProvider } from './context/LeaderboardContext.tsx'

createRoot(document.getElementById('root')!).render(

<BrowserRouter>
    <AuthProvider>
      <LeaderboardProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LeaderboardProvider>
    </AuthProvider>
</BrowserRouter>

,
)
