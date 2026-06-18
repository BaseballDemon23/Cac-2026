# LearnBuddy

An accessible, all-subject tutoring app with an AI helper named **Ollie**, built for
learners with autism, ADHD, and dyslexia. Made for the Congressional App Challenge.

## What's inside

- **Math** — auto-generated problems, a number pad, and dot pictures.
- **Reading, Spelling, Science** — multiple-choice questions.
- **Ollie**, an AI helper that gives one small hint at a time (never the answer),
  in short, literal, encouraging sentences.
- **Accessibility built in:** read-aloud on everything, adjustable text size,
  easy-read letter spacing, calm mode (no motion), sound on/off, three color themes
  (Calm, Soft Dark, High Contrast).

## Project structure

```
learnbuddy/
├─ api/
│  └─ chat.js         # serverless backend — keeps your API key secret
├─ src/
│  ├─ App.jsx         # the whole app (edit SUBJECTS near the top to add subjects)
│  ├─ main.jsx        # React entry point
│  └─ index.css       # minimal global styles
├─ index.html
├─ package.json
├─ vite.config.js
└─ .gitignore
```

## Run it locally

```bash
npm install
npm run dev
```

This starts the front-end at the URL it prints. The app works fully **except Ollie**,
because the AI helper needs the backend (and your secret key) — see below.

## Make Ollie work (deploy)

Ollie calls `/api/chat`, which forwards to Anthropic using a key that stays on the server.

1. Get an API key from <https://console.anthropic.com>.
2. Push this folder to GitHub.
3. Import the repo at <https://vercel.com> (free). It auto-detects Vite.
4. In the Vercel project settings, add an Environment Variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key
5. Deploy. Ollie now works on the live site.

To test Ollie locally instead, install the Vercel CLI and run `vercel dev`
(plain `npm run dev` does not run the `api/` function).

> **Never put your API key in the front-end code or commit it to GitHub.**
> It belongs only in the environment variable. The `.gitignore` already excludes `.env`.

## Add a new subject

In `src/App.jsx`, find the `SUBJECTS` array near the top and add one object:

```js
{
  id: "history", label: "History", icon: BookOpen, mode: "choice",
  blurb: "People and events",
  bank: [
    { q: "Who was the first U.S. president?",
      options: ["George Washington", "Abe Lincoln", "John Adams", "Tom Hanks"],
      answer: "George Washington" },
  ],
}
```

A new tile appears automatically. Math is the only `mode: "math"` subject; everything
else uses `mode: "choice"`.

## Ideas to take it further

- Save stars and progress so they persist between visits (e.g. `localStorage` or a free database).
- Let Ollie generate fresh questions instead of fixed banks.
- Adaptive difficulty that eases up after wrong answers.
- Let a teacher or parent add their own question banks.
