import fs from "fs";
import path from "path";
import os from "os";
import { getClaudeSettingsPath, ensureDir } from "../utils/paths.js";
import { getClaudeDingHooks } from "./templates.js";
import type { HookEntry } from "./templates.js";

const TTS_MARKER_START = "<!-- claude-ding:tts-start -->";
const TTS_MARKER_END = "<!-- claude-ding:tts-end -->";
const TTS_INSTRUCTION = `${TTS_MARKER_START}
At the end of every response, include a <tts>brief spoken summary</tts> tag. This is read aloud by a text-to-speech system. Keep it to 1-2 natural sentences. Write it conversationally — as if you're telling someone what you just did. No markdown, no code, no file paths. If the task is simple, a few words is fine.
${TTS_MARKER_END}`;

function getUserClaudeMdPath(): string {
  return path.join(os.homedir(), ".claude", "CLAUDE.md");
}

export function installTtsInstruction(): void {
  const mdPath = getUserClaudeMdPath();
  ensureDir(path.dirname(mdPath));

  let content = "";
  if (fs.existsSync(mdPath)) {
    content = fs.readFileSync(mdPath, "utf-8");
  }

  // Already installed
  if (content.includes(TTS_MARKER_START)) return;

  const separator = content.length > 0 && !content.endsWith("\n") ? "\n\n" : content.length > 0 ? "\n" : "";
  fs.writeFileSync(mdPath, content + separator + TTS_INSTRUCTION + "\n", "utf-8");
}

export function uninstallTtsInstruction(): void {
  const mdPath = getUserClaudeMdPath();
  if (!fs.existsSync(mdPath)) return;

  let content = fs.readFileSync(mdPath, "utf-8");
  if (!content.includes(TTS_MARKER_START)) return;

  // Remove the TTS block and any surrounding blank lines it created
  const regex = new RegExp(`\\n?${TTS_MARKER_START}[\\s\\S]*?${TTS_MARKER_END}\\n?`, "g");
  content = content.replace(regex, "\n");

  // Trim trailing whitespace
  content = content.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";

  fs.writeFileSync(mdPath, content, "utf-8");
}

function isClaudeDingHook(entry: HookEntry): boolean {
  return entry.hooks.some((h) => h.command.startsWith("claude-ding"));
}

export function installHooks(): { installed: boolean; path: string } {
  const settingsPath = getClaudeSettingsPath();
  ensureDir(path.dirname(settingsPath));

  let settings: Record<string, unknown> = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch {
      // Start fresh if invalid JSON
    }
  }

  const existingHooks = (settings.hooks ?? {}) as Record<string, HookEntry[]>;
  const ourHooks = getClaudeDingHooks();

  // Merge: add our hooks without duplicating or clobbering existing ones
  for (const [event, entries] of Object.entries(ourHooks)) {
    const existing = existingHooks[event] ?? [];
    // Remove any old claude-ding hooks first
    const filtered = existing.filter((e) => !isClaudeDingHook(e));
    // Add our hooks
    existingHooks[event] = [...filtered, ...entries];
  }

  settings.hooks = existingHooks;
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");

  // Inject TTS instruction into user's CLAUDE.md so Claude includes <tts> tags
  installTtsInstruction();

  return { installed: true, path: settingsPath };
}

export function uninstallHooks(): { removed: boolean; path: string } {
  const settingsPath = getClaudeSettingsPath();

  if (!fs.existsSync(settingsPath)) {
    return { removed: false, path: settingsPath };
  }

  let settings: Record<string, unknown>;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  } catch {
    return { removed: false, path: settingsPath };
  }

  const hooks = settings.hooks as Record<string, HookEntry[]> | undefined;
  if (!hooks) {
    return { removed: false, path: settingsPath };
  }

  let removedAny = false;
  for (const [event, entries] of Object.entries(hooks)) {
    const filtered = entries.filter((e) => !isClaudeDingHook(e));
    if (filtered.length !== entries.length) {
      removedAny = true;
    }
    if (filtered.length === 0) {
      delete hooks[event];
    } else {
      hooks[event] = filtered;
    }
  }

  // Clean up empty hooks object
  if (Object.keys(hooks).length === 0) {
    delete settings.hooks;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");

  // Remove TTS instruction from user's CLAUDE.md
  uninstallTtsInstruction();

  return { removed: removedAny, path: settingsPath };
}
