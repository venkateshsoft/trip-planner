export class CircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt = 0;

  constructor(
    private readonly failureThreshold = 3,
    private readonly cooldownMs = 30_000,
  ) {}

  isOpen(now = Date.now()): boolean {
    return this.openedAt > 0 && now - this.openedAt < this.cooldownMs;
  }

  allow(now = Date.now()): boolean {
    return !this.isOpen(now);
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = 0;
  }

  recordFailure(now = Date.now()): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = now;
    }
  }
}

