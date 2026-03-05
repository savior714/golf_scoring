# Course Information Import Session

> Tag this file to start a new conversation and continue the context exactly as before.
> Example Start: "Let's continue the course information import work based on COURSE_IMPORT_SESSION.md."

---

## Work Overview

Provide golf course introduction page URLs one by one, test them with the Edge Function, and if no issues are found, save them in the actual app.

**Role Division:**
- AI: Call Edge Function with URL → Parse results and identify anomalies → Fix code if necessary.
- User: Provide URLs → Final review and save in the app's admin screen.

---

## Test Procedure (Repeat for each URL)

```bash
curl -s -X POST "https://eqzobqeotfxvsllforew.supabase.co/functions/v1/course-import" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"mode":"url","url":"<URL>"}'
```

**Decision Criteria:**
- `confidence: high` + all hole par/distance normal → Guide user to save in app.
- `confidence: medium` → Check missing fields before deciding.
- `confidence: low` or error → Identify cause and fix code or suggest Text mode.
- `JS_RENDER_REQUIRED` → Copy page text and retry with `mode: text`.

---

## Infrastructure Info

| Item | Value |
|------|-------|
| Supabase Project ID | `eqzobqeotfxvsllforew` |
| Edge Function | `supabase/functions/course-import/index.ts` |
| AI Model | `gemini-2.5-flash` |
| Admin Screen | `app/(tabs)/admin.tsx` |
| Core Logic | `src/modules/golf/golf.repository.ts` → `registerClub` |

**Deployment Command (Run after code changes):**
```powershell
npx supabase functions deploy course-import
```

**Always run with git push:**
```powershell
git push origin main
npx supabase functions deploy course-import
```

---

## Key Rules & Constraints

- **Par Allowable Range:** 3–7 (Specialized courses like Gunsan CC Kimje=PAR6, Jeongeup=PAR7 exist).
- **Par Sum Validation:** Not fixed (36/72). Only check per-hole valid range (3–7).
- **Edge Function Response:** Always HTTP 200. Errors are identified via `{ error: 'CODE', message: '...' }`.
- **Multi-course Clubs:** Import each course URL separately → Accumulated via upsert if the club name matches.
- **Final Saving Party:** Always the user directly in the app's admin tab.

---

## Known Error Patterns

| Symptom | Cause | Remedy |
|---------|-------|--------|
| `limit: 0` 429 error | Gemini API key free quota is 0 (billing-connected GCP project). | Re-issue key via a New Project in AI Studio. |
| `JS_RENDER_REQUIRED` | Site requires JS rendering (extracted text < 300 chars). | User copies page text and uses Text mode. |
| `par: null` + `confidence: low` | Non-standard PAR (e.g., 6/7) was treated as null → Now fixed by allowing 3–7. Check original HTML if recurring. | Re-adjust prompt rules after checking HTML. |
| Anomalous distance (e.g., 963m) | Special data on the original site (e.g., PAR7 long hole). | Verify with original site; accept if it's the actual value. |

---

## Work History

### Completed Clubs

| Club Name | Course Count | Result | Remarks |
|-----------|--------------|--------|---------|
| Naejangsan CC | 2 (Hongdanpung, Cheongdanpung) | high | - |
| Gunsan Country Club | 8 (Jeonju/Iksan/Kimje/Jeongeup/Buan/Namwon/Tournament-OUT·IN) | high | Kimje PAR6, Jeongeup PAR7 |

---

## How to Start Next Conversation

Open this file in the IDE and tag it:

> "Let's continue the course information import work based on COURSE_IMPORT_SESSION.md."

The AI will then be ready to receive URLs based on this context.
