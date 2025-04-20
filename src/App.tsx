import './App.css'
import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link as RouterLink, Navigate } from 'react-router-dom'
import { VideoUploader } from '@/pages/VideoUploader'
import { EncryptionTools } from '@/pages/EncryptionTools'
import LandingPage from '@/pages/landing'
import LoginPage from '@/components/login'
import SignUpPage from '@/components/sign-up'
import { Button } from '@/components/ui/button'
import {
  Lock, Video, Sun, Moon, LaptopIcon,
  FileVideo, FileText, ShieldCheck, PanelRight,
  GithubIcon, InfoIcon, Settings, ChevronRight, HomeIcon
} from 'lucide-react'
import { ThemeProvider, useTheme } from '@/components/ThemeProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Keep ThemeToggle as it is
function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

// Create a component for the Tools layout
function ToolsLayout() {
  const [activeView, setActiveView] = useState<'video' | 'encryption'>('video');
  const [showInfo, setShowInfo] = useState(false);
  const [progress, setProgress] = useState(0); // Example progress state

  // Example effect to simulate progress
  useEffect(() => {
    if (activeView === 'video') {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    } else {
      setProgress(0);
    }
  }, [activeView]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          {/* Simplified Header for Tools Page */}
          <nav className="flex w-full items-center justify-between gap-4 text-sm font-medium">
             <div className="flex items-center gap-2">
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button variant="ghost" size="icon" className="size-9 rounded-full" asChild>
                       <RouterLink to="/">
                         <HomeIcon size={18} />
                       </RouterLink>
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent side="bottom">
                     <p className="text-xs">Back to Home</p>
                   </TooltipContent>
                 </Tooltip>
               </TooltipProvider>
               <h1 className="text-lg font-semibold">Video Tools</h1>
             </div>

            <div className="flex items-center gap-2">
              {/* View Toggle Buttons */}
              <Button
                variant={activeView === 'video' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('video')}
                className={cn(
                  "gap-2 transition-all duration-200",
                  activeView === 'video' ? "shadow-sm" : "hover:bg-muted/50"
                )}
              >
                <Video size={16} />
                <span className="hidden sm:inline">Video Processing</span>
              </Button>
              <Button
                variant={activeView === 'encryption' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('encryption')}
                className={cn(
                  "gap-2 transition-all duration-200",
                  activeView === 'encryption' ? "shadow-sm" : "hover:bg-muted/50"
                )}
              >
                <Lock size={16} />
                <span className="hidden sm:inline">Encryption</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9 rounded-full text-muted-foreground"
                      onClick={() => setShowInfo(!showInfo)}
                    >
                      <InfoIcon size={18} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs">About this application</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ThemeToggle />
            </div>
          </nav>
        </header>

        {showInfo && (
          <div className="my-4 animate-slide-in px-4 sm:px-6">
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground mb-2">About EncodedVideo Tools</h3>
                <p>This application demonstrates client-side video processing and encryption using WebAssembly and modern web APIs. Upload a video to process it directly in your browser.</p>
                <p className="mt-2">No video data is sent to any server during the processing or encryption steps shown here.</p>
                <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline mt-2 inline-flex items-center gap-1">
                  Learn more on GitHub <GithubIcon size={14} />
                </a>
              </CardContent>
            </Card>
          </div>
        )}

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {activeView === 'video' ? (
            <VideoUploader progress={progress} setProgress={setProgress} />
          ) : (
            <EncryptionTools />
          )}
        </main>

        <footer className="mt-auto border-t bg-background px-4 py-4 sm:px-6">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 text-center text-xs text-muted-foreground sm:flex-row">
            <p>&copy; {new Date().getFullYear()} EncodedVideoProject. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Use</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Protected route component to check authentication
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true'
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Main App component sets up routing
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/tools" element={
            <ProtectedRoute>
              <ToolsLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App