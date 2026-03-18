import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './config/firebase'
import { LoginScreen } from './components/LoginScreen'
import { Dashboard } from './pages/Dashboard'
import { Toaster, toast } from 'sonner'
import { DownloadIcon, XIcon } from 'lucide-react'

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  // PWA Install Prompt
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsTransitioning(true)
      setTimeout(() => {
        setIsAuthenticated(!!user)
        setIsInitializing(false)
        setIsTransitioning(false)
      }, 300)
    })
    return () => unsubscribe()
  }, [])

  // Listen for PWA install event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      toast.success('App installed!')
    }
    setInstallPrompt(null)
    setShowInstallBanner(false)
  }

  const handleLogin = () => {
    toast.success('Logged in.')
  }

  const handleLogout = async () => {
    setIsTransitioning(true)
    try {
      await signOut(auth)
      toast.info('Logged out.')
    } catch {
      toast.error('Logout failed.')
    }
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen w-full bg-slate-950 transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transition: 'opacity 300ms ease',
      }}
    >
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-zinc-900 border-b border-cyan-500/30 px-4 py-3 flex items-center justify-between gap-3 animate-slide-up shadow-lg">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="App Icon" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="font-mono text-xs font-semibold text-white">Install Casa de Labada</p>
              <p className="font-mono text-[10px] text-zinc-500">Add to your home screen for quick access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              <DownloadIcon className="w-3 h-3" />
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}

      <Toaster
        richColors
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            fontFamily: 'monospace',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}

export default App
