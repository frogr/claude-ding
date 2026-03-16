import fs from "fs";
import { log } from "../utils/logger.js";

/**
 * Read the last assistant message from a Claude Code transcript file.
 * The transcript is a JSONL file where each line is a JSON object.
 */
export function readLastAssistantMessage(transcriptPath: string): string | null {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    // Walk backwards to find the last assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.role === "assistant" && entry.message) {
          return extractTextContent(entry.message);
        }
        // Also handle the format where content is directly on the entry
        if (entry.type === "assistant" && entry.content) {
          return extractTextContent(entry.content);
        }
      } catch {
        continue;
      }
    }
  } catch (err: any) {
    log.dim(`  Could not read transcript: ${err.message}`);
  }

  return null;
}

function extractTextContent(content: any): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts = content
      .filter((block: any) => block.type === "text" && block.text)
      .map((block: any) => block.text);
    return textParts.join(" ") || null;
  }

  return null;
}

/**
 * Truncate text to approximately the first N words.
 */
export function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Extract just the first sentence from text.
 */
export function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : truncateToWords(text, 15);
}
