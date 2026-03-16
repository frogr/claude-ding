import { execSync } from "child_process";
import { log } from "../utils/logger.js";

type Terminal = "iterm2" | "terminal" | "auto";

let cachedSessionId: string | null = null;

/**
 * Inject text into the Claude Code terminal session.
 * Finds the Claude Code tab automatically by scanning iTerm2 sessions.
 */
export function injectText(text: string, terminal: Terminal = "auto"): void {
  const resolved = terminal === "auto" ? detectTerminal() : terminal;

  if (resolved === "iterm2") {
    injectViaiTerm2(text);
  } else {
    injectViaSystemEvents(text);
  }
}

function detectTerminal(): "iterm2" | "terminal" {
  const termProgram = process.env.TERM_PROGRAM || "";
  if (termProgram.toLowerCase().includes("iterm")) {
    return "iterm2";
  }
  return "terminal";
}

/**
 * Find the iTerm2 session running Claude Code.
 * Looks for session names containing "claude" (case-insensitive).
 * Caches the result for subsequent calls.
 */
function findClaudeSession(): string | null {
  if (cachedSessionId) {
    return cachedSessionId;
  }

  // Get our own tty so we can exclude ourselves
  let ourTty = "";
  try {
    ourTty = execSync("tty", { encoding: "utf-8", stdio: ["inherit", "pipe", "pipe"] }).trim();
  } catch {
    // Not a tty (e.g. running inside Claude Code itself) — that's fine
  }

  const script = `
tell application "iTerm2"
  tell current window
    repeat with t in tabs
      repeat with s in sessions of t
        set sName to name of s
        set sTty to tty of s
        if sName contains "claude" or sName contains "Claude" then
          return (id of s) & "|||" & sTty
        end if
      end repeat
    end repeat
  end tell
end tell
return ""`;

  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    }).trim();

    if (result && result.includes("|||")) {
      const [sessionId, sessionTty] = result.split("|||");
      // Don't target ourselves
      if (sessionTty === ourTty && ourTty) {
        log.warn("Found Claude session but it's our own terminal");
        return null;
      }
      cachedSessionId = sessionId;
      return sessionId;
    }
  } catch {
    // AppleScript failed
  }

  return null;
}

function injectViaiTerm2(text: string): void {
  const sessionId = findClaudeSession();

  if (sessionId) {
    injectToSession(text, sessionId);
  } else {
    // Fallback: try to find any OTHER session (not claude-ding)
    const fallbackId = findOtherSession();
    if (fallbackId) {
      injectToSession(text, fallbackId);
    } else {
      log.warn("No Claude Code session found. Falling back to System Events.");
      injectViaSystemEvents(text);
    }
  }
}

function injectToSession(text: string, sessionId: string): void {
  const escaped = escapeForAppleScript(text);
  const escapedId = escapeForAppleScript(sessionId);

  const script = `
tell application "iTerm2"
  tell current window
    repeat with t in tabs
      repeat with s in sessions of t
        if id of s is "${escapedId}" then
          tell s to write text "${escaped}"
          return "ok"
        end if
      end repeat
    end repeat
  end tell
end tell`;

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    });
  } catch (err: any) {
    // Session might have closed — clear cache and retry once
    cachedSessionId = null;
    log.warn("iTerm2 injection failed. Is Claude Code still running?");
  }
}

/**
 * Find any session that isn't running claude-ding (fallback).
 */
function findOtherSession(): string | null {
  const script = `
tell application "iTerm2"
  tell current window
    repeat with t in tabs
      repeat with s in sessions of t
        set sName to name of s
        if sName does not contain "claude-ding" and sName does not contain "voice" then
          return id of s
        end if
      end repeat
    end repeat
  end tell
end tell
return ""`;

  try {
    const result = execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    }).trim();

    if (result) return result;
  } catch { /* ignore */ }

  return null;
}

function injectViaSystemEvents(text: string): void {
  if (text.length > 100) {
    injectViaClipboard(text);
    return;
  }

  const escaped = escapeForAppleScript(text);

  const script = `
tell application "System Events"
  keystroke "${escaped}"
  keystroke return
end tell`.trim();

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    });
  } catch {
    log.warn("System Events failed, trying clipboard paste");
    injectViaClipboard(text);
  }
}

function injectViaClipboard(text: string): void {
  try {
    execSync(`printf '%s' ${shellEscape(text)} | pbcopy`, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    });

    const script = `
tell application "System Events"
  keystroke "v" using command down
  delay 0.1
  keystroke return
end tell`.trim();

    execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5000,
    });
  } catch (err: any) {
    throw new Error(`Failed to inject text: ${err.message}`);
  }
}

function escapeForAppleScript(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

function shellEscape(text: string): string {
  return "'" + text.replace(/'/g, "'\\''") + "'";
}

/**
 * Clear the cached session ID (e.g. if the target session closed).
 */
export function clearSessionCache(): void {
  cachedSessionId = null;
}
