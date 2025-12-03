import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import ConfigCheck from './components/setup/ConfigCheck'
import { preloadCommonRoutes } from './utils/preload'

// Lazy load all route components for code splitting
const LoginForm = lazy(() => import('./components/auth/LoginForm'))
const RegisterForm = lazy(() => import('./components/auth/RegisterForm'))
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'))
const CollectionDashboard = lazy(() => import('./components/collection/CollectionDashboard'))
const SummaryDashboard = lazy(() => import('./components/summary/SummaryDashboard'))
const PublishDashboard = lazy(() => import('./components/publish/PublishDashboard'))
const Notifications = lazy(() => import('./components/notifications/Notifications'))
const Automation = lazy(() => import('./components/automation/Automation'))
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard').then(module => ({ default: module.AnalyticsDashboard })))
const Settings = lazy(() => import('./components/settings/Settings'))

// Loading fallback component
function RouteLoader() {
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
    </div>
  )
}

function App() {
  // Preload common routes after app initialization
  useEffect(() => {
    preloadCommonRoutes()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <ConfigCheck>
          <div className='min-h-screen bg-background'>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Authentication Routes */}
                <Route path='/auth/login' element={<LoginForm />} />
                <Route path='/auth/register' element={<RegisterForm />} />

                {/* Protected Application Routes */}
                <Route path='/' element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to='/dashboard' replace />} />
                  <Route path='dashboard' element={<Dashboard />} />
                  <Route path='collection' element={<CollectionDashboard />} />
                  <Route path='summary' element={<SummaryDashboard />} />
                  <Route path='publish' element={<PublishDashboard />} />
                  <Route path='notifications' element={<Notifications />} />
                  <Route path='automation' element={<Automation />} />
                  <Route path='analytics' element={<AnalyticsDashboard />} />
                  <Route path='settings' element={<Settings />} />
                </Route>

                {/* Catch all route */}
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </Suspense>
          </div>
        </ConfigCheck>
      </Router>
    </AuthProvider>
  )
}

export default App
