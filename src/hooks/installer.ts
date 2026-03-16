import fs from "fs";
import path from "path";
import { getClaudeSettingsPath, ensureDir } from "../utils/paths.js";
import { getClaudeDingHooks } from "./templates.js";
import type { HookEntry } from "./templates.js";

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

  return { removed: removedAny, path: settingsPath };
}
