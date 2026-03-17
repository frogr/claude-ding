import fs from "fs";
import { getConfigDir, getConfigPath, ensureDir } from "../utils/paths.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import type { ClaudeDingConfig } from "./types.js";

export function loadConfig(): ClaudeDingConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      tts: { ...DEFAULT_CONFIG.tts, ...parsed.tts },
      voice: { ...DEFAULT_CONFIG.voice, ...parsed.voice },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: ClaudeDingConfig): void {
  const configDir = getConfigDir();
  ensureDir(configDir);
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function updateConfig(updates: Partial<ClaudeDingConfig>): ClaudeDingConfig {
  const config = loadConfig();
  const merged = { ...config, ...updates };
  saveConfig(merged);
  return merged;
}
