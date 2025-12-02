# Settings Page Implementation Guide

**Date:** 2025-12-01
**Status:** ✅ Complete
**Route:** `/settings`

## Overview

A comprehensive Settings page has been added to manage all service configurations for the production environment. The page provides a user-friendly interface to configure database, queue, scheduler, and API settings.

## Features

The Settings page includes **8 comprehensive configuration sections**:

### 1. **Basic Service Configuration**
- **SERVER_API_KEY**: Main server API key for authentication

### 2. **LLM Service Configuration**
Configure multiple LLM providers:
- **DEFAULT_LLM_PROVIDER**: Choose default LLM provider (OPENAI, DEEPSEEK, QWEN, XUNFEI, CUSTOM)
- **OpenAI**: BASE_URL, API_KEY, MODEL
- **DeepSeek**: BASE_URL, API_KEY, MODEL (deepseek-chat, deepseek-reasoner)
- **Qwen (Tongyi)**: BASE_URL, API_KEY, MODEL (qwen-max)
- **Xunfei**: API_KEY
- **Custom LLM**: BASE_URL, API_KEY, MODEL (OpenAI compatible)
- **DASHSCOPE_API_KEY**: Alibaba Cloud DashScope API key

### 3. **Module Function Configuration**
Configure AI modules and features:
- **AI_CONTENT_RANKER_LLM_PROVIDER**: LLM provider for content ranking
- **AI_SUMMARIZER_LLM_PROVIDER**: LLM provider for content summarization
- **ARTICLE_TEMPLATE_TYPE**: Article template (default, modern, tech, mianpro, random)
- **HELLOGITHUB_TEMPLATE_TYPE**: HelloGitHub template (default, weixin, random)
- **AIBENCH_TEMPLATE_TYPE**: AIBench template (default, random)
- **ENABLE_DEDUPLICATION**: Enable content deduplication (true/false)
- **DASHSCOPE_EMBEDDING_BASE_URL**: DashScope embedding API base URL
- **DASHSCOPE_EMBEDDING_API_KEY**: DashScope embedding API key
- **DASHSCOPE_EMBEDDING_MODEL**: Embedding model name (text-embedding-v3)

### 4. **Publishing Configuration**
Configure publishing schedules:
- **1_of_week_workflow**: Monday workflow (e.g., weixin-article-workflow)
- **2_of_week_workflow**: Tuesday workflow (e.g., weixin-aibench-workflow)
- **3_of_week_workflow**: Wednesday workflow (e.g., weixin-hellogithub-workflow)
- **ARTICLE_NUM**: Number of articles to generate

### 5. **Data Storage Configuration**
Configure database storage:
- **ENABLE_DB**: Enable database storage (true/false)
- **DB_HOST**: Database server hostname
- **DB_PORT**: Database server port
- **DB_USER**: Database username
- **DB_PASSWORD**: Database password
- **DB_DATABASE**: Database name (e.g., trendfinder)

### 6. **WeChat Configuration**
Configure WeChat publishing:
- **WEIXIN_APP_ID**: WeChat official account app ID
- **WEIXIN_APP_SECRET**: WeChat official account app secret
- **NEED_OPEN_COMMENT**: Open comments for articles (true/false)
- **ONLY_FANS_CAN_COMMENT**: Only fans can comment (true/false)
- **AUTHOR**: Default author name for articles

### 7. **Data Collection Configuration**
Configure data collection services:
- **FIRE_CRAWL_API_KEY**: FireCrawl API key for web crawling
- **JINA_API_KEY**: Jina AI API key for reader and embedding
- **X_API_BEARER_TOKEN**: Twitter/X API v2 Bearer Token

### 8. **Notification Configuration**
Configure notification services:
- **ENABLE_BARK**: Enable Bark iOS notifications (true/false)
- **BARK_URL**: Bark notification URL/key
- **ENABLE_DINGDING**: Enable DingTalk notifications (true/false)
- **DINGDING_WEBHOOK**: DingTalk robot webhook URL
- **ENABLE_FEISHU**: Enable Feishu notifications (true/false)
- **FEISHU_WEBHOOK_URL**: Feishu bot webhook URL

## Technical Implementation

### Files Created/Modified

1. **Frontend Components:**
   - `src/renderer/src/components/ai-trend-publish/Settings.tsx` - Settings page component
   - `src/renderer/src/App.tsx` - Added Settings route and navigation

2. **Backend API:**
   - `src/main/services/ai-trend-publish/index.ts` - Added config methods
   - `src/main/index.ts` - Added config IPC handlers
   - `src/preload/ai-trend-publish/index.ts` - Exposed config API
   - `src/preload/index.d.ts` - Added config type definitions

### API Methods

**Renderer (Frontend):**
```typescript
window.aiTrendPublish.config.get(key: string): Promise<string | null>
window.aiTrendPublish.config.set(key: string, value: string, description?: string): Promise<{ success: boolean }>
window.aiTrendPublish.config.delete(key: string): Promise<{ success: boolean }>
```

**Main Process (Backend):**
```typescript
aiTrendPublishService.getConfig(key: string): Promise<string | null>
aiTrendPublishService.setConfig(key: string, value: string, description?: string): Promise<void>
aiTrendPublishService.deleteConfig(key: string): Promise<void>
```

**IPC Channels:**
- `config:get` - Retrieve configuration value
- `config:set` - Save configuration value
- `config:delete` - Delete configuration value

## How to Use in Production

### Step 1: Access Settings
1. Launch the application
2. Click on **"Settings"** in the navigation bar

### Step 2: Configure Services

1. **Basic Service Configuration** (required)
   - Set SERVER_API_KEY for authentication

2. **LLM Service Configuration** (required for AI features)
   - Choose DEFAULT_LLM_PROVIDER (OPENAI, DEEPSEEK, QWEN, XUNFEI, or CUSTOM)
   - Configure selected provider's BASE_URL, API_KEY, and MODEL
   - Configure all providers you plan to use

3. **Module Function Configuration** (optional)
   - Set LLM providers for content ranking and summarization
   - Choose article template types
   - Enable/disable deduplication
   - Configure DashScope embedding settings

4. **Publishing Configuration** (optional)
   - Set weekly workflow schedules
   - Configure article generation count

5. **Data Storage Configuration** (required for data persistence)
   - Set ENABLE_DB to true
   - Configure database connection details (HOST, PORT, USER, PASSWORD, DATABASE)

6. **WeChat Configuration** (required for WeChat publishing)
   - Set WEIXIN_APP_ID and WEIXIN_APP_SECRET
   - Configure comment settings
   - Set default author name

7. **Data Collection Configuration** (optional)
   - Add API keys for FireCrawl, Jina AI, and Twitter/X

8. **Notification Configuration** (optional)
   - Enable notification services (Bark, DingTalk, Feishu)
   - Set webhook URLs for each service

### Step 3: Save Configuration
1. Click **"Save [Service Name]"** button for each section
2. Wait for the success confirmation
3. Changes take effect immediately

### Step 4: Restart (if needed)
Some services may require a restart to apply all changes.

## Storage

All configurations are stored in the database's `config` table:
- **Key**: Configuration key (e.g., `DB_TYPE`, `REDIS_HOST`)
- **Value**: Configuration value
- **Description**: Optional description

## Security Notes

1. **Password Fields**: All password fields are masked in the UI
2. **Immediate Effect**: Configuration changes take effect immediately after saving
3. **Environment Variables**: For production, consider using environment variables for sensitive data
4. **Validation**: Required fields are validated before saving

## Environment Variable Priority

Configuration priority in production:
1. **Environment Variables** (highest priority)
2. **Settings Page** (saved in database)
3. **Default Values** (fallback)

## Troubleshooting

### Issue: "Cannot read properties of undefined (reading 'get')"
**Solution**: Restart the application after the initial setup to ensure all IPC handlers are registered.

### Issue: Configuration not persisting
**Solution**: Check database connection and ensure the `config` table exists.

### Issue: API keys not working
**Solution**: Verify API keys are valid and services are restarted after configuration.

## Development Commands

```bash
# Start development server
pnpm dev

# Run type checking
pnpm typecheck

# Build for production
pnpm build
```

## Screenshots Description

**Settings Page Layout:**
- Header with "Settings" title and Refresh button
- Four cards, each representing a service configuration
- Each card contains:
  - Service icon and title
  - Description
  - Form fields with labels and descriptions
  - Save button at the bottom
- Configuration notes card at the bottom

**Form Elements:**
- Text inputs for URLs, paths, and non-sensitive data
- Password inputs for API keys (masked)
- Select dropdowns for boolean options
- Textarea for multi-line configuration
- Required field indicators (*)

## Future Enhancements

Potential improvements:
1. Export/Import configuration settings
2. Configuration presets for different environments
3. Validation of configuration values before saving
4. Health check for configured services
5. Configuration change history

## Support

For issues or questions about the Settings page:
1. Check the console for error messages
2. Verify database connectivity
3. Ensure all required services are running
4. Restart the application after configuration changes

---

**Implementation Date:** 2025-12-01
**Last Updated:** 2025-12-01
**Version:** 1.0.0
