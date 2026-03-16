import type { PresetName } from "../config/types.js";

export interface PresetInfo {
  name: PresetName;
  description: string;
}

export const PRESETS: PresetInfo[] = [
  {
    name: "minimal",
    description: "Clean UI tones. Confirmation chimes, question upticks, soft fades.",
  },
  {
    name: "sci-fi",
    description: "Futuristic. Force fields, laser chirps, computer hum, metal impacts.",
  },
  {
    name: "fantasy",
    description: "Plucked strings and steel drums. Pizzicato flourishes and ethereal chimes.",
  },
  {
    name: "retro",
    description: "8-bit chiptune. Victory fanfares, powerups, and classic error buzzes.",
  },
  {
    name: "doom",
    description: "Freedoom FPS. Shotgun racks, item pickups, oof grunts, radio chatter.",
  },
  {
    name: "nasa",
    description: "Mission control. Quindar beeps, radio static, Apollo master alarm.",
  },
];
