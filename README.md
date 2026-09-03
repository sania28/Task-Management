# Dispatch — Task Manager

A full-stack task management app: user accounts, task CRUD, and live updates
across tabs/devices (via Server-Sent Events).

**Zero external dependencies** — the backend runs on Node's standard library
only (`http`, `crypto`, `fs`). No `npm install` needed, on your machine or on
the server. That also means there's nothing here to `npm audit`, no
lockfile drift, and it deploys anywhere Node runs.

## How it's built

- **Backend** (`/backend`): a plain `http` server. Passwords are hashed with
  `crypto.scrypt`; login sessions are signed tokens (same idea as a JWT,
  built with `crypto.createHmac`, verified on every request). Data is stored
  in two JSON files under `backend/data/` — enough for learning/small use;
  see "Growing beyond this" below for swapping in a real database.
- **Frontend** (`/frontend`): plain HTML/CSS/JS, no build step. It calls the
  API with `fetch` and listens for live changes with `EventSource` (SSE).
- **Real-time updates**: implemented with **SSE instead of WebSockets**.
  Task changes only need to flow server → browser, which is exactly what SSE
  is for, using plain HTTP — no extra dependency required. (If you want true
  bidirectional WebSockets later, swap the `/api/tasks/stream` route for the
  `ws` package.)

## Run it locally

```bash
cd backend
node server.js
```

Open **http://localhost:3001** — the backend serves the frontend directly,
so there's only one thing to run. Create an account, add a few tasks, and
open the app in a second tab to watch live updates sync between them.

Optional: set a real secret before running in anything but a sandbox —
```bash
export TOKEN_SECRET="a-long-random-string"
export PORT=3001
node server.js
```

## Deploying to your own server (VPS)

This assumes a fresh Ubuntu VPS (DigitalOcean, Linode, EC2, etc.) with a
domain pointed at it. Steps:

1. **Install Node** on the server:
```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
```

2. **Copy the project to the server**, e.g. with `scp` or `git`:
```bash
   scp -r task-manager your-user@your-server-ip:/home/your-user/
```

3. **Set a real token secret and start it**:
```bash
   cd task-manager/backend
   export TOKEN_SECRET="$(openssl rand -hex 32)"
   export PORT=3001
   node server.js
```

4. **Keep it running** after you disconnect, with `pm2` (or `systemd`):
```bash
   sudo npm install -g pm2
   pm2 start server.js --name dispatch --env TOKEN_SECRET="$(openssl rand -hex 32)"
   pm2 save
   pm2 startup   # prints a command to run so pm2 survives reboots
```

5. **Put Nginx in front of it** for HTTPS and a clean domain (SSE needs
   `proxy_buffering off` or updates will lag):
```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Connection "";
           proxy_set_header Host $host;
           proxy_buffering off;
       }
   }
```
   Then get a free certificate:
```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
```

That's it — `yourdomain.com` now serves the app over HTTPS, proxied to the
Node process pm2 is keeping alive.

## Growing beyond this

Once the basics make sense, natural next steps:
- Swap `backend/db.js` for a real database (Postgres via `pg`, or SQLite via
  `better-sqlite3`) — the function signatures in `db.js` are the only thing
  you'd need to reimplement.
- Swap the hand-rolled token/SSE code for `jsonwebtoken` and `socket.io` —
  useful once you want a second server instance (SSE/tokens here are
  single-process; a real deployment behind a load balancer needs shared
  session storage and a pub/sub layer for broadcasting).
- Add password reset, email verification, and rate limiting on `/api/auth/*`.
