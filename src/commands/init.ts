import readline from "readline";
import { loadConfig, saveConfig } from "../config/loader.js";
import { PRESETS } from "../sounds/presets.js";
import { installHooks } from "../hooks/installer.js";
import { resolveSound } from "../sounds/resolver.js";
import { play } from "../sounds/player.js";
import { log } from "../utils/logger.js";
import { getConfigPath } from "../utils/paths.js";
import type { PresetName } from "../config/types.js";

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function initCommand(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n  claude-ding setup\n");

  // 1. Pick preset
  console.log("  Available sound presets:\n");
  PRESETS.forEach((p, i) => {
    console.log(`    ${i + 1}. ${p.name} — ${p.description}`);
  });

  const presetChoice = await ask(rl, "\n  Pick a preset [1-4, default: 1]: ");
  const presetIndex = Math.max(0, Math.min(3, (parseInt(presetChoice) || 1) - 1));
  const preset = PRESETS[presetIndex].name;

  // Update config with preset so resolver picks it up
  const config = loadConfig();
  config.preset = preset;
  saveConfig(config);

  // Preview a sound
  log.info(`Selected: ${preset}. Playing preview...`);
  const previewPath = resolveSound("task-complete");
  if (previewPath) {
    await play(previewPath);
    await sleep(1000);
  }

  // 2. Volume
  const volInput = await ask(rl, `  Volume [0-100, default: ${config.volume}]: `);
  const volume = parseInt(volInput);
  if (!isNaN(volume) && volume >= 0 && volume <= 100) {
    config.volume = volume;
  }

  // 3. Install hooks?
  const hookAnswer = await ask(rl, "  Install Claude Code hooks now? [Y/n]: ");
  const shouldInstall = !hookAnswer || hookAnswer.toLowerCase().startsWith("y");

  // Save final config
  saveConfig(config);
  log.success(`Config saved to ${getConfigPath()}`);

  if (shouldInstall) {
    const result = installHooks();
    log.success(`Hooks installed to ${result.path}`);
  } else {
    log.dim("  Run 'claude-ding install' later to add hooks.");
  }

  console.log("\n  You're all set! Run 'claude-ding test' to preview your sounds.\n");
  rl.close();
}
