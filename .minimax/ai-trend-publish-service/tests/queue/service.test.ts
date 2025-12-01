import { QueueService } from '../../src/queue/service.js'

describe('QueueService', () => {
  let queueService: QueueService

  beforeAll(() => {
    queueService = QueueService.getInstance()
  })

  it('should be a singleton', () => {
    const instance2 = QueueService.getInstance()
    expect(queueService).toBe(instance2)
  })

  it('should have default job options', () => {
    expect(queueService).toBeDefined()
  })
})
