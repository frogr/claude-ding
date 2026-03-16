import { installHooks } from "../hooks/installer.js";
import { log } from "../utils/logger.js";

export function installCommand(): void {
  const result = installHooks();
  if (result.installed) {
    log.success(`Hooks installed to ${result.path}`);
    log.dim("  Claude Code will now play sounds on key events.");
    log.dim("  Run 'claude-ding uninstall' to remove them.");
  } else {
    log.error("Failed to install hooks.");
  }
}
