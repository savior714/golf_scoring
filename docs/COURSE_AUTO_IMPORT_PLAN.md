# Course Data Auto-Import System Plan

## 1. Status and Problem Definition

### Current Workflow (Manual)
1. Directly access the golf club's website.
2. Check hole-by-hole Par, Distance (Yard/Meter), and Course Name on the course introduction page.
3. Manually enter Club Name → Course Name → Hole-by-hole data in the app's admin screen.
4. Requires manual entry of at least 54 cells (Hole Number × Par + Distance) for an 18-hole club.

### Core Problems
- **Time Cost**: Takes about 10–15 minutes to enter a single 9-hole course; approximately 30–60 minutes for one club (usually 3–4 courses).
- **Data Entry Risk**: High probability of typos in Par or Distance during manual entry.
- **Scalability Limit**: Admin burden increases linearly as the number of golf clubs grows.
- **Information Inconsistency**: Updates (e.g., Par changes, distance adjustments) are often missed during course renewals.

---

## 2. Objective

**Automate data entry: Just enter the URL of the golf club's course introduction page. Hole-by-hole Par, Distance, and Course Name will be automatically populated. The admin only needs to review and save.**

| Metric | Current | Target |
|--------|---------|--------|
| Entry Time per Club | 30–60 mins | 2–3 mins (including review) |
| Typo Risk | High | Low (AI extraction + Human review) |
| Reflecting Updates | Manual | Re-extract and compare |

---

## 3. System Architecture

```
[Admin App]
    │
    │  1. Paste Course Intro Page URL (Admin explores manually)
    ▼
[Supabase Edge Function: course-import]
    │
    ├─ A. Static HTML Response (Most club sites)
    │       └─ fetch(url) → Get HTML → Gemini API Parsing
    │
    └─ B. Sites Requiring JS Rendering (Fetch failure or LOW confidence)
            └─ Return Error Response
                    └─ App guides to "Text Paste" mode
                            └─ Admin copies table text from browser → Pastes into App
                                    └─ Gemini API parses text
    │
    ▼
[AI Parsing Layer: Google Gemini 2.5 Flash]
    │  HTML or Pasted Text → Extract Course Name, Hole Number, Par, Distance
    ▼
[Structured Response JSON]
    │
    ▼
[Admin App Preview UI]
    │
    │  2. Admin reviews/edits and saves
    ▼
[Supabase DB Save]
    golf_clubs → golf_courses → golf_holes → hole_distances
```

**Core Principle: URL exploration is performed manually by the admin.**
Since admins already visit the club website to find course info, copying the URL solves 80% of the automation. This eliminates the cost and dependency of external search APIs.

---

## 4. Input Strategy (Targeting $0 Cost)

### 4-1. Primary Path: URL → Static HTML Crawling

The admin finds and pastes the golf club's course introduction page URL.
(No change in workflow as they are already accessing this page.)

```
Admin Action: Club Website → Course Intro Tab → Copy URL → Paste into App
```

| Item | Content |
|------|---------|
| Server Cost | Free (Deno fetch) |
| Success Rate | Approx. 60–70% for domestic club sites (Static HTML based) |
| Failure Cases | React/Vue SPA-based sites (JS rendering required) |

### 4-2. Auxiliary Path: Direct Text Paste (Handling JS Sites, $0 Cost)

If URL crawling fails or confidence is LOW, the app displays:

> "This club page is difficult to extract automatically.
> Please select and copy (Ctrl+C) the table content from your browser,
> then paste it into the text area below."

Since the admin is already viewing the page, a simple Drag-Select → Copy → Paste takes only 10 seconds.
The Gemini API can parse plain text just as effectively as HTML.

**Advantages:**
- No Browserless.io ($49/mo) required.
- 100% coverage for all club sites (regardless of rendering method).
- Minimal learning curve for admins.

### 4-3. Long-term: Seed DB Construction

Once a list of 20–30 frequently visited clubs is established, gather the data once and load it into Supabase as seed data. After that, identical clubs can be selected via search immediately.

---

## 5. Technical Implementation Details

### 5-1. AI Parsing Model Selection Strategy

**Default: Google Gemini 2.5 Flash (Free Tier)**
- API keys generated via Google AI Studio (Free, no credit card required).
- Free Limit: **1,500 requests/day** → More than enough for registering 1–2 clubs per week.
- Quality: Highly capable of structured data extraction (table parsing).

### 5-2. Supabase Edge Function: `course-import`

```typescript
// supabase/functions/course-import/index.ts

import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

interface ImportRequest {
  mode: 'url' | 'text';
  url?: string;    // Mandatory for mode="url"
  text?: string;   // Mandatory for mode="text" (pasted text)
}

const PROMPT_TEMPLATE = (content: string) => `
The following is content from a golf course introduction page.
Extract hole information per course and return it ONLY in the following JSON format. Output JSON only without explanation.

Response Format:
{
  "clubName": "Full Club Name",
  "courses": [
    {
      "courseName": "Course A",
      "holes": [
        { "holeNumber": 1, "par": 4, "distances": [{ "teeColor": "White", "distanceMeter": 385 }] }
      ]
    }
  ],
  "confidence": "high"
}

Rules:
- par must be an integer between 3 and 7.
- distanceMeter: Meter unit. If only yards exist, convert using ×0.9144. Use null if unavailable.
- teeColor: Standardize as "Black", "Blue", "White", "Red". Default to "White" if only one distance exists.
- Set confidence to "low" and use null for uncertain values.

Content:
${content}`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')        // Remove tags
    .replace(/\s{2,}/g, ' ')         // Clean up whitespace
    .trim()
    .substring(0, 40000);            // 40KB limit (token savings)
}

Deno.serve(async (req) => {
  const { mode, url, text }: ImportRequest = await req.json();

  let inputContent: string;

  if (mode === 'url') {
    const res = await fetch(url!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(10000)
    });
    const html = await res.text();
    inputContent = stripHtml(html);

    // If text is too short, assume JS rendering is required
    if (inputContent.length < 300) {
      return new Response(JSON.stringify({
        error: 'JS_RENDER_REQUIRED',
        message: 'This site is difficult to extract automatically. Please use Text Paste mode.'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  } else {
    inputContent = text!.substring(0, 40000);
  }

  // Call Gemini Flash
  const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Use stable version or latest as configured

  const result = await model.generateContent(PROMPT_TEMPLATE(inputContent));
  const responseText = result.response.text()
    .replace(/^```json\n?/, '').replace(/\n?```$/, ''); 

  return new Response(responseText, {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Effect of `stripHtml` Pre-processing**: Removing all HTML tags and leaving only text saves 70–80% of tokens compared to the same content. This easily stays within Gemni Flash's free tier limits.

### 5-3. Admin App UI Flow

```
┌──────────────────────────────────────────────────┐
│  Auto-import Course Information                  │
│                                                  │
│  Course Intro Page URL                           │
│  ┌────────────────────────────────────────────┐  │
│  │ https://www.clubname.co.kr/course/intro   │  │
│  └────────────────────────────────────────────┘  │
│  [Import]                                       │
│                                                  │
│  ── Guide for Failure (JS Rendering Sites) ───   │
│  "Drag and copy the course table from your      │
│   browser, then paste it below."                │
│  ┌────────────────────────────────────────────┐  │
│  │ (Paste Area)                                 │  │
│  └────────────────────────────────────────────┘  │
│  [Import via Text]                              │
│                                                  │
│  ── Preview ──────────────────────────────────   │
│  Club: OO Country Club      Confidence: [● HIGH]  │
│  [Course A] [Course B] [Course C]               │
│  Course A (9 holes) / Par Total: 36 ✓            │
│  ┌──────┬──────┬────────┬────────┐             │
│  │ Hole │  Par │ Meter  │  Tee   │             │
│  ├──────┼──────┼────────┼────────┤             │
│  │  1   │  [4] │  [385] │ [White]│ ← Direct Edit │
│  └──────┴──────┴────────┴────────┘             │
│                                                  │
│  [Save All]   [Re-import]   [Cancel]            │
└──────────────────────────────────────────────────┘
```

**UI Behavior Rules:**
- Confidence HIGH: Allow immediate save.
- Confidence MEDIUM: Yellow warning + "Review before saving" guidance.
- Confidence LOW: Disable save button, enable after manual corrections.
- Auto-calculate Par Total: Display red warning if 9h != 36 (unless standard is different).
- Highlight outlier distances in orange.

---

## 6. Implementation Roadmap

### Phase 1: MVP — URL Crawling + Text Fallback (No External API Costs)

**Tasks:**
1. Create Supabase Edge Function `course-import`.
2. Add "Auto-import" section to the Admin screen.
3. Implement Preview component (Editable table, real-time Par sum calculation, confidence badge).
4. Reuse existing `clubRepository.registerClub` for saving.

### Phase 2: Parsing Quality Stabilization

**Goal**: Handle LOW confidence responses.

**Strategies:**
- Show "Retry" button on LOW confidence.
- Guide to Text Paste mode on persistent failure (often more reliable than AI fallback).
- Result Caching: Store results for 30 days for identical URLs to skip redundant API calls.

### Phase 3: Seed DB Construction

Establish a pre-loaded database of 20–30 popular clubs.

### Phase 4: Course Change Detection (Long-term)

Automatically detect Par/Distance changes in registered clubs using scheduled cron jobs.

---

## 7. Tech Stack & Cost Estimation

| Component | Technology | Estimated Cost |
|-----------|------------|----------------|
| Edge Function Runtime | Supabase Edge Functions (Deno) | Free |
| Static Crawling | Deno Native fetch | Free |
| **AI Parsing (Primary)** | **Gemini 2.5 Flash (Google AI Studio)** | **Free (1,500 req/day)** |
| AI Parsing (Fallback) | Claude Haiku (Optional) | < $0.001 per club |
| JS Site Handling | Manual Text Paste | Free |

---

## 8. Data Quality Assurance Strategy

### Pre-save Auto-validation Rules

1. **Par Sum Validation**: Check for standard 36/72 (Warn if inconsistent).
2. **Hole Number Continuity**: Ensure holes are sequential from 1 to N.
3. **Par Range Validation**: Ensure Par is between 3 and 7.
4. **Distance Outlier Warning**:
   - Par 3: 80m – 230m
   - Par 4: 250m – 480m
   - Par 5: 430m – 600m
   - Highlight cells in orange if outside these ranges.

---

## 9. Risks and Mitigation

| Risk | Probability | Mitigation |
|------|-------------|------------|
| Site Crawling Blocked | Medium | Automatically guide to Text Paste mode. |
| JS Rendering Required | High | Use Text Paste mode as 100% reliable fallback. |
| AI Parsing Errors | Low | Mandatory auto-validation + Final human review. |

---

## 10. Environment Variables

```bash
# Supabase Edge Function Secret
GOOGLE_AI_API_KEY=<YOUR_GOOGLE_AI_API_KEY>
```

---

*First Written: 2026-03-05*
*Updated to English: 2026-03-06*
