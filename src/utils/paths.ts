import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";

export function getConfigDir(): string {
  const dir = path.join(os.homedir(), ".claude-ding");
  return dir;
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export function getClaudeSettingsPath(): string {
  // Check XDG first, then default
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  const xdgPath = path.join(xdgConfig, "claude", "settings.json");

  if (fs.existsSync(xdgPath)) {
    return xdgPath;
  }

  // Default location
  return path.join(os.homedir(), ".claude", "settings.json");
}

export function getSoundsDir(): string {
  // Resolve from the package root (two levels up from dist/utils/)
  // When running from source: src/utils -> src -> root
  // When running from dist: dist/utils -> dist -> root
  // Works in both ESM and CJS (tsup banner adds createRequire for ESM)
  const thisFile = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
  const thisDir = path.dirname(thisFile);
  // Walk up to find the sounds directory
  let dir = thisDir;
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, "sounds");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  // Fallback: relative to package root
  return path.join(path.dirname(path.dirname(thisDir)), "sounds");
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}
