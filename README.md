# MCP Notify

A lightweight Model Context Protocol (MCP) server that provides audio notifications and desktop alerts for MCP-compatible AI clients.

> **⚠️ WSL Only**: Currently supports Windows Subsystem for Linux (WSL) only. Support for other operating systems will be added in future versions.

## Quick Start

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "notifications": {
      "command": "npx",
      "args": ["-y", "@kinolanka/mcp-notify@latest"]
    }
  }
}
```

## Usage

### Setting Up Notification Rules

Your AI client needs rules to know when to use notifications. Add these to your client's rules file:

```markdown
# Notification Rules

## When to notify:
- Use `notify` tool for important status updates
- Use `task_completed` tool when finishing long-running tasks (builds, tests, deployments)
- Always notify on critical errors or failures
- Notify when waiting for user input or manual intervention

## Examples:
- After running tests: "Task completed - All tests passed ✅"
- On build completion: "Build finished successfully 🚀"
- On errors: "Error occurred in deployment ❌"
```

### Available Tools

- `notify` - Show notification with title and message
- `task_completed` - Show task completion notification

### Options

| Option               | Description                      |
| -------------------- | -------------------------------- |
| `--audio, -a <path>` | Use custom audio file            |
| `--no-audio`         | Silent mode (notifications only) |
| `--no-notification`  | Disable desktop notifications    |

### Examples

**Custom audio:**

```json
{
  "command": "npx",
  "args": ["-y", "@kinolanka/mcp-notify@latest", "--audio", "/path/to/sound.wav"]
}
```

**Silent mode:**

```json
{
  "command": "npx",
  "args": ["-y", "@kinolanka/mcp-notify@latest", "--no-audio"]
}
```

## Audio System

1. **Custom audio** (if specified) - plays via `paplay`
2. **Bundled audio** (default) - included notification sound

## Troubleshooting

**No sound in IDE terminals?** This is expected - IDE terminals often have limited audio access. Desktop notifications will still work.

**Test audio manually:**

```bash
paplay /usr/share/sounds/alsa/Front_Left.wav
```

## License

MIT License
