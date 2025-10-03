# dotenv-ui

A minimal local web dashboard for editing, diffing, and encrypting/decrypting `.env` files.

## Features

- **Edit .env files** in a clean web interface
- **Edit both keys and values** directly in the table
- **Compare with .env.example** to see missing/extra variables
- **Encrypt/Decrypt** using dotenvx (optional)
- **Collapsible sections** for better organization
- **Real-time validation** of key names

## Quick Start

1. Install dependencies (from project root):

   ```bash
    npm install```

2. Start the server:

    ```bash
    npm run ui```

3. Open <http://localhost:3000> in your browser

## File Structure

dotenv-ui/
├── public/
│   ├── index.html      # Main UI
│   ├── app.js          # Client-side logic
│   └── styles.css      # Styling
├── server.js           # Express server with API
├── .env                # Sample environment file
├── .env.env            # Encryped env vars
├── .env.example        # Sample example file
└── README.md           # This file

## API Endpoints

`GET /api/env` - Read current .env file
`POST /api/env` - Write to .env file
`GET /api/env-example` - Read .env.example file
`GET /api/diff` - Compare .env vs .env.example
`POST /api/encrypt` - Encrypt .env to .env.enc
`POST /api/decrypt` - Decrypt .env.enc to .env

## Optional: dotenvx Integration

Install dotenvx (if you want encrypt/decrypt features)
```curl -fsSL https://dotenvx.sh/install | bash```

Or using npm (if available)
```npm install -g @dotenvx/dotenvx```

## License

BSD-2-Clause (same as dotenv)

### 1.2 Update package.json scripts

Make sure your root `package.json` has the UI script:

```json
{
  "scripts": {
    // ... existing scripts ...
    "ui": "node dotenv-ui/server.js"
  }
}
