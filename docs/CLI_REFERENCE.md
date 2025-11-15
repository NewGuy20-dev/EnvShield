# EnvShield CLI Reference

Complete command reference for the EnvShield CLI tool.

## Installation

```bash
npm install -g envshield
```

## Authentication

### `login`

Authenticate with EnvShield using email and password (with optional 2FA).

```bash
envshield login
envshield login --profile production
```

**Options:**
- `--profile <name>`: Profile name for multi-profile support
- `--token <token>`: Non-interactive login with dashboard-generated token

**Interactive Flow:**
1. Enter email
2. Enter password
3. Enter 2FA code (if enabled)
4. Token saved to `~/.envshield/config.json`

---

### `logout`

Remove authentication token.

```bash
envshield logout
envshield logout --profile production
```

---

### `whoami`

Display current user information and token metadata.

```bash
envshield whoami
envshield whoami --json
```

---

## Profile Management

### `profile list`

List all configured profiles.

```bash
envshield profile list
```

---

### `profile use`

Switch active profile.

```bash
envshield profile use production
```

---

### `profile add`

Add a new profile.

```bash
envshield profile add staging
```

---

### `profile remove`

Remove a profile.

```bash
envshield profile remove old-profile
```

---

## Project Management

### `list`

List all projects you have access to.

```bash
envshield list
envshield list --json
```

---

### `init`

Initialize EnvShield in the current directory.

```bash
envshield init
```

**Interactive Flow:**
1. Select project from list
2. Select environment
3. Creates `.envshield` configuration file

---

## Variable Operations

### `pull`

Pull environment variables from remote to local file.

```bash
envshield pull
envshield pull --env my-app/production --output .env.prod
```

**Options:**
- `--env <project/environment>`: Specify project and environment
- `--output <file>`: Output file path (default: `.env.local` or `.env`)

---

### `push`

Push environment variables from local file to remote.

```bash
envshield push
envshield push --env my-app/staging --file .env.staging
```

**Options:**
- `--env <project/environment>`: Specify project and environment
- `--file <file>`: Source file path (default: `.env.local` or `.env`)

**Features:**
- Shows diff preview before pushing
- Requires confirmation
- Displays created/updated counts

---

### `view`

View environment variables in the terminal.

```bash
envshield view --env my-app/production
envshield view --env api/staging --reveal --filter API
```

**Options:**
- `--env <project/environment>`: Specify project and environment (required)
- `--reveal`: Show full values instead of masked
- `--filter <text>`: Filter variables by key or description

---

### `search`

Search for variables across all projects.

```bash
envshield search "database"
envshield search "API_KEY" --project my-app --decrypt
envshield search "secret" --json
```

**Arguments:**
- `<query>`: Search query (required)

**Options:**
- `-p, --project <slug>`: Filter by project slug
- `-e, --env <name>`: Filter by environment name
- `--decrypt`: Show full decrypted values (requires DEVELOPER+ role)
- `--json`: Output results in JSON format

**Output:**
- Table format (default): Key, value, project, environment, date
- JSON format (--json): Complete response object for scripting

---

## Import/Export

### `import`

Import variables from a file.

```bash
envshield import --file .env.prod --project my-app --env production
envshield import -f secrets.yaml --p api --e staging --format yaml --dry-run
envshield import -f config.json --p web --e dev --format json --yes
```

**Options:**
- `-f, --file <path>`: Path to import file (required)
- `--format <format>`: File format - `dotenv`, `json`, or `yaml` (default: `dotenv`)
- `-p, --project <slug>`: Project slug (required)
- `-e, --env <name>`: Environment name (required)
- `--strategy <strategy>`: Conflict resolution strategy (default: `merge`)
  - `merge`: Add new variables, update existing ones
  - `overwrite`: Replace all existing variables
  - `skip`: Only add new variables, skip existing ones
- `--dry-run`: Preview changes without applying
- `-y, --yes`: Skip confirmation prompt

**Features:**
- Always shows diff preview first
- Interactive confirmation (unless --yes)
- Colored output: green (+) for new, yellow (~) for updated
- Detailed results: created, updated, skipped, errors

---

### `export`

Export variables to a file.

```bash
envshield export --project my-app --env production --format dotenv --output .env.backup
envshield export -p api -e staging --format json > config.json
envshield export -p web -e dev --format yaml
```

**Options:**
- `-o, --output <path>`: Output file path (optional, defaults to stdout)
- `--format <format>`: Output format - `dotenv`, `json`, or `yaml` (default: `dotenv`)
- `-p, --project <slug>`: Project slug (required)
- `-e, --env <name>`: Environment name (required)

**Formats:**
- **dotenv**: Standard `.env` format (`KEY=value`)
- **json**: Nested JSON structure
- **yaml**: YAML format with proper indentation

---

## Bulk Operations

### `bulk delete`

Delete multiple variables at once.

```bash
envshield bulk delete KEY1 KEY2 KEY3 --project my-app --env prod
envshield bulk delete OLD_* --project api --env staging --yes
```

**Arguments:**
- `<keys...>`: Variable keys to delete (space-separated)

**Options:**
- `-p, --project <slug>`: Project slug (required)
- `-e, --env <name>`: Environment name (required)
- `-y, --yes`: Skip confirmation

**Safety:**
- Requires ADMIN+ role (enforced by API)
- Shows summary before deletion
- Confirmation required by default
- Displays deleted/failed counts with errors

---

### `bulk update`

Update multiple variables from a file (placeholder).

```bash
# Currently suggests using import instead:
envshield import --file updates.json --format json --strategy merge
```

---

## Shell Completion

### `completion`

Generate shell completion scripts.

```bash
# Bash
envshield completion bash
eval "$(envshield completion bash)"
envshield completion bash > /etc/bash_completion.d/envshield

# Zsh
envshield completion zsh
eval "$(envshield completion zsh)"
envshield completion zsh > ~/.zsh/completions/_envshield

# Fish
envshield completion fish
envshield completion fish > ~/.config/fish/completions/envshield.fish
```

**Supported Shells:**
- Bash
- Zsh
- Fish

**Features:**
- Command completion (all CLI commands)
- Option completion (--format, --strategy, etc.)
- Installation instructions included in output

---

## Configuration

### Config File Location

`~/.envshield/config.json`

### Config Format

```json
{
  "activeProfile": "default",
  "profiles": {
    "default": {
      "apiUrl": "https://envshield.com",
      "token": "esh_...",
      "createdAt": "2025-11-15T12:00:00.000Z"
    },
    "production": {
      "apiUrl": "https://envshield.com",
      "token": "esh_...",
      "createdAt": "2025-11-15T13:00:00.000Z"
    }
  }
}
```

### Project Config

`.envshield` (created by `envshield init`)

```json
{
  "projectSlug": "my-app",
  "environment": "production"
}
```

---

## Examples

### Complete Workflow

```bash
# 1. Login
envshield login

# 2. Initialize project
cd my-project
envshield init

# 3. Pull variables
envshield pull

# 4. Make changes locally (edit .env.local)

# 5. Preview changes
envshield push
# (shows diff and asks for confirmation)

# 6. Search for a variable
envshield search "DATABASE" --decrypt

# 7. Export for backup
envshield export --format json --output backup.json

# 8. Import to another environment
envshield import --file backup.json --format json --project my-app --env staging --strategy merge
```

### Multi-Profile Usage

```bash
# Add profiles
envshield login --profile dev
envshield login --profile prod

# Switch profiles
envshield profile use prod

# Pull from production
envshield pull --env my-app/production

# Switch back
envshield profile use dev
```

### Bulk Operations

```bash
# Delete old secrets
envshield bulk delete OLD_API_KEY DEPRECATED_SECRET --project my-app --env staging

# Export, modify, and import
envshield export --format json --output vars.json
# Edit vars.json
envshield import --file vars.json --format json --strategy merge
```

---

## Environment Variables

- `ENVSHIELD_API_URL`: Override default API URL
- `ENVSHIELD_TOKEN`: Override token from config (for CI/CD)
- `ENVSHIELD_PROFILE`: Override active profile

---

## Exit Codes

- `0`: Success
- `1`: Error (authentication, validation, API failure)

---

## Tips & Best Practices

1. **Use Profiles**: Separate credentials for dev/staging/prod
2. **Always Dry-Run First**: Use `--dry-run` with imports to preview changes
3. **Enable Shell Completion**: Speeds up command entry
4. **Search Before Creating**: Check if variables exist before creating duplicates
5. **Regular Backups**: Export critical environments to JSON/YAML files
6. **Use --filter with View**: Quickly find specific variables
7. **Audit Imports**: Review diff preview carefully before confirming
8. **Set Token Names**: Use descriptive names when creating tokens in dashboard
9. **Rotate Tokens**: After enabling 2FA, create new tokens for CLI access
10. **Check Permissions**: Some commands require specific roles (DEVELOPER+, ADMIN+)

---

## Troubleshooting

### "Not logged in"
```bash
envshield login
```

### "Project not found"
```bash
envshield list  # View available projects
```

### "Permission denied"
Contact your project admin to upgrade your role (DEVELOPER+ for most operations).

### "2FA required"
Enter your 6-digit authenticator code when prompted during login.

### Shell completion not working
Make sure to reload your shell or source the completion file:
```bash
source ~/.bashrc  # Bash
source ~/.zshrc   # Zsh
```

---

## Support

- **Documentation**: https://envshield.com/docs
- **GitHub**: https://github.com/envshield/envshield
- **Issues**: https://github.com/envshield/envshield/issues

---

*CLI Version: 0.1.0*  
*Last Updated: November 15, 2025*
