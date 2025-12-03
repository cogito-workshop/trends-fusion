// ============================================================================
// Status Badge Component - Displays workflow execution status
// ============================================================================

import React from 'react'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: '✓' }
      case 'running':
        return { color: 'bg-blue-100 text-blue-800', icon: '⟳' }
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: '⏱' }
      case 'failed':
        return { color: 'bg-red-100 text-red-800', icon: '✗' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '?' }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
    >
      <span className="mr-1">{config.icon}</span>
      {status}
    </span>
  )
}

// ============================================================================
// Status Icon Component - Simple icon representation
// ============================================================================

interface StatusIconProps {
  status: string
  className?: string
}

export function StatusIcon({ status, className = 'h-4 w-4' }: StatusIconProps) {
  const getIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '✓'
      case 'running':
        return '⟳'
      case 'pending':
        return '⏱'
      case 'failed':
        return '✗'
      default:
        return '?'
    }
  }

  return <span className={className}>{getIcon(status)}</span>
}

// ============================================================================
// Source Type Icon Component - Displays data source type
// ============================================================================

interface SourceTypeIconProps {
  type: string
  className?: string
}

export function SourceTypeIcon({ type, className = 'h-4 w-4' }: SourceTypeIconProps) {
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'firecrawl':
        return '🔥'
      case 'twitter':
        return '🐦'
      case 'jina':
        return '🤖'
      case 'rss':
        return '📰'
      default:
        return '📊'
    }
  }

  return <span className={className}>{getIcon(type)}</span>
}
