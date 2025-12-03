// ============================================================================
// Collection Dashboard - REFACTORED with Subcomponents
// Reduced from 918 lines to ~200 lines using component composition
// ============================================================================

import React, { useState, useEffect } from 'react'
import { useCollection } from '../../hooks/useCollection'
import {
  WorkflowExecutionList,
  DeleteConfirmDialog
} from './subcomponents'

export default function CollectionDashboard() {
  const {
    workflowExecutions,
    loading,
    createWorkflowExecution,
    updateWorkflowExecution,
    deleteWorkflowExecution,
    refreshExecutions
  } = useCollection()

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)

  // ============================================================================
  // Event Handlers - Simplified delegation to hooks
  // ============================================================================

  const handleExecuteWorkflow = async (id: string) => {
    try {
      await updateWorkflowExecution(id, { status: 'running' })
      await refreshExecutions()
    } catch (error) {
      console.error('Failed to execute workflow:', error)
    }
  }

  const handleDeleteWorkflow = (id: string, name: string) => {
    setDeleteTarget({ id, name })
    setIsDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteWorkflowExecution(deleteTarget.id)
        await refreshExecutions()
        setIsDeleteConfirmOpen(false)
        setDeleteTarget(null)
      } catch (error) {
        console.error('Failed to delete workflow:', error)
      }
    }
  }

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">数据采集控制台</h1>
          <p className="mt-2 text-gray-600">
            管理和监控您的数据采集工作流
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={refreshExecutions}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            刷新
          </button>
          <button
            onClick={() =>
              createWorkflowExecution({
                name: `Workflow ${Date.now()}`,
                type: 'weixin-article',
                status: 'pending'
              })
            }
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            创建工作流
          </button>
        </div>

        {/* Workflow Execution List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            工作流执行列表
          </h2>
          <WorkflowExecutionList
            executions={workflowExecutions}
            onExecute={handleExecuteWorkflow}
            onDelete={handleDeleteWorkflow}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false)
            setDeleteTarget(null)
          }}
          onConfirm={confirmDelete}
          targetName={deleteTarget?.name || ''}
          targetType="工作流"
        />
      </div>
    </div>
  )
}

// ============================================================================
// Component Architecture Summary
// ============================================================================

/**
 * REFACTORING RESULTS:
 *
 * BEFORE: Single 918-line monolithic component
 * AFTER: Composed of multiple focused subcomponents
 *
 * Subcomponents Created:
 * 1. StatusBadge.tsx - Status display with icons
 * 2. DeleteConfirmDialog.tsx - Reusable confirmation dialog
 * 3. WorkflowExecutionList.tsx - Data table component
 *
 * Benefits:
 * - Reduced main component from 918 to ~200 lines (78% reduction)
 * - Improved reusability
 * - Better separation of concerns
 * - Easier to test individual components
 * - Enhanced maintainability
 *
 * Files Structure:
 * src/renderer/src/components/collection/
 * ├── CollectionDashboard.tsx (MAIN - refactored)
 * └── subcomponents/
 *     ├── StatusBadge.tsx
 *     ├── DeleteConfirmDialog.tsx
 *     ├── WorkflowExecutionList.tsx
 *     └── index.ts
 */
