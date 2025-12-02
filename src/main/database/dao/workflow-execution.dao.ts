// ============================================================================
// Workflow Execution DAO
// ============================================================================

import Database from 'better-sqlite3'
import type {
  WorkflowExecutionDto,
  CreateWorkflowExecutionDto,
  UpdateWorkflowExecutionDto
} from '../interfaces/dto'
import { mapWorkflowExecution } from '../mappers'

export class WorkflowExecutionDAO {
  constructor(private db: Database.Database) {}

  async getWorkflowExecutions(limit = 50, status?: string): Promise<WorkflowExecutionDto[]> {
    let query = 'SELECT * FROM workflow_executions WHERE 1=1'
    const params: unknown[] = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }
    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(limit)

    const stmt = this.db.prepare(query)
    const rows = stmt.all(...params)
    return rows.map(mapWorkflowExecution)
  }

  async getWorkflowExecutionById(id: number): Promise<WorkflowExecutionDto | null> {
    const stmt = this.db.prepare('SELECT * FROM workflow_executions WHERE id = ?')
    const row = stmt.get(id)
    return row ? mapWorkflowExecution(row) : null
  }

  async createWorkflowExecution(
    execution: CreateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    const stmt = this.db.prepare(`
      INSERT INTO workflow_executions (name, type, status, data_source_ids, template_id, start_time)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      execution.name,
      execution.type,
      execution.status || 'pending',
      execution.dataSourceIds,
      execution.templateId || null,
      execution.startTime || new Date()
    )
    return this.getWorkflowExecutionById(result.lastInsertRowid as number) as Promise<WorkflowExecutionDto>
  }

  async updateWorkflowExecution(
    id: number,
    updates: UpdateWorkflowExecutionDto
  ): Promise<WorkflowExecutionDto> {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
      if (updates.status === 'completed') {
        fields.push('end_time = ?')
        values.push(new Date())
      }
    }
    if (updates.dataSourceIds !== undefined) {
      fields.push('data_source_ids = ?')
      values.push(updates.dataSourceIds)
    }
    if (updates.templateId !== undefined) {
      fields.push('template_id = ?')
      values.push(updates.templateId)
    }

    if (fields.length === 0) {
      return this.getWorkflowExecutionById(id) as Promise<WorkflowExecutionDto>
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')

    const stmt = this.db.prepare(`
      UPDATE workflow_executions
      SET ${fields.join(', ')}
      WHERE id = ?
    `)
    stmt.run(...values, id)
    return this.getWorkflowExecutionById(id) as Promise<WorkflowExecutionDto>
  }

  async deleteWorkflowExecution(id: number): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM workflow_executions WHERE id = ?')
    stmt.run(id)
  }
}
