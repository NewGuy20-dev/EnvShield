# EnvShield CLI

Command-line interface for EnvShield - a secure environment variable manager with Git-like push/pull workflow.

## Installation

### For Development
```bash
cd cli
npm install
npm run build
npm link
```

### For Production (when published)
```bash
npm install -g envshield-cli
```

## Quick Start

```bash
# 1. Authenticate
envshield login

# 2. Initialize project
envshield init

# 3. Pull variables from remote
envshield pull

# 4. Edit your .env file
# ... make changes ...

# 5. Push changes back
envshield push
```

## Commands

### Authentication

#### `envshield login`
Authenticate with EnvShield server. Prompts for email, password, and optionally API URL.

```bash
envshield login
```

The authentication token is saved to `~/.envshield/config.json` and is valid for 1 year.

#### `envshield logout`
Remove authentication token.

```bash
envshield logout
```

#### `envshield whoami`
Display current user information and token details.

```bash
envshield whoami
```

### Project Management

#### `envshield list`
List all projects you have access to with their roles and environment counts.

```bash
envshield list
```

#### `envshield init`
Initialize EnvShield in the current directory. Creates a `.envshield` file with project and environment configuration.

```bash
envshield init
```

### Variable Management

#### `envshield pull`
Pull environment variables from the remote server and save to `.env` file.

```bash
# Pull using .envshield config
envshield pull

# Pull specific environment
envshield pull --env my-project/production

# Pull to custom file
envshield pull --output .env.local
```

**Options:**
- `--env <project/environment>` - Specify project and environment
- `--output <file>` - Output file path (default: `.env`)

#### `envshield push`
Push local environment variables to the remote server.

```bash
# Push using .envshield config
envshield push

# Push specific environment
envshield push --env my-project/production

# Push from custom file
envshield push --file .env.local
```

Before pushing, the CLI will:
1. Compare local and remote variables
2. Show a diff (created/updated)
3. Ask for confirmation

**Options:**
- `--env <project/environment>` - Specify project and environment
- `--file <file>` - Source file path (default: `.env`)

## Configuration Files

### `.envshield` (project config)
Created by `envshield init` in your project directory:

```json
{
  "projectSlug": "my-project",
  "environment": "development"
}
```

### `~/.envshield/config.json` (user config)
Created by `envshield login`, stores authentication:

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "esh_...",
  "email": "user@example.com"
}
```

**Security:** This file has 0600 permissions (owner read/write only).

## Environment Variables

### `ENVSHIELD_API_URL`
Override the default API URL:

```bash
export ENVSHIELD_API_URL=https://your-envshield-instance.com/api/v1
envshield login
```

## Example Workflow

```bash
# Initial setup
$ envshield login
? Email: developer@company.com
? Password: ********
✅ Logged in as developer@company.com

$ envshield init
? Select a project: My App (my-app) - DEVELOPER
? Select an environment: Development (development) - 12 variables
✅ Initialized successfully

# Pull variables
$ envshield pull
🔄 Pulling variables from my-app (development)...
✅ Pulled 12 variable(s) to .env

# Edit .env file
$ nano .env
# ... make changes ...

# Push changes
$ envshield push
📖 Reading .env...
🔄 Fetching remote variables...
✅ Remote variables fetched

Changes to be pushed:
  2 new variable(s) to create
    + NEW_FEATURE_FLAG
    + API_TIMEOUT
  1 variable(s) to update
    ~ DATABASE_URL

? This will push 3 variable(s) to my-app/development. Continue? Yes
🔄 Pushing 3 variable(s)...
✅ Pushed 3 variable(s) (2 created, 1 updated)
✅ Push completed successfully
```

## Security Features

- ✅ AES-256-GCM encryption for variables (server-side)
- ✅ Bcrypt-hashed API tokens
- ✅ Secure config file permissions (0600)
- ✅ Role-based access control (OWNER/ADMIN/DEVELOPER/VIEWER)
- ✅ Audit logging for all operations
- ✅ HTTPS-only API communication

## Troubleshooting

### "Not authenticated" error
Run `envshield login` to authenticate.

### "Cannot connect to EnvShield API"
Check your internet connection and verify the API URL:
```bash
envshield login  # Will prompt for API URL
```

### ".envshield file not found"
Run `envshield init` in your project directory first.

### "You do not have permission"
Check your role with `envshield whoami`. You need OWNER, ADMIN, or DEVELOPER role to modify variables.

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev -- login
npm run dev -- --help
```

### Clean
```bash
npm run clean
```

## Documentation

For more information, visit:
- [Main Documentation](../README.md)
- [Implementation Details](../CLI_IMPLEMENTATION_COMPLETE.md)
- [MAIN_DOC.md](../docs/MAIN_DOC.md)
