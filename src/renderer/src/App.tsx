import { useState } from 'react'
import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import Dashboard from './components/ai-trend-publish/Dashboard'
import Workflows from './components/ai-trend-publish/Workflows'
import Templates from './components/ai-trend-publish/Templates'

type Tab = 'dashboard' | 'workflows' | 'templates'

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'workflows':
        return <Workflows />
      case 'templates':
        return <Templates />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <img alt="logo" className="logo" src={electronLogo} />
        <h1>Trends Fusion - AI Trend Publish</h1>
      </header>

      {/* Navigation Tabs */}
      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
      </nav>

      {/* Tab Content */}
      <main className="main-content">{renderTabContent()}</main>

      {/* Footer */}
      <footer className="footer">
        <button onClick={ipcHandle} className="ipc-button">
          Send IPC Test
        </button>
        <Versions></Versions>
      </footer>
    </div>
  )
}

export default App
