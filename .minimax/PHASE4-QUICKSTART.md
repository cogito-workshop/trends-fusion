# Phase 4 Quick Start Guide

**Scheduling & Job Queue are now live!** 🎉

## What You Can Do Now

### 1. Check Queue Status

```bash
curl http://127.0.0.1:8000/api/queue/stats
```

Response:
```json
{
  "workflows": {
    "waiting": 0,
    "active": 0,
    "completed": 15,
    "failed": 2,
    "delayed": 0
  }
}
```

### 2. Add Job to Queue

```bash
curl -X POST http://127.0.0.1:8000/api/queue/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "workflowType": "weixin-article",
    "sources": ["twitter:OpenAIDevs"],
    "params": { "limit": 20 },
    "options": {
      "attempts": 3,
      "delay": 0
    }
  }'
```

Response:
```json
{
  "success": true,
  "jobId": "job-1701234567890-abc123",
  "message": "Job added to queue"
}
```

### 3. Check Job Status

```bash
curl http://127.0.0.1:8000/api/queue/jobs/job-1701234567890-abc123
```

Response:
```json
{
  "jobId": "job-1701234567890-abc123",
  "status": "completed",
  "progress": 100,
  "result": {
    "jobId": "job-xyz",
    "workflowId": "uuid-123"
  },
  "created": 1701234567890,
  "finished": 1701234571390,
  "attempts": 1,
  "data": {
    "type": "workflow",
    "payload": {
      "workflowType": "weixin-article",
      "sources": ["twitter:OpenAIDevs"]
    }
  }
}
```

### 4. List Scheduled Jobs

```bash
curl http://127.0.0.1:8000/api/scheduler/jobs
```

Response:
```json
{
  "jobs": [
    {
      "name": "daily-weixin-article",
      "schedule": "0 3 * * *",
      "workflowType": "weixin-article",
      "sources": ["twitter:OpenAIDevs"],
      "params": { "limit": 20 },
      "timezone": "Asia/Shanghai",
      "enabled": true,
      "status": "running"
    },
    {
      "name": "monday-weixin-aibench",
      "schedule": "0 3 * * 1",
      "workflowType": "weixin-aibench",
      "sources": ["firecrawl:https://news.ycombinator.com/"],
      "status": "running"
    },
    {
      "name": "sunday-weixin-hellogithub",
      "schedule": "0 3 * * 0",
      "workflowType": "weixin-hellogithub",
      "sources": ["firecrawl:https://news.ycombinator.com/"],
      "status": "running"
    }
  ],
  "total": 3,
  "running": 3
}
```

### 5. Execute Scheduled Job Manually

```bash
curl -X POST http://127.0.0.1:8000/api/scheduler/jobs/daily-weixin-article/execute
```

Response:
```json
{
  "success": true,
  "message": "Scheduled job executed",
  "jobName": "daily-weixin-article"
}
```

### 6. Add Custom Scheduled Job

```bash
curl -X POST http://127.0.0.1:8000/api/scheduler/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "morning-article",
    "schedule": "0 9 * * *",
    "workflowType": "weixin-article",
    "sources": ["twitter:OpenAIDevs", "firecrawl:https://news.ycombinator.com/"],
    "params": { "limit": 30 },
    "enabled": true,
    "timezone": "Asia/Shanghai"
  }'
```

### 7. List Queue Jobs by Status

```bash
# Waiting jobs
curl http://127.0.0.1:8000/api/queue/jobs?status=waiting

# Active jobs
curl http://127.0.0.1:8000/api/queue/jobs?status=active

# Completed jobs
curl http://127.0.0.1:8000/api/queue/jobs?status=completed

# Failed jobs
curl http://127.0.0.1:8000/api/queue/jobs?status=failed
```

### 8. Pause and Resume Queue

```bash
# Pause queue
curl -X POST http://127.0.0.1:8000/api/queue/pause

# Resume queue
curl -X POST http://127.0.0.1:8000/api/queue/resume
```

### 9. Clean Stale Jobs

```bash
curl -X POST http://127.0.0.1:8000/api/queue/cleanup
```

## Using in Code

### Queue Service

```typescript
import { queueService } from './queue/index.js'

async function queueWorkflow() {
  const jobId = await queueService.addWorkflowJob(
    'weixin-article',
    ['twitter:OpenAIDevs', 'firecrawl:https://news.ycombinator.com/'],
    { limit: 20 }
  )

  console.log('Job queued:', jobId)

  // Check status
  setTimeout(async () => {
    const status = await queueService.getJobStatus(jobId)
    console.log('Status:', status)
  }, 5000)
}

queueWorkflow()
```

### Cron Scheduler

```typescript
import { cronScheduler } from './scheduler/index.js'

async function manageCron() {
  // Add custom job
  cronScheduler.addJob({
    name: 'custom-daily',
    schedule: '0 6 * * *',
    workflowType: 'weixin-aibench',
    sources: ['firecrawl:https://news.ycombinator.com/'],
    enabled: true,
  })

  // Update job
  cronScheduler.updateJob('custom-daily', { enabled: false })

  // Remove job
  cronScheduler.removeJob('custom-daily')

  // Get all jobs
  const jobs = cronScheduler.getAllJobs()
  console.log(jobs)
}

manageCron()
```

### Notification Manager

```typescript
import { notificationManager } from './notifications/index.js'

async function sendNotifications() {
  await notificationManager.sendSuccess(
    'Workflow Complete',
    'Daily WeChat article generated successfully',
    { jobId: 'job-123', workflow: 'weixin-article' }
  )

  await notificationManager.sendWarning(
    'Workflow Slow',
    'Workflow taking longer than expected',
    { jobId: 'job-456', duration: 30000 }
  )

  await notificationManager.sendError(
    'Workflow Failed',
    'Failed to generate content: API timeout',
    { jobId: 'job-789', error: 'timeout', attempts: 3 }
  )
}

sendNotifications()
```

## Default Scheduled Jobs

| Job Name | Schedule | Timezone | Workflow | Sources | Description |
|----------|----------|----------|----------|---------|-------------|
| daily-weixin-article | `0 3 * * *` | Asia/Shanghai | WeixinArticle | Twitter:OpenAIDevs | Daily AI trends |
| monday-weixin-aibench | `0 3 * * 1` | Asia/Shanghai | WeixinAIBench | Firecrawl | Weekly AI benchmarks |
| sunday-weixin-hellogithub | `0 3 * * 0` | Asia/Shanghai | WeixinHelloGithub | Firecrawl | Weekly GitHub curation |

## Retry Mechanism

### Default Configuration
```typescript
{
  attempts: 3,                    // Retry 3 times
  backoff: {
    type: 'exponential',          // Exponential backoff
    delay: 5000,                  // Start at 5 seconds
  },
  removeOnComplete: 10,           // Keep 10 completed jobs
  removeOnFail: 5,                // Keep 5 failed jobs
}
```

### Retry Timeline
```
Attempt 1:  Immediate
Attempt 2:  After 5 seconds
Attempt 3:  After 10 seconds
Final:      Mark as failed
```

## Notification Providers

### Bark (iOS/macOS)
```typescript
// Environment
BARK_DEVICE_KEY=your-device-key
BARK_SERVER=https://api.day.app  // Optional

// Usage
await notificationManager.sendSuccess('Title', 'Message')
```

### DingTalk (Alibaba)
```typescript
// Environment
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx

// Usage
await notificationManager.sendInfo('Title', 'Message')
```

### Feishu (Lark)
```typescript
// Environment
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

// Usage
await notificationManager.sendWarning('Title', 'Message')
```

## Environment Setup

### 1. Install Dependencies
```bash
cd .minimax/ai-trend-publish-service
pnpm install
```

### 2. Configure Redis (Required)
```bash
# Install Redis or use Docker
docker run -d -p 6379:6379 redis:alpine

# Update .env
cp .env.example .env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Configure Notifications (Optional)
```bash
# Bark (iOS)
BARK_DEVICE_KEY=your-device-key

# DingTalk
DINGTALK_WEBHOOK=https://oapi.dingtalk.com/robot/send?access_token=xxx

# Feishu
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

### 4. Start Service
```bash
pnpm dev
```

### 5. Test Queue and Scheduler
```bash
# Add job to queue
curl -X POST http://127.0.0.1:8000/api/queue/jobs \
  -H 'Content-Type: application/json' \
  -d '{"workflowType":"weixin-article","sources":["twitter:OpenAIDevs"]}'

# Check queue stats
curl http://127.0.0.1:8000/api/queue/stats

# List scheduled jobs
curl http://127.0.0.1:8000/api/scheduler/jobs
```

## API Endpoints Summary

### Queue
- `GET /api/queue/stats` - Queue statistics
- `POST /api/queue/jobs` - Add job
- `GET /api/queue/jobs` - List jobs
- `GET /api/queue/jobs/:jobId` - Job details
- `POST /api/queue/cleanup` - Clean jobs
- `POST /api/queue/pause` - Pause
- `POST /api/queue/resume` - Resume

### Scheduler
- `GET /api/scheduler/jobs` - List jobs
- `POST /api/scheduler/jobs` - Add job
- `PUT /api/scheduler/jobs/:name` - Update job
- `DELETE /api/scheduler/jobs/:name` - Remove job
- `POST /api/scheduler/jobs/:name/execute` - Execute now
- `POST /api/scheduler/start` - Start all
- `POST /api/scheduler/stop` - Stop all

## Cron Schedule Format

```
# Format: second minute hour day month weekday
# Examples:
0 0 9 * * *         # Every day at 9:00 AM
0 0 9 * * 1-5       # Weekdays at 9:00 AM
0 0 9 1 * *         # First day of month at 9:00 AM
0 0 9 * * 0         # Every Sunday at 9:00 AM
```

## Production Deployment

### 1. Redis Setup
```bash
# Use managed Redis (AWS ElastiCache, etc.)
# Or self-hosted with persistence
docker run -d -p 6379:6379 redis:alpine redis-server --appendonly yes
```

### 2. Monitoring
```bash
# Check queue stats regularly
curl http://127.0.0.1:8000/api/queue/stats

# Monitor failed jobs
curl http://127.0.0.1:8000/api/queue/jobs?status=failed

# Check scheduled jobs
curl http://127.0.0.1:8000/api/scheduler/jobs
```

### 3. Health Checks
```bash
# Service health
curl http://127.0.0.1:8000/api/health

# Queue health
curl http://127.0.0.1:8000/api/queue/stats
```

## Troubleshooting

### Redis Connection Error
```bash
# Check Redis status
redis-cli ping

# Check connection
telnet 127.0.0.1 6379
```

### Jobs Not Processing
```bash
# Check queue status
curl http://127.0.0.1:8000/api/queue/stats

# Pause and resume
curl -X POST http://127.0.0.1:8000/api/queue/pause
curl -X POST http://127.0.0.1:8000/api/queue/resume
```

### Cron Jobs Not Running
```bash
# Check timezone
date

# Check scheduled jobs
curl http://127.0.0.1:8000/api/scheduler/jobs

# Restart scheduler
curl -X POST http://127.0.0.1:8000/api/scheduler/stop
curl -X POST http://127.0.0.1:8000/api/scheduler/start
```

## Next Steps

1. **Monitor queue** with health checks
2. **Configure notifications** for your platforms
3. **Customize schedules** for your needs
4. **Test job execution** and retries
5. **Integrate with Electron** UI (Phase 5)

---

**Phase 4 Complete!** Automated scheduling, job queues, and notifications are ready! 🚀
