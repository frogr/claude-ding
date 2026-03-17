import fs from "fs";

/**
 * Read the last assistant message from a Claude Code transcript file.
 * Transcript is JSONL with entries like:
 *   {"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
 */
export function readLastAssistantMessage(transcriptPath: string): string | null {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    // Walk backwards to find the last assistant message with text
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);

        // Primary format: type=assistant, message.content[]
        if (entry.type === "assistant" && entry.message?.content) {
          const text = extractTextContent(entry.message.content);
          if (text) return text;
        }

        // Fallback: role=assistant, content[]
        if (entry.role === "assistant" && entry.content) {
          const text = extractTextContent(entry.content);
          if (text) return text;
        }
      } catch {
        continue;
      }
    }
  } catch {
    // Can't read transcript
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
 * Extract the <tts>...</tts> tag from Claude's response.
 * Claude is prompted (via CLAUDE.md) to include this tag with a brief
 * spoken summary at the end of its responses.
 */
export function extractTTSSummary(text: string): string | null {
  // Find ALL <tts> tags and use the last one — earlier mentions
  // might be in prose/code discussing the tag itself.
  const matches = [...text.matchAll(/<tts>([\s\S]*?)<\/tts>/g)];
  if (matches.length > 0) {
    return matches[matches.length - 1][1].trim() || null;
  }
  return null;
}
