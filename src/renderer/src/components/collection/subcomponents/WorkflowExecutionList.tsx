// ============================================================================
// Workflow Execution List Component
// ============================================================================

import React from 'react'
import { StatusBadge, StatusIcon, SourceTypeIcon } from './StatusBadge'

interface WorkflowExecution {
  id: string
  name: string
  type: string
  status: string
  startTime?: Date
  createdAt?: Date
}

interface WorkflowExecutionListProps {
  executions: WorkflowExecution[]
  onExecute?: (id: string) => void
  onDelete?: (id: string, name: string) => void
}

export function WorkflowExecutionList({
  executions,
  onExecute,
  onDelete
}: WorkflowExecutionListProps) {
  if (executions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        暂无工作流执行记录
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              工作流
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              类型
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              状态
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              开始时间
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {executions.map((execution) => (
            <tr key={execution.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {execution.name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <SourceTypeIcon type={execution.type} />
                  <span className="ml-2 text-sm text-gray-900">{execution.type}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={execution.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {execution.startTime
                  ? new Date(execution.startTime).toLocaleString()
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onExecute?.(execution.id)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                  disabled={execution.status === 'running'}
                >
                  执行
                </button>
                <button
                  onClick={() => onDelete?.(execution.id, execution.name)}
                  className="text-red-600 hover:text-red-900"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
