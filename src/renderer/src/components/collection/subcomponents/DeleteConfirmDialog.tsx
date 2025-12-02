// ============================================================================
// Delete Confirmation Dialog Component
// ============================================================================

import React from 'react'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  targetName: string
  targetType: string
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  targetName,
  targetType
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
        <p className="text-gray-600 mb-6">
          您确定要删除这个{targetType} "{targetName}" 吗？此操作无法撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  )
}
