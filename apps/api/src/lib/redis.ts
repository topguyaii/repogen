import Redis from 'ioredis'

// Redis client singleton
let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 100, 3000)
      },
    })

    redis.on('error', (err) => {
      console.error('Redis error:', err)
    })
  }
  return redis
}

// For testing - create a mock Redis that works in-memory
export class MockRedis {
  private store: Map<string, string> = new Map()
  private lists: Map<string, string[]> = new Map()
  private expiry: Map<string, number> = new Map()

  async get(key: string): Promise<string | null> {
    this.checkExpiry(key)
    return this.store.get(key) || null
  }

  async set(key: string, value: string, ...args: (string | number)[]): Promise<'OK'> {
    this.store.set(key, value)

    // Handle EX option for expiry
    const exIndex = args.findIndex(a => a === 'EX')
    if (exIndex !== -1 && args[exIndex + 1]) {
      const seconds = Number(args[exIndex + 1])
      this.expiry.set(key, Date.now() + seconds * 1000)
    }

    return 'OK'
  }

  async incrbyfloat(key: string, increment: number): Promise<string> {
    this.checkExpiry(key)
    const current = parseFloat(this.store.get(key) || '0')
    const newValue = current + increment
    this.store.set(key, newValue.toString())
    return newValue.toString()
  }

  async del(key: string): Promise<number> {
    const existed = this.store.has(key)
    this.store.delete(key)
    this.expiry.delete(key)
    return existed ? 1 : 0
  }

  async exists(key: string): Promise<number> {
    this.checkExpiry(key)
    return this.store.has(key) ? 1 : 0
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key)) return 0
    this.expiry.set(key, Date.now() + seconds * 1000)
    return 1
  }

  async ttl(key: string): Promise<number> {
    const exp = this.expiry.get(key)
    if (!exp) return -1
    const remaining = Math.ceil((exp - Date.now()) / 1000)
    return remaining > 0 ? remaining : -2
  }

  private checkExpiry(key: string): void {
    const exp = this.expiry.get(key)
    if (exp && Date.now() > exp) {
      this.store.delete(key)
      this.expiry.delete(key)
    }
  }

  // Lua script simulation for atomic budget operations
  async eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown> {
    // Simple implementation for our specific budget script
    if (script.includes('budget:check_and_reserve')) {
      return this.budgetCheckAndReserve(args)
    }
    if (script.includes('budget:deduct')) {
      return this.budgetDeduct(args)
    }
    if (script.includes('budget:release')) {
      return this.budgetRelease(args)
    }
    throw new Error('Unknown script')
  }

  private async budgetCheckAndReserve(args: (string | number)[]): Promise<[number, string, number, number]> {
    const [dailyKey, totalKey, dailyLimit, totalLimit, reserveAmount] = args as [string, string, string, string, string]

    const dailySpent = parseFloat(await this.get(dailyKey) || '0')
    const totalSpent = parseFloat(await this.get(totalKey) || '0')
    const daily = parseFloat(dailyLimit)
    const total = parseFloat(totalLimit)
    const reserve = parseFloat(reserveAmount)

    // Check limits
    if (daily > 0 && dailySpent + reserve > daily) {
      return [0, 'daily_limit_exceeded', dailySpent, totalSpent]
    }
    if (total > 0 && totalSpent + reserve > total) {
      return [0, 'total_limit_exceeded', dailySpent, totalSpent]
    }

    // Reserve the amount
    await this.incrbyfloat(dailyKey, reserve)
    await this.incrbyfloat(totalKey, reserve)

    return [1, 'ok', dailySpent + reserve, totalSpent + reserve]
  }

  private async budgetDeduct(args: (string | number)[]): Promise<number> {
    // Args: dailyKey, totalKey, diff (already calculated in service.ts)
    const [dailyKey, totalKey, diff] = args as [string, string, string]
    const diffNum = parseFloat(diff)

    // Adjust for actual usage
    if (diffNum !== 0) {
      await this.incrbyfloat(dailyKey, -diffNum)
      await this.incrbyfloat(totalKey, -diffNum)
    }

    return 1
  }

  private async budgetRelease(args: (string | number)[]): Promise<number> {
    const [dailyKey, totalKey, amount] = args as [string, string, string]
    const release = parseFloat(amount)

    await this.incrbyfloat(dailyKey, -release)
    await this.incrbyfloat(totalKey, -release)

    return 1
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || []
    list.unshift(...values)
    this.lists.set(key, list)
    return list.length
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || []
    // Redis uses -1 for last element
    const end = stop < 0 ? list.length + stop + 1 : stop + 1
    return list.slice(start, end)
  }

  async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    const list = this.lists.get(key) || []
    const end = stop < 0 ? list.length + stop + 1 : stop + 1
    this.lists.set(key, list.slice(start, end))
    return 'OK'
  }

  async quit(): Promise<'OK'> {
    this.store.clear()
    this.lists.clear()
    this.expiry.clear()
    return 'OK'
  }
}

// Use mock Redis in test environment
let mockRedis: MockRedis | null = null

export function getRedisClient(): Redis | MockRedis {
  if (process.env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
    if (!mockRedis) {
      mockRedis = new MockRedis()
    }
    return mockRedis
  }
  return getRedis()
}

export function resetMockRedis(): void {
  if (mockRedis) {
    mockRedis = new MockRedis()
  }
}
