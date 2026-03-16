import { execFileSync } from "child_process";
import os from "os";

export type Platform = "macos" | "linux" | "windows" | "unknown";

export function detectPlatform(): Platform {
  const p = os.platform();
  if (p === "darwin") return "macos";
  if (p === "linux") return "linux";
  if (p === "win32") return "windows";
  return "unknown";
}

export interface AudioPlayer {
  command: string;
  args: (filePath: string, volume?: number) => string[];
}

function commandExists(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function detectAudioPlayer(): AudioPlayer | null {
  const platform = detectPlatform();

  if (platform === "macos") {
    return {
      command: "afplay",
      args: (filePath, volume) => {
        const args = [filePath];
        if (volume !== undefined) {
          // afplay volume is 0-255, we map 0-100 to 0-255
          args.push("-v", String(volume / 100));
        }
        return args;
      },
    };
  }

  if (platform === "linux") {
    const players: { cmd: string; argsFn: (f: string, v?: number) => string[] }[] = [
      {
        cmd: "paplay",
        argsFn: (f, v) => {
          const args = [f];
          if (v !== undefined) args.push("--volume", String(Math.round((v / 100) * 65536)));
          return args;
        },
      },
      { cmd: "aplay", argsFn: (f) => [f] },
      { cmd: "mpv", argsFn: (f, v) => ["--no-video", `--volume=${v ?? 100}`, f] },
      { cmd: "ffplay", argsFn: (f, v) => ["-nodisp", "-autoexit", "-volume", String(v ?? 100), f] },
    ];

    for (const { cmd, argsFn } of players) {
      if (commandExists(cmd)) {
        return { command: cmd, args: argsFn };
      }
    }
  }

  if (platform === "windows") {
    return {
      command: "powershell",
      args: (filePath) => [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Add-Type -AssemblyName PresentationCore; $p = New-Object System.Windows.Media.MediaPlayer; $p.Open([uri]"${filePath}"); $p.Play(); Start-Sleep -Seconds 5`,
      ],
    };
  }

  return null;
}
