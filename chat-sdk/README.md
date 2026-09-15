# Chat SDK example

Example React application for the [Chat SDK tutorial](https://developer.rocket.chat/docs/chat-sdk) in the Rocket.Chat Chat Engine documentation. It logs in to a workspace with `@rocket.chat/ddp-client`, lists the user's rooms, loads message history, and sends and receives messages in real time.

## Requirements

- Node.js 22 or later
- A Rocket.Chat workspace (8.7 or later) with CORS enabled for the app origin

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_WORKSPACE_URL` in `.env` to your workspace URL, then open the URL that Vite prints and log in with a workspace user.

## Note on installation

`package.json` includes an `overrides` entry for `typia`. Without it, `npm install` fails because of how `@rocket.chat/core-typings` currently declares that dependency. The tutorial explains this in the installation step.