export interface HookEntry {
  matcher?: string;
  hooks: { type: "command"; command: string }[];
}

export interface HooksConfig {
  [eventName: string]: HookEntry[];
}

export function getClaudeDingHooks(): HooksConfig {
  return {
    Stop: [
      {
        hooks: [
          {
            type: "command",
            command: "claude-ding play task-complete",
          },
          {
            type: "command",
            command: "claude-ding speak-response",
          },
        ],
      },
    ],
    Notification: [
      {
        matcher: "permission_prompt",
        hooks: [
          {
            type: "command",
            command: "claude-ding play need-input",
          },
        ],
      },
      {
        matcher: "idle_prompt",
        hooks: [
          {
            type: "command",
            command: "claude-ding play idle",
          },
        ],
      },
    ],
    PostToolUseFailure: [
      {
        hooks: [
          {
            type: "command",
            command: "claude-ding play error",
          },
        ],
      },
    ],
    SessionStart: [
      {
        matcher: "startup",
        hooks: [
          {
            type: "command",
            command: "claude-ding play session-start",
          },
        ],
      },
    ],
  };
}
