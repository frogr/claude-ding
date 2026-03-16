# claude-ding

[![npm version](https://img.shields.io/npm/v/claude-ding)](https://www.npmjs.com/package/claude-ding)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sound notifications for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Know when Claude finishes, needs input, or hits an error — without watching the terminal.

## Quick Start

```bash
npm install -g claude-ding
claude-ding init
```

This picks a sound preset, sets volume, and installs hooks into Claude Code. That's it.

## Sound Presets

| Preset | Description |
|--------|-------------|
| **minimal** | Clean UI tones. Confirmation chimes, question upticks, soft fades. |
| **sci-fi** | Force fields, laser chirps, computer hum, metal impacts. |
| **fantasy** | Plucked strings and steel drums. Pizzicato flourishes and ethereal chimes. |
| **retro** | 8-bit chiptune. Victory fanfares, powerups, classic error buzzes. |
| **doom** | Freedoom FPS. Shotgun racks, item pickups, oof grunts, radio chatter. |
| **nasa** | Mission control. Quindar beeps, radio static, Apollo master alarm. |

Switch anytime:

```bash
claude-ding set preset doom
```

## Hooks

claude-ding uses Claude Code's [hooks system](https://docs.anthropic.com/en/docs/claude-code/hooks). Running `claude-ding install` adds entries to `~/.claude/settings.json` that look like this:

```json
{
  "hooks": {
    "Stop": [
      { "hooks": [{ "type": "command", "command": "claude-ding play task-complete" }] }
    ],
    "Notification": [
      { "matcher": "permission_prompt", "hooks": [{ "type": "command", "command": "claude-ding play need-input" }] },
      { "matcher": "idle_prompt", "hooks": [{ "type": "command", "command": "claude-ding play idle" }] }
    ],
    "PostToolUseFailure": [
      { "hooks": [{ "type": "command", "command": "claude-ding play error" }] }
    ],
    "SessionStart": [
      { "matcher": "startup", "hooks": [{ "type": "command", "command": "claude-ding play session-start" }] }
    ]
  }
}
```

You can edit these directly if you want to customize which events trigger which sounds, or add your own hooks that call `claude-ding play <sound-name>`.

| Hook Event | Sound | When |
|------------|-------|------|
| `Stop` | `task-complete` | Claude finished responding |
| `Notification` (permission_prompt) | `need-input` | Claude needs your approval |
| `Notification` (idle_prompt) | `idle` | Claude is waiting for you |
| `PostToolUseFailure` | `error` | A tool call failed |
| `SessionStart` (startup) | `session-start` | New Claude Code session |

## Configuration

Config lives at `~/.claude-ding/config.json`:

```json
{
  "preset": "minimal",
  "volume": 70,
  "sounds": {}
}
```

Override individual sounds with custom audio files:

```json
{
  "preset": "minimal",
  "sounds": {
    "taskComplete": "/path/to/my-custom-chime.mp3"
  }
}
```

### Quiet Hours

```json
{
  "quietHours": {
    "enabled": true,
    "start": "22:00",
    "end": "08:00"
  }
}
```

## CLI

```
claude-ding init              Interactive setup
claude-ding install           Install hooks into Claude Code
claude-ding uninstall         Remove hooks
claude-ding test [sound]      Preview sounds
claude-ding play <sound>      Play a sound (used by hooks)
claude-ding preset [name]     Show or change preset
claude-ding set <key> <value> Update config (preset, volume)
claude-ding sounds            List current sound file paths
claude-ding sounds set <n> <p> Override a sound with a custom file
claude-ding sounds reset [n]  Revert to preset default
```

## Requirements

- Node.js 18+
- Claude Code
- macOS and Windows work out of the box. Linux needs `paplay`, `aplay`, `mpv`, or `ffplay`.

## Sound Credits

All bundled sounds are freely licensed:

- **minimal, sci-fi, fantasy** — [Kenney.nl](https://kenney.nl) (CC0 1.0, public domain)
- **retro** — [512 Sound Effects (8-bit style)](https://opengameart.org/content/512-sound-effects-8-bit-style) by Juhani Junkala (CC0)
- **doom** — [Freedoom](https://freedoom.github.io/) project (BSD 3-Clause)
- **nasa** — Synthesized quindar tones based on Apollo-era frequencies (public domain)

## License

MIT
