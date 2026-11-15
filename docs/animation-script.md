# DocFlow — Animated Explainer Script

**Length:** ~90 seconds · **Format:** 16:9, 1920×1080 (cut-downs: 1:1 and 9:16)
**Tone:** calm, confident, practical · **Pace:** ~140 words per minute of voice-over

## Visual language

| Element | Spec |
|---|---|
| Accent | Brand blue `#1E59FF` (hover/strong `#0F43E6`, soft tint `#EEF4FF`) |
| Neutrals | Background `#F6F6F9`, cards `#FFFFFF`, lines `#E4E4EA`, ink `#111117` |
| Status colours | Queued sky, Processing amber, Completed emerald, Failed rose (always with a label) |
| Type | Geometric sans (the app's UI font); numbers in tabular figures |
| Shapes | Rounded cards (16px radius), soft shadows, thin 1.5px icon strokes (Lucide style) |
| Motion | Ease-out for entrances (~250 ms), ease-in-out for moves (~400 ms); nothing bounces except the "thinking" dots; no motion longer than 600 ms |

Every UI moment below mirrors a real screen in the app, so the animation can be built from screenshots or recreated as vector UI.

---

## Scene 1 — The problem (0:00–0:08)

**Visual:** A messy desk of documents slides in from the edges: an invoice, a contract, a scanned receipt, a long PDF. Papers overlap, a red "due?" sticky note flutters.
**Motion:** Papers drift in with slight rotation, then pile up and jitter once.
**VO:** "Invoices, contracts, long reports. The answers are in there somewhere — if you have time to dig."
**On-screen text:** *Too many documents. Not enough time.*

## Scene 2 — Meet DocFlow (0:08–0:13)

**Visual:** The pile is swept into a single blue document icon, which settles into the DocFlow logo. Background clears to `#F6F6F9`.
**Motion:** Papers fold into one card (scale down + stack), card morphs into the logo, logo sits for a beat.
**VO:** "DocFlow reads them for you."
**On-screen text:** **DocFlow**

## Scene 3 — Upload (0:13–0:22)

**Visual:** The *New document* screen. A PDF file (`acme-invoice-0421.pdf`) is dragged onto the dropzone. Below, the three processing cards: **Document summary**, **Invoice extraction**, **Contract metadata**. The cursor picks *Invoice extraction*; a short instruction is typed: *"Flag anything unusual."*
**Motion:** File drops with a soft landing; dropzone border turns blue; progress bar fills 0→100%.
**VO:** "Drop in a file and choose what you need: a summary, invoice details, or contract terms. Add instructions if you like."
**Callout:** *PDF, DOCX, JPG, PNG, TIFF · up to 10 MB*

## Scene 4 — Processing in the background (0:22–0:32)

**Visual:** The document page. A run card shows the status pill moving **Queued → Processing → Completed**. On the right, *Worker attempts* lists "Attempt 1".
**Motion:** Pill colour cross-fades sky → amber (pulsing dot) → emerald. A thin indeterminate bar slides under the card while processing.
**VO:** "Processing runs in the background, so you can keep working. DocFlow tracks every attempt, and you can cancel or retry at any time."
**Optional beat (2s):** A second run flashes **Failed** in rose, the cursor clicks **Retry**, and it turns **Queued** again.

## Scene 5 — Structured results (0:32–0:42)

**Visual:** The result view for the invoice: vendor, customer, invoice number, dates, subtotal, tax, total, and a line-items table. An **Export** menu opens with **JSON** and **CSV**.
**Motion:** Fields fill in top to bottom (staggered 40 ms), numbers count up to their final value; the CSV icon drops into a download tray.
**VO:** "Results come back structured — every field, every line item — ready to export as JSON or CSV."
**On-screen text:** *From PDF to data in seconds.*

## Scene 6 — Ask the document (0:42–0:56)

**Visual:** The *Ask questions* tab on a stored service agreement. The user asks: *"How much notice is needed to terminate?"* Thinking dots, then the answer: *"Either party must give 60 days' written notice."* A source chip **p. 2** sits under it. The cursor clicks the chip; the PDF preview slides up, opened at page 2, with the quoted sentence highlighted.
**Motion:** Question bubble slides in from the right; answer text types in; the citation chip pops (scale 0.95→1); page preview scrolls into view and the quote gets a blue highlight sweep.
**VO:** "Need something specific? Ask. Every answer quotes the page it came from — click the source and see it for yourself."
**On-screen text:** *Answers you can check.*

## Scene 7 — Chat, images and voice (0:56–1:10)

**Visual:** The Chat screen with the conversation list on the left. Three quick vignettes:
1. A typed question streams its answer word by word, with a blinking caret.
2. A photo of a receipt is attached with the paperclip; the answer reads the total.
3. The microphone is tapped, a red recording dot and timer run, and the spoken words appear in the message box.

**Motion:** Each vignette is a 4-second cut with a quick slide transition; the streaming text uses the real blinking caret; the waveform pulses while recording.
**VO:** "Or just chat. Ask anything, attach an image or a PDF, or speak your question — your conversations are saved and ready to pick up again."

## Scene 8 — Stay on top of it (1:10–1:20)

**Visual:** The dashboard. Stat tiles (Documents, Processing runs, Completed, Failed) count up. Below, the *AI usage* card: answers, error rate, response time, tokens, and the *Tokens per day* bar chart.
**Motion:** Tiles count up together; the bars rise left to right; one bar is hovered to show its tooltip.
**VO:** "Your dashboard shows what's running, what's done, and how your AI usage adds up."

## Scene 9 — Close (1:20–1:30)

**Visual:** Pull back from the dashboard; the UI shrinks into the DocFlow logo on a clean background. Tagline and call to action appear beneath.
**Motion:** Scale out with a slight blur; logo settles; text fades up line by line.
**VO:** "DocFlow. Upload it, understand it, get on with your day."
**On-screen text:** **DocFlow** — *Turn documents into data you can use.* · **Get started free**

---

## Shot list summary

| # | Time | Screen | Key motion |
|---|---|---|---|
| 1 | 0:00–0:08 | Messy desk | Papers pile up |
| 2 | 0:08–0:13 | Logo reveal | Papers fold into logo |
| 3 | 0:13–0:22 | New document | Drag, drop, pick type, upload bar |
| 4 | 0:22–0:32 | Document run | Status Queued → Processing → Completed (+ retry) |
| 5 | 0:32–0:42 | Result view | Fields fill, numbers count, export |
| 6 | 0:42–0:56 | Ask questions | Answer + p. 2 citation → page preview |
| 7 | 0:56–1:10 | Chat | Streaming, image attachment, voice |
| 8 | 1:10–1:20 | Dashboard | Tiles count up, usage bars rise |
| 9 | 1:20–1:30 | Close | Logo + CTA |

## Cut-downs

- **30 s:** Scenes 2, 3, 4 (no retry), 5, 9.
- **15 s (social, 9:16):** Scene 3 drop → Scene 5 fields fill → Scene 6 citation click → logo. VO: "Drop in a document. Get the data. Ask it anything — with the page to prove it. DocFlow."

## Production notes

- Use the real app on the local backend to capture screens; the test documents in this project (service agreement, invoice image) match the dialogue above.
- Keep all on-screen text in UI ink colours; the brand blue is for marks, buttons, and highlights only.
- Captions: burn in for the 1:1 and 9:16 versions; provide an SRT for the 16:9 master.
- Music: light, steady electronic bed (~100 BPM), ducked under the VO; a soft "tick" sound on status changes and a "pop" on the citation chip.
