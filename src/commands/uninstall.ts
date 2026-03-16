import { uninstallHooks } from "../hooks/installer.js";
import { log } from "../utils/logger.js";

export function uninstallCommand(): void {
  const result = uninstallHooks();
  if (result.removed) {
    log.success(`Hooks removed from ${result.path}`);
  } else {
    log.warn("No claude-ding hooks found to remove.");
  }
}
