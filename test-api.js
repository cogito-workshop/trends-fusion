// Test script to verify ai-trend-publish service integration
const { app, BrowserWindow } = require('electron')
const path = require('path')

async function testAPI() {
  let mainWindow

  // Create a test window to access the API
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
  })

  // Load the app
  await mainWindow.loadURL('http://localhost:5173/')

  // Wait for the app to be ready
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    // Test 1: Check if API is available
    const apiAvailable = await mainWindow.webContents.executeJavaScript(
      'window.aiTrendPublish !== undefined'
    )
    console.log('✅ API Available:', apiAvailable)

    if (apiAvailable) {
      // Test 2: Get templates
      console.log('\n📋 Testing Templates API...')
      try {
        const templates = await mainWindow.webContents.executeJavaScript(
          'window.aiTrendPublish.templates.list()'
        )
        console.log('✅ Templates fetched:', templates?.length || 0, 'items')
      } catch (error) {
        console.log('⚠️ Templates API error:', error.message)
      }

      // Test 3: Get data sources
      console.log('\n🗃️ Testing Data Sources API...')
      try {
        const dataSources = await mainWindow.webContents.executeJavaScript(
          'window.aiTrendPublish.dataSources.list()'
        )
        console.log('✅ Data Sources fetched:', dataSources?.length || 0, 'items')
      } catch (error) {
        console.log('⚠️ Data Sources API error:', error.message)
      }

      // Test 4: Get workflow executions
      console.log('\n⚡ Testing Workflow Executions API...')
      try {
        const executions = await mainWindow.webContents.executeJavaScript(
          'window.aiTrendPublish.workflowExecutions.list()'
        )
        console.log('✅ Workflow Executions fetched:', executions?.length || 0, 'items')
      } catch (error) {
        console.log('⚠️ Workflow Executions API error:', error.message)
      }

      // Test 5: Health check
      console.log('\n❤️  Testing Health Check API...')
      try {
        const health = await mainWindow.webContents.executeJavaScript(
          'window.aiTrendPublish.health.check()'
        )
        console.log('✅ Health status:', health?.status || 'unknown')
      } catch (error) {
        console.log('⚠️ Health Check API error:', error.message)
      }
    }

    console.log('\n🎉 API Testing Complete!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    if (mainWindow) {
      mainWindow.close()
    }
    app.quit()
  }
}

// Run the test
testAPI()
