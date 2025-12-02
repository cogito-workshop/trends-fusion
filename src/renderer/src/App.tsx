import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import ProtectedRoute from './components/auth/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import CollectionDashboard from './components/collection/CollectionDashboard'
import SummaryDashboard from './components/summary/SummaryDashboard'
import PublishDashboard from './components/publish/PublishDashboard'
import Notifications from './components/notifications/Notifications'
import Automation from './components/automation/Automation'
import Settings from './components/settings/Settings'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='min-h-screen bg-background'>
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
              <Route path='settings' element={<Settings />} />
            </Route>

            {/* Catch all route */}
            <Route path='*' element={<Navigate to='/' replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
