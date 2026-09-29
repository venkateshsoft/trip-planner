export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(provider: string) {
    super(`Provider quota exceeded for ${provider}`, provider, 429);
    this.name = "ProviderRateLimitError";
  }
}

