# Meaningful Learning

An AI-powered tool for building interconnected knowledge graphs. Enter a topic, and the AI generates a structured graph of related concepts, helping you understand how ideas connect and identify knowledge gaps.

## Features

- **AI-Generated Knowledge Graphs** — Enter any topic and generate a visual graph of related concepts
- **Interactive Graph View** — Zoom, pan, and click nodes to explore connections
- **Track What You Know** — Mark concepts as known/unknown to focus your learning
- **AI Provider Flexibility** — Works with Ollama (local) or any OpenAI-compatible API
- **Persistent Courses** — Your courses and progress are saved in the browser

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure AI Provider

Open **Settings** (gear icon) and configure your AI endpoint:

- **Local (Ollama)**: Set base URL to `http://localhost:11434/v1`
- **OpenAI**: Set base URL to `https://api.openai.com/v1` and add your API key

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start learning.

## Deployment

This app is configured for static export and deploys to GitHub Pages via GitHub Actions on push to `main`.

## Tech Stack

- Next.js 16 (App Router)
- React Flow for knowledge graph visualization
- Tailwind CSS
- Ollama / OpenAI-compatible API
