#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { testCommand } from "./commands/test.js";
import { installCommand } from "./commands/install-hooks.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { playCommand } from "./commands/play.js";
import { ttsCommand } from "./commands/tts.js";
import { soundsListCommand, soundsSetCommand, soundsResetCommand } from "./commands/sounds.js";
import { PRESETS } from "./sounds/presets.js";
import { loadConfig, updateConfig } from "./config/loader.js";
import { log } from "./utils/logger.js";

const program = new Command();

program
  .name("claude-ding")
  .description("Sonic feedback for Claude Code")
  .version("0.1.0");

program
  .command("init")
  .description("Interactive setup wizard")
  .action(initCommand);

program
  .command("test [sound]")
  .description("Play all configured sounds, or a specific one")
  .action(testCommand);

program
  .command("install")
  .description("Install hooks into Claude Code settings")
  .action(installCommand);

program
  .command("uninstall")
  .description("Remove claude-ding hooks from Claude Code settings")
  .action(uninstallCommand);

program
  .command("play <sound>")
  .description("Play a specific sound (used by hooks)")
  .action(playCommand);

program
  .command("tts [text]")
  .description("Speak text using TTS (coming soon)")
  .option("--from-stdin", "Read text from stdin")
  .action(ttsCommand);

program
  .command("presets")
  .description("List available sound presets")
  .action(() => {
    console.log("\n  Available presets:\n");
    for (const p of PRESETS) {
      console.log(`    ${p.name.padEnd(12)} ${p.description}`);
    }
    console.log();
  });

program
  .command("set <key> <value>")
  .description("Update a config value")
  .action((key: string, value: string) => {
    const config = loadConfig();

    if (key === "preset") {
      const valid = ["sci-fi", "fantasy", "retro", "minimal", "custom"];
      if (!valid.includes(value)) {
        log.error(`Invalid preset. Choose from: ${valid.join(", ")}`);
        process.exit(1);
      }
      updateConfig({ preset: value as typeof config.preset });
      log.success(`preset = ${value}`);
    } else if (key === "volume") {
      const vol = parseInt(value);
      if (isNaN(vol) || vol < 0 || vol > 100) {
        log.error("Volume must be 0-100");
        process.exit(1);
      }
      updateConfig({ volume: vol });
      log.success(`volume = ${vol}`);
    } else {
      log.error(`Unknown config key: ${key}. Valid keys: preset, volume`);
      process.exit(1);
    }
  });

const soundsCmd = program
  .command("sounds")
  .description("List current sounds and where they resolve to")
  .action(() => {
    soundsListCommand();
  });

soundsCmd
  .command("set <sound-name> <path-to-file>")
  .description("Set a custom sound file for an event")
  .action((soundName: string, filePath: string) => {
    soundsSetCommand(soundName, filePath);
  });

soundsCmd
  .command("reset [sound-name]")
  .description("Remove custom override (or all if no name given)")
  .action((soundName?: string) => {
    soundsResetCommand(soundName);
  });

program.parse();
