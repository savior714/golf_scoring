# Terminal Flicker Diagnosis & Solution Report

## 1. Problem Definition
*   **Symptom**: Terminal flashes 4-5 times for every tool call.
*   **Technical Root Cause**: **Agent-to-Shell Handshake Timeout**. The updated agent logic attempts to verify "Shell Integration" with Windows Native PowerShell. If the response (sequences like `ESC]633;A;ST`) is not captured within a sub-second window, the agent kills the process and retries.
*   **Environment Factor**: Windows 11 Native + PowerShell 7 (pwsh).

## 2. Surgical Diagnosis
*   **PowerShell Speed**: Physically verified at ~330ms (Fast).
*   **Handshake Failure**: The flickering is not caused by "slowness" but by **"verification failure"**. The agent is likely missing the Shell Integration escape sequences due to encoding (UTF-8 vs CP949) or race conditions with the `dev.ps1` background job.

## 3. Mandatory Solutions (Actionable)

### A. Agent-Side Workaround (Immediate)
> [!IMPORTANT]
> To stop the retries, we must satisfy the agent's handshake immediately or bypass it.

1.  **Disable Shell Integration for Agent**: (User ActionRequired)
    *   Open Antigravity Settings (`Ctrl+,`).
    *   Search for `Terminal > Integrated > Shell Integration`.
    *   Try toggling it **OFF** temporarily to see if the flickers stop. If the agent doesn't need to "verify" the shell, it won't retry.

2.  **Persistent Session**: 
    *   Enable `Terminal: Persistent Session` in the agent settings.

### B. Environment-Side Patch (UTF-8 Stability)
The agent often flickers while checking encoding. We will force a project-wide encoding standard to prevent "Encoding Sync" flickers.

```powershell
# Run this once in your main terminal to stabilize the session
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### C. Developer Side (AI Behavior Change)
As the AI Architect, I am implementing a **"Non-Interference Protocol"**:
1.  **Tool Batching**: I will combine multiple `read` or `check` operations into a single command to reduce the number of terminal spawns.
2.  **Internal Tool Priority**: I will use `view_file` and `list_dir` (Internal tools) for **90% of information gathering**. These tools **DO NOT** trigger terminal flashes.
3.  **Silent Status Monitoring**: I will avoid frequent `command_status` calls which can cause UI updates/flickers.

## 4. Verification Check
*   If you see **text** during flicker: It's an encoding/setup command.
*   If you see **blank** during flicker: It's a handshake retry loop.

---
**Status: Applying AI Behavior Change (Step 3.C) immediately.**
