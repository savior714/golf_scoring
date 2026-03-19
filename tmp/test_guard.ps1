. "c:\develop\golf_scoring\scripts\surgical_guard.ps1"
"This is a long test string that should be truncated by our new surgical guard function if it exceeds the limit." | Out-Surgical -MaxChars 20
