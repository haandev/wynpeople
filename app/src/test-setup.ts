// The offices' clock (UTC+3). Date tests depend on it; bun test would otherwise run on UTC.
;(globalThis as unknown as { process: { env: Record<string, string> } }).process.env.TZ = 'Europe/Istanbul'
