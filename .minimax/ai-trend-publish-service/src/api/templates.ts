import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { databaseManager } from '../database/index.js'
import { logger } from '../utils/logger.js'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  style: z.string().min(1),
  content: z.string().min(1),
  categoryId: z.number().optional(),
  version: z.number().optional(),
  isActive: z.boolean().optional(),
})

const updateTemplateSchema = createTemplateSchema.partial()

export async function templatesRoutes(server: FastifyInstance) {
  server.get('/api/templates', async (request, reply) => {
    try {
      const db = databaseManager.getService()
      const templates = await db.getTemplates()

      return reply.send({
        templates,
        total: templates.length,
      })
    } catch (error) {
      logger.error({
        msg: 'Error fetching templates',
        error: error instanceof Error ? error.message : String(error),
      })

      return reply.status(500).send({
        error: 'Failed to fetch templates',
      })
    }
  })

  server.post('/api/templates', async (request, reply) => {
    try {
      const validated = createTemplateSchema.parse(request.body)
      const db = databaseManager.getService()

      const template = await db.createTemplate({
        ...validated,
        isActive: validated.isActive !== undefined ? validated.isActive : true,
      })

      // Create initial version
      await db.createTemplateVersion({
        templateId: template.id!,
        version: template.version || 1,
        content: template.content,
        changelog: 'Initial version',
      })

      return reply.status(201).send({
        template,
        message: 'Template created successfully',
      })
    } catch (error) {
      logger.error({
        msg: 'Error creating template',
        error: error instanceof Error ? error.message : String(error),
      })

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        })
      }

      return reply.status(500).send({
        error: 'Failed to create template',
      })
    }
  })

  server.put('/api/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const validated = updateTemplateSchema.parse(request.body)
      const db = databaseManager.getService()

      const template = await db.updateTemplate(Number(id), validated)

      return reply.send({
        template,
        message: 'Template updated successfully',
      })
    } catch (error) {
      logger.error({
        msg: 'Error updating template',
        error: error instanceof Error ? error.message : String(error),
      })

      return reply.status(500).send({
        error: 'Failed to update template',
      })
    }
  })

  server.delete('/api/templates/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const db = databaseManager.getService()

      await db.deleteTemplate(Number(id))

      return reply.send({
        message: 'Template deleted successfully',
      })
    } catch (error) {
      logger.error({
        msg: 'Error deleting template',
        error: error instanceof Error ? error.message : String(error),
      })

      return reply.status(500).send({
        error: 'Failed to delete template',
      })
    }
  })
}
