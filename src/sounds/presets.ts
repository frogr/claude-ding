import type { PresetName } from "../config/types.js";

export interface PresetInfo {
  name: PresetName;
  description: string;
}

export const PRESETS: PresetInfo[] = [
  {
    name: "minimal",
    description: "Clean, professional. Soft sine chimes and gentle pulses.",
  },
  {
    name: "sci-fi",
    description: "Crisp military sci-fi. Comm beeps and adjutant-style alerts.",
  },
  {
    name: "fantasy",
    description: "Fantasy RPG. Quest complete fanfare, raid warnings, level-up sparkle.",
  },
  {
    name: "retro",
    description: "8-bit retro. Chip-tune coins, power-ups, and game-over jingles.",
  },
];
