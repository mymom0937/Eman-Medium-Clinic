interface RateLimitConfig {
  interval: number;
  uniqueTokenPerInterval: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private tokens: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async check(limit: number, token: string): Promise<RateLimitResult> {
    const now = Date.now();
    const current = this.tokens.get(token);

    if (!current || now > current.resetTime) {
      // First request or reset time passed
      this.tokens.set(token, {
        count: 1,
        resetTime: now + this.config.interval
      });

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + this.config.interval
      };
    }

    if (current.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetTime
      };
    }

    // Increment count
    current.count++;
    this.tokens.set(token, current);

    return {
      success: true,
      limit,
      remaining: limit - current.count,
      reset: current.resetTime
    };
  }

  // Clean up expired entries periodically
  cleanup() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.resetTime) {
        this.tokens.delete(token);
      }
    }
  }
}

export function rateLimit(config: RateLimitConfig): RateLimiter {
  const limiter = new RateLimiter(config);
  
  // Clean up expired entries every 5 minutes
  setInterval(() => {
    limiter.cleanup();
  }, 5 * 60 * 1000);

  return limiter;
}
