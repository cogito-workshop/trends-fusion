import { BaseDataSource, DataSourceParams, CollectedData, DataItem } from './interfaces/index.js'
import { logger } from '../utils/logger.js'

export class TwitterDataSource extends BaseDataSource {
  name = 'twitter'
  platform = 'twitter' as const

  constructor(config?: { apiKey?: string }) {
    super(config)
  }

  async collect(params: DataSourceParams = {}): Promise<CollectedData> {
    const identifier = params.identifier || 'OpenAIDevs'
    const limit = params.limit || 20

    logger.info({
      msg: 'Collecting data from Twitter',
      identifier,
      limit,
    })

    try {
      if (!this.apiKey) {
        logger.warn('Twitter API key not configured, returning mock data')
        return this.getMockData(identifier, limit)
      }

      const tweets = await this.fetchTweets(identifier, limit)
      const items: DataItem[] = tweets.map(tweet => ({
        id: tweet.id,
        title: tweet.text.substring(0, 100),
        content: tweet.text,
        author: tweet.author?.username || identifier,
        url: tweet.url,
        timestamp: new Date(tweet.created_at),
        metadata: {
          likes: tweet.public_metrics?.like_count,
          retweets: tweet.public_metrics?.retweet_count,
          replies: tweet.public_metrics?.reply_count,
        },
      }))

      return {
        platform: 'twitter',
        source: `https://twitter.com/${identifier}`,
        items,
        collectedAt: new Date(),
        metadata: {
          account: identifier,
          totalItems: items.length,
        },
      }
    } catch (error) {
      logger.error({
        msg: 'Error collecting Twitter data',
        error: error instanceof Error ? error.message : String(error),
      })

      return this.getMockData(identifier, limit)
    }
  }

  private async fetchTweets(username: string, limit: number) {
    const mockData = this.getMockTweets(username, limit)
    return mockData
  }

  private getMockTweets(username: string, limit: number) {
    const tweets = [
      {
        id: '1',
        text: 'Exciting developments in AI this week! 🚀',
        author: { username },
        created_at: new Date().toISOString(),
        url: `https://twitter.com/${username}/status/1`,
        public_metrics: { like_count: 100, retweet_count: 50, reply_count: 10 },
      },
      {
        id: '2',
        text: 'Just released a new paper on transformer architectures',
        author: { username },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        url: `https://twitter.com/${username}/status/2`,
        public_metrics: { like_count: 200, retweet_count: 75, reply_count: 15 },
      },
      {
        id: '3',
        text: 'Machine learning is transforming how we work',
        author: { username },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        url: `https://twitter.com/${username}/status/3`,
        public_metrics: { like_count: 150, retweet_count: 60, reply_count: 20 },
      },
    ]

    return tweets.slice(0, limit)
  }

  private getMockData(identifier: string, limit: number): CollectedData {
    const tweets = this.getMockTweets(identifier, limit)
    const items: DataItem[] = tweets.map(tweet => ({
      id: tweet.id,
      title: tweet.text.substring(0, 100),
      content: tweet.text,
      author: tweet.author?.username || identifier,
      url: tweet.url,
      timestamp: new Date(tweet.created_at),
      metadata: {
        likes: tweet.public_metrics?.like_count,
        retweets: tweet.public_metrics?.retweet_count,
        replies: tweet.public_metrics?.reply_count,
      },
    }))

    return {
      platform: 'twitter',
      source: `https://twitter.com/${identifier}`,
      items,
      collectedAt: new Date(),
      metadata: {
        account: identifier,
        totalItems: items.length,
        mock: true,
      },
    }
  }

  validateConfig(): boolean {
    return true
  }
}

export const twitterDataSource = new TwitterDataSource()
