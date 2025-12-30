# Email Scripts Documentation

This directory contains utility scripts for sending emails from the server, typically used for testing, development, or manual administrative tasks.

## Waitlist Invite Script (`scripts/send-invite.ts`)

This script sends a "We are live!" waitlist invitation email to a specified recipient.

### Prerequisites

- Node.js installed.
- Dependencies installed (`npm install`).
- `tsx` installed (usually via devDependencies or run via `npx`).
- Environment variables configured (see below).

### Environment Configuration

The script attempts to load environment variables from `.env.support` in the `server` directory.

**Required Environment Variables:**
- `SMTP_OUT_SERVER`: SMTP host (e.g., `smtp.gmail.com`).
- `SMTP_PORT`: SMTP port (e.g., `465` or `587`).
- `SMTP_EMAIL_USER`: SMTP username/email.
- `SMTP_EMAIL_PASS`: SMTP password.

**Optional Environment Variables:**
- `MOCK_EMAIL`: Set to `true` to log email content to the console instead of sending it.

### Usage

Run the script from the root of the project (or adjust path accordingly):

```bash
npx tsx webapp/server/src/scripts/send-invite.ts <recipient-email>
```

**Example (Real Send):**
```bash
npx tsx webapp/server/src/scripts/send-invite.ts user@example.com
```

**Example (Mock/Dry Run):**
```bash
MOCK_EMAIL=true npx tsx webapp/server/src/scripts/send-invite.ts user@example.com
```

### Troubleshooting

- **Connection Refused**: Check your SMTP settings and ensure your firewall isn't blocking the port.
- **Authentication Failed**: Verify your SMTP credentials. For Gmail, you might need an App Password.
- **File Not Found Errors**: Ensure you are running the command from the correct directory (project root is recommended).
