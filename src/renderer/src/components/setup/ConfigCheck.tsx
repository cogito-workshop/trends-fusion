import React, { useState, useEffect } from 'react';
import SetupWizard from './SetupWizard';

export default function ConfigCheck({ children }: { children: React.ReactNode }) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();

    // Listen for setup completion event
    const handleSetupComplete = () => {
      console.log('Setup complete event received, rechecking configuration...');
      setIsLoading(true);
      checkConfiguration();
    };

    window.addEventListener('setup-complete', handleSetupComplete);
    return () => {
      window.removeEventListener('setup-complete', handleSetupComplete);
    };
  }, []);

  const checkConfiguration = async () => {
    try {
      console.log('Checking configuration status...');
      const configured = await window.aiTrendPublish.config.isConfigured();
      console.log('Configuration status:', configured);
      setIsConfigured(configured);
    } catch (error) {
      console.error('Failed to check configuration:', error);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">检查配置状态...</p>
        </div>
      </div>
    );
  }

  if (isConfigured === false) {
    return <SetupWizard />;
  }

  return <>{children}</>;
}
