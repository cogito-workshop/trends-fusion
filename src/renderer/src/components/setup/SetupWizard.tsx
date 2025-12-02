import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, CheckCircle, Sparkles } from 'lucide-react';
import './setup.css';

interface ConfigItem {
  key: string;
  label: string;
  description: string;
  category: 'ai' | 'database' | 'notifications' | 'datasources' | 'wechat';
  required: boolean;
  type: 'api_key' | 'webhook' | 'url' | 'string' | 'number';
  placeholder: string;
  example?: string;
  sensitive?: boolean;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
  configItem?: ConfigItem;
}

export default function SetupWizard() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [missingConfigs, setMissingConfigs] = useState<ConfigItem[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSetup();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeSetup = async () => {
    try {
      // Check if already configured
      const isConfigured = await window.aiTrendPublish.config.isConfigured();

      if (isConfigured) {
        setIsCompleted(true);
        setMessages([
          {
            id: generateUniqueId(),
            type: 'bot',
            content: 'Hi! I\'m your AI assistant. I can see that you\'ve already configured everything! 🎉',
            timestamp: new Date()
          }
        ]);
        setIsLoading(false);
        return;
      }

      // Get configuration status
      const missing = await window.aiTrendPublish.config.getMissingConfigs();

      setMissingConfigs(missing);

      // Welcome message
      const welcomeMessage: ChatMessage = {
        id: generateUniqueId(),
        type: 'bot',
        content: `Hi there! 👋 I'm your AI setup assistant. I'm here to help you configure AI Trend Publish Service!\n\nI'll guide you through configuring all the necessary API keys and settings. Don't worry - you can always skip optional ones for now and configure them later.\n\nLet's start! 🚀`,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);

      // Ask for first config
      if (missing.length > 0) {
        setTimeout(() => {
          askForConfig(missing[0]);
        }, 1000);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize setup:', error);
      setMessages([
        {
          id: '1',
          type: 'bot',
          content: 'Sorry, I encountered an error while checking the configuration. Please try again.',
          timestamp: new Date()
        }
      ]);
      setIsLoading(false);
    }
  };

  const generateUniqueId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  };

  const askForConfig = (configItem: ConfigItem) => {
    const message: ChatMessage = {
      id: generateUniqueId(),
      type: 'bot',
      content: `**${configItem.label}**\n\n${configItem.description}\n\n${configItem.example ? `Example: \`${configItem.example}\`` : ''}\n\n${configItem.required ? '⚠️ This is required' : '✨ This is optional'}\n\n${!configItem.required ? 'You can paste your key below or click "Skip" to configure later!\n\n' : ''}`,
      timestamp: new Date(),
      configItem: configItem
    };

    setMessages(prev => [...prev, message]);
  };

  const handleSkipForMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];
    if (!message.configItem || message.configItem.required) {
      return;
    }

    // Find the config index in missingConfigs
    const configIndex = missingConfigs.findIndex(c => c.key === message.configItem!.key);
    if (configIndex === -1) return;

    // Update currentConfigIndex to this index
    setCurrentConfigIndex(configIndex);

    const skipMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: `No problem! You can configure ${message.configItem.label} later in the settings. 📝`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, skipMessage]);

    const nextIndex = configIndex + 1;

    if (nextIndex < missingConfigs.length) {
      setCurrentConfigIndex(nextIndex);
      setTimeout(() => {
        askForConfig(missingConfigs[nextIndex]);
      }, 1000);
    } else {
      // All configs processed
      setTimeout(() => {
        completeSetup();
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    const currentConfig = missingConfigs[currentConfigIndex];

    if (inputValue.toLowerCase() === 'skip' && !currentConfig.required) {
      const skipMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `No problem! You can configure ${currentConfig.label} later in the settings. 📝`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, skipMessage]);
    } else {
      // Save the configuration
      try {
        await window.aiTrendPublish.config.set(currentConfig.key, inputValue);

        const successMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `✅ Got it! I've saved your ${currentConfig.label}. Great job!`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } catch (error) {
        console.error('Failed to save config:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `⚠️ Sorry, I had trouble saving that. Please try again.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setInputValue(inputValue); // Keep the value
        return;
      }
    }

    setInputValue('');
    const nextIndex = currentConfigIndex + 1;

    if (nextIndex < missingConfigs.length) {
      setCurrentConfigIndex(nextIndex);
      setTimeout(() => {
        askForConfig(missingConfigs[nextIndex]);
      }, 1000);
    } else {
      // All configs processed
      setTimeout(() => {
        completeSetup();
      }, 1000);
    }
  };

  const completeSetup = async () => {
    try {
      const report = await window.aiTrendPublish.config.getReport();
      const completionMessage: ChatMessage = {
        id: generateUniqueId(),
        type: 'bot',
        content: `🎉 **Setup Complete!**\n\nYou've configured ${report.configuredItems} out of ${report.totalItems} settings (${report.completeness}% complete).\n\n${report.completeness >= 50 ? 'Awesome! You have most of the important settings configured. You can now start using the app! 🚀' : 'Good start! You can add more settings later as needed.'}\n\nClick "Enter App" to start exploring!`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, completionMessage]);
      setIsCompleted(true);
    } catch (error) {
      console.error('Failed to complete setup:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing setup wizard...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 glow-border checkmark">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">You're All Set! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your configuration is complete. Time to start exploring the amazing features!
          </p>
          <button
            onClick={() => {
              // Trigger a custom event to notify ConfigCheck to re-check
              window.dispatchEvent(new CustomEvent('setup-complete'));
            }}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg pulse-button"
          >
            Enter App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white setup-wizard-bg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center bot-avatar">
              <Sparkles className="w-6 h-6 sparkle" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Setup Assistant</h1>
              <p className="text-purple-100 text-sm">Let's configure your app together!</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Configuration Progress
            </span>
            <span className="text-sm text-gray-500">
              {currentConfigIndex + 1} / {missingConfigs.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 progress-glow"
              style={{ width: `${((currentConfigIndex + 1) / missingConfigs.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 message-fade-in ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 bot-avatar">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 message-bubble ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white glow-border ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {/* Skip button for bot messages with config items - inline */}
                  {message.type === 'bot' && message.configItem && !message.configItem.required && (
                    <button
                      onClick={() => handleSkipForMessage(message.id)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
                    >
                      Skip this →
                    </button>
                  )}
                  <div
                    className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 pulse-button">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border-t">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                missingConfigs[currentConfigIndex]?.placeholder || 'Type your response...'
              }
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent input-glow"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed pulse-button"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: Type 'skip' to skip optional settings
          </p>
        </form>
      </div>
    </div>
  );
}
