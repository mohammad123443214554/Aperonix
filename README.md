# Aperonix AI

Aperonix AI is a long-term AI assistant project created by Mohammad Khan.

## Phase 1

The first phase is intentionally focused:

- Single-page AI chat interface
- Groq API integration through a server-side route
- Secret API key kept in environment variables
- Dedicated system prompt module
- Aperonix visual identity using the supplied logo
- Scalable separation between UI, API route, and AI provider code

## Environment variables

Set these in Vercel (or locally in `.env.local`):

```env
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-20b
```

Never commit the real Groq API key.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
