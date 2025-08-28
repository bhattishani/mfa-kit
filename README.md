# MFA Kit

A flexible Multi-Factor Authentication kit for Next.js, Express, and Cloudflare applications. This package provides a unified API for implementing various authentication factors including TOTP, OTP, PIN, and Passkeys (WebAuthn).

## Installation

Using pnpm:

```bash
pnpm add @bhattishani/mfa-kit
```

## Features

- 🔐 Multiple authentication factors
  - Time-based One-time Passwords (TOTP)
  - One-time Passwords (OTP)
  - PIN codes
  - Passkeys (WebAuthn)
- 🚀 Framework adapters
  - Next.js
  - Express
  - Cloudflare
- ⚡️ Type-safe APIs
- 🔄 Flexible flow management
- 📦 Zero configuration required

## Usage

### Next.js

```typescript
import { createMFAKit } from "@bhattishani/mfa-kit";
import { NextjsAdapter } from "@bhattishani/mfa-kit/adapters/nextjs";

const mfa = createMFAKit({
  adapter: new NextjsAdapter(),
  // ... your configuration
});
```

### Express

```typescript
import { createMFAKit } from "@bhattishani/mfa-kit";
import { ExpressAdapter } from "@bhattishani/mfa-kit/adapters/express";

const mfa = createMFAKit({
  adapter: new ExpressAdapter(),
  // ... your configuration
});
```

### Cloudflare

```typescript
import { createMFAKit } from "@bhattishani/mfa-kit";
import { CloudflareAdapter } from "@bhattishani/mfa-kit/adapters/cloudflare";

const mfa = createMFAKit({
  adapter: new CloudflareAdapter(),
  // ... your configuration
});
```

## Documentation

For detailed documentation and examples, please visit our [documentation site](https://github.com/bhattishani/mfa-kit).

## License

ISC
