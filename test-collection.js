// 测试数据收集功能
const testCollection = async () => {
  console.log('🚀 开始测试数据收集功能...\n');

  try {
    // 模拟创建一个数据源
    console.log('📡 步骤 1: 创建数据源');
    console.log('   - 类型: Web Scraping (Firecrawl)');
    console.log('   - URL: https://news.ycombinator.com/');
    console.log('   - 限制: 10 项\n');

    // 模拟执行收集
    console.log('🔄 步骤 2: 执行数据收集');
    console.log('   - 正在从 Hacker News 抓取数据...');
    console.log('   - 解析页面结构...');
    console.log('   - 提取标题和内容...\n');

    // 模拟收集结果
    console.log('✅ 步骤 3: 收集完成 - 返回模拟数据\n');

    // 显示收集的内容
    console.log('📋 收集到的内容:');
    console.log('='.repeat(80));

    const mockItems = [
      {
        id: '1',
        source: 'Hacker News',
        title: 'OpenAI Releases GPT-5',
        content: `OpenAI has officially announced the release of their latest GPT-5 model, which features significant improvements in reasoning capabilities and multimodal understanding. The new model demonstrates unprecedented performance across various benchmarks, including a 40% improvement in complex reasoning tasks and enhanced ability to understand context across different modalities.

Key highlights:
- Advanced reasoning capabilities with chain-of-thought optimization
- Multimodal understanding (text, images, audio)
- 40% performance improvement on complex tasks
- Reduced computational costs by 30%
- Better alignment and safety measures

The model is available through OpenAI's API starting today, with pricing similar to GPT-4 but with improved performance.`,
        url: 'https://news.ycombinator.com/item?id=12345',
        author: 'user123',
        publishedAt: '2024-12-01 14:00:00',
        category: 'AI',
        tags: ['OpenAI', 'GPT-5', 'NLP'],
        status: 'new',
      },
      {
        id: '2',
        source: 'Hacker News',
        title: 'Show HN: My DIY Electric Bike Project',
        content: `After months of work, I've finally completed my electric bike build! Here are the specs:

🛠️ **Build Details:**
- Motor: 48V 1000W brushless hub motor
- Battery: 52V 20Ah lithium-ion pack (removable)
- Controller: Kelly KLS7230S (programmable)
- Display: Bafang C850 color LCD
- Brakes: Hydraulic disc brakes (180mm rotors)
- Frame: Custom aluminum frame with integrated battery mount

⚡ **Performance:**
- Top speed: 35 mph (56 km/h)
- Range: 50 miles (80 km) on throttle, 80+ miles with pedaling
- 0-20 mph: 3.2 seconds
- Climbing ability: Handles 15% grade hills no problem

💰 **Cost Breakdown:**
- Motor & controller: $450
- Battery pack: $350
- Frame & components: $280
- Miscellaneous (wiring, connectors, etc.): $120
- **Total: ~$1,200**

The bike is completely DIY and street-legal in my area. I've been using it for commuting for 2 weeks now and it's been amazing. The torque is incredible and the battery life is better than I expected.`,
        url: 'https://news.ycombinator.com/item?id=12346',
        author: 'bikemaker88',
        publishedAt: '2024-12-01 13:45:00',
        category: 'Hardware',
        tags: ['Show HN', 'DIY', 'Electric Bike'],
        status: 'new',
      },
      {
        id: '3',
        source: 'Hacker News',
        title: 'Ask HN: Best Resources to Learn Rust in 2024',
        content: `I'm a senior developer with 10 years of experience in Go and Python, looking to transition into systems programming with Rust. I'm particularly interested in embedded systems and high-performance applications.

What I'm looking for:
📚 **Books:** Comprehensive guides that explain concepts deeply
🎯 **Practice:** Hands-on projects that build real-world skills
🏃 **Fast-track:** Efficient learning path for experienced developers
🔧 **Tools:** Best IDE setup, debugging tools, testing frameworks

I've heard great things about:
- "The Rust Programming Language" (The Book)
- "Rust for Rustaceans"
- "Programming Rust" (O'Reilly)
- Rustlings exercises
- Exercism for Rust

Questions:
1. What's the best order to tackle these resources?
2. Are there any must-watch video courses?
3. What embedded Rust resources are best? (I'm particularly interested in STM32)
4. How long does it typically take to be productive in Rust coming from Go?
5. Any common pitfalls I should watch out for?

Would love to hear your experiences and recommendations!`,
        url: 'https://news.ycombinator.com/item?id=12348',
        author: 'learning_rust',
        publishedAt: '2024-12-01 13:15:00',
        category: 'Ask HN',
        tags: ['Ask HN', 'Rust', 'Learning'],
        status: 'new',
      },
      {
        id: '4',
        source: 'Hacker News',
        title: 'I Replaced My Entire Inbox with AI',
        content: `For the past 3 months, I've used an AI assistant to completely automate my email management. It's been transformative for my productivity.

🤖 **What the AI handles:**
- **Priority detection**: Automatically identifies important emails and flags them
- **Drafting responses**: Writes appropriate replies based on context and my preferences
- **Routine emails**: Handles newsletters, notifications, and subscription emails
- **Meeting scheduling**: Coordinates with my calendar and preferences
- **Follow-ups**: Reminds me about pending emails and deadlines

📊 **Results:**
- Email processing time: 4 hours/day → 30 minutes/day (87% reduction)
- Response time: From 2-3 hours average to under 15 minutes
- Stress level: Significantly reduced (no more email anxiety!)
- Missed emails: Down to almost zero
- Team satisfaction: 94% positive feedback on email quality

🛠️ **How it works:**
- Trained on my email history (last 2 years)
- Integrated with my calendar and task manager
- Uses my past responses as training data
- Respects my communication style and preferences
- Has access to my company's knowledge base

⚠️ **Challenges:**
- Initial setup took about 2 weeks
- Had to carefully define my preferences for different email types
- Some emails still need my personal touch (customer escalations, etc.)
- Had to establish trust with my team

💰 **Cost:** About $50/month (less than the value of 3 hours saved daily)

Would love to hear if others have tried similar approaches! AMA.`,
        url: 'https://news.ycombinator.com/item?id=12350',
        author: 'ai_productivity',
        publishedAt: '2024-12-01 11:30:00',
        category: 'AI',
        tags: ['AI', 'Productivity', 'Email'],
        status: 'new',
      },
      {
        id: '5',
        source: 'Hacker News',
        title: 'Show HN: AI-Powered Code Review Tool',
        content: `I built an AI-powered code review tool that automatically analyzes pull requests and provides intelligent feedback. It's trained on 10M+ code reviews from GitHub and provides feedback on:

🔍 **What it catches:**
- Security vulnerabilities (SQL injection, XSS, auth issues)
- Performance problems (N+1 queries, inefficient loops)
- Code quality (complexity, maintainability, DRY violations)
- Style issues (naming conventions, formatting)
- Testing gaps (missing test coverage, poor test quality)
- Documentation (missing docstrings, unclear comments)

✨ **Features:**
- Integrates with GitHub, GitLab, and Bitbucket
- Supports 15+ programming languages
- Customizable rules and thresholds
- CI/CD integration (GitHub Actions, Jenkins, etc.)
- Interactive suggestions with code examples
- Security vulnerability database integration
- Performance benchmarking suggestions

📊 **Benchmarks:**
- Detects 94% of security issues (validated on 10K PRs)
- Reduces review time by average 40%
- Catches bugs before they're merged (production-ready)
- False positive rate: < 5%

💡 **Real Examples:**
- "This SQL query is vulnerable to injection. Use parameterized queries instead."
- "Consider using async/await here to improve I/O performance."
- "This function has complexity score of 23. Consider breaking it down."
- "Missing test coverage for edge cases: empty input, null values, etc."

🎓 **Training Data:**
- 10M+ public code reviews from GitHub
- Security vulnerability databases (CVE, Snyk)
- Performance profiling data
- Code quality metrics from SonarQube

🚀 **Pricing:**
- Open source projects: Free
- Startups (50 engineers): $200/month
- Enterprise: Custom pricing

The tool has already been adopted by 50+ companies and has reviewed over 1M lines of code. Free tier is perfect for open source and small teams!`,
        url: 'https://news.ycombinator.com/item?id=12349',
        author: 'aidev2024',
        publishedAt: '2024-12-01 13:00:00',
        category: 'AI',
        tags: ['Show HN', 'AI', 'Code Review'],
        status: 'processed',
      },
    ];

    mockItems.forEach((item, index) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📄 项目 #${index + 1}`);
      console.log(`=${'='.repeat(80)}`);
      console.log(`\n🏷️  标题: ${item.title}`);
      console.log(`📡 来源: ${item.source}`);
      console.log(`👤 作者: ${item.author}`);
      console.log(`📅 发布时间: ${item.publishedAt}`);
      console.log(`🏷️  分类: ${item.category}`);
      console.log(`🏷️  标签: ${item.tags.join(', ')}`);
      console.log(`📊 状态: ${item.status}`);
      console.log(`🔗 链接: ${item.url}`);
      console.log(`\n📝 内容:\n${item.content}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ 数据收集测试完成!');
    console.log(`📊 总计收集: ${mockItems.length} 项`);
    console.log(`📈 新项目: ${mockItems.filter(i => i.status === 'new').length}`);
    console.log(`📦 已处理: ${mockItems.filter(i => i.status === 'processed').length}`);
    console.log('='.repeat(80));

    return mockItems;
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 运行测试
testCollection();
