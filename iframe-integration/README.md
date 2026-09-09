# Rocket.Chat iFrame Integration Example

A minimal React application that embeds a room from a Rocket.Chat workspace using an iframe. Users log in through the app's own form, the app mints a Rocket.Chat session token for them behind the scenes, and the embedded room opens with no Rocket.Chat login screen.

This example accompanies the [Chat Engine with iFrame Tutorial](https://developer.rocket.chat/docs/chat-engine-with-iframe-tutorial). <!-- TODO: confirm final tutorial URL before merge -->

## Prerequisites

- Node.js 20.19 or later (or 22.12 or later)
- A Rocket.Chat workspace, version 8.0 or later, where you are an administrator
- The workspace configured for iframe integration as described in the [IFrame Integration guide](https://developer.rocket.chat/docs/iframe-integration): iframe access allowed, iframe communication enabled, iframe authentication enabled, and CORS enabled
- The `CREATE_TOKENS_FOR_USERS_SECRET` environment variable set in your workspace deployment. This is required by the [Create User Token endpoint](https://developer.rocket.chat/apidocs/create-users-token) since Rocket.Chat 8.0. On SaaS workspaces, contact Rocket.Chat support to set it.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file from the template and fill in the values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Value |
   |---|---|
   | `VITE_REST_URL` | Your workspace REST API base URL, for example `http://localhost:3000/api/v1` |
   | `VITE_ADMIN_USER_ID` | The user ID of a workspace administrator |
   | `VITE_ADMIN_ACCESS_TOKEN` | A personal access token for that administrator |
   | `VITE_CREATE_TOKEN_SECRET` | The same value as `CREATE_TOKENS_FOR_USERS_SECRET` in your deployment |

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open the printed URL (default `http://localhost:5173`). Restart the dev server whenever you change `.env`.

4. Log in with the username and password of a workspace user. The general channel of your workspace appears embedded in the page.

## How it works

1. The login form sends the user's credentials to the Rocket.Chat login endpoint.
2. With the returned user ID, the app calls `users.createToken` (authenticated with the admin credentials and the shared secret) to mint a session token for the user.
3. The token is stored in localStorage, and the app waits for the iframe's `startup` event.
4. On `startup`, the app sends the `login-with-token` message with the session token.
5. When the iframe confirms login with `Custom_Script_Logged_In`, the app sends the `go` command to open the general channel.

## Security note

This example keeps the admin token and the shared secret in front end environment variables for simplicity. In production, token creation belongs on your backend: the browser should never hold admin credentials or the shared secret.
