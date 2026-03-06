# Deployment Plan — Autonomous Execution

This plan is designed to be run via `claude -p`. Every step uses CLI commands. No manual intervention required.

## Prerequisites (already confirmed)

- `gh` CLI: installed, authenticated as `RussellStover1983`
- `railway` CLI: installed, authenticated as `russell.stover@gmail.com`
- Git remote: `origin` -> `https://github.com/RussellStover1983/medieval-conquest.git`
- Server changes (SPA fallback, 0.0.0.0 binding, postinstall, Procfile, etc.) already applied

---

## Step 1: Verify the production build works

Run `npm run build` from the project root. If it fails, fix any errors before continuing. This produces `dist/` which the server serves.

---

## Step 2: Verify the server starts and serves the built client

Run `node server/src/server.js` briefly (start it, confirm it prints the startup message, then kill it). This ensures the server can initialize the database and bind to a port.

Use a timeout — start the server, wait 3 seconds, then kill it. Check that stdout contains "Medieval Conquest server running".

---

## Step 3: Add a `.gitignore` entry for the SQLite database

The file `server/medieval_conquest.db` is generated at runtime and should not be committed. Check `.gitignore` and add `server/*.db` if not already present.

---

## Step 4: Commit all pending changes and push to GitHub

Stage all modified and new files. Do NOT stage:
- `node_modules/`
- `server/node_modules/`
- `dist/`
- `*.db`

Create a commit with a message like: "Prepare for web deployment: add production server config, Procfile, and deployment scripts"

Push to `origin master`.

---

## Step 5: Create a Railway project and deploy

Run these commands in order:

1. `railway init` — create a new Railway project. If prompted for a name, use "medieval-conquest".
2. `railway up --detach` — deploy the current directory to Railway. This uploads the code, Railway will run `npm install` (which triggers `postinstall` to install server deps), then `npm run build`, then uses the Procfile to start.
3. Wait for the deployment to complete. Use `railway status` to check.
4. Run `railway domain` to generate a public `.up.railway.app` URL.

---

## Step 6: Set environment variables on Railway

Run these commands:

1. `railway variables set NODE_ENV=production`
2. Generate a random JWT secret and set it:
   ```
   railway variables set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```
3. Generate a random admin key:
   ```
   railway variables set ADMIN_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
   ```

Setting variables triggers a redeploy automatically.

---

## Step 7: Verify the deployment

1. Get the public URL from `railway domain` or `railway open`.
2. Use `curl` to verify:
   - `curl -s <URL>` — should return HTML containing "Medieval Conquest"
   - `curl -s <URL>/api/changelog` — should return JSON (empty array `[]` is fine)
3. Print the public URL as the final output so the user can share it.

---

## Step 8: Update the README or print the URL

Print a clear message with the deployed URL in the format:

```
DEPLOYED! Your game is live at: https://<project>.up.railway.app
Share this URL with your friends to play together.
```

---

## Error handling

- If `railway init` fails because a project already exists, use `railway link` instead.
- If `railway up` fails, check `railway logs` for errors and fix them.
- If the build fails on Railway, check that `postinstall` ran (server deps installed) and that `npm run build` succeeds.
- If WebSocket connections fail, verify Railway is not blocking WS — Railway supports WebSockets by default on the same port.
