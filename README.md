# S-Move Technologies — corporate website

Static marketing/credibility site for **S-Move Technologies Ltd** (SC892508), served by a tiny Express
app so it deploys on Railway exactly like the other S-Move projects. Lives at **smt.s-move.co.uk**.

## Structure
```
server.js          Express static server (+ health check at /healthz)
public/
  index.html       Home (hero, products, approach, company, contact)
  privacy.html     Privacy Policy
  terms.html       Terms of Use
  styles.css       All styling (dark tech theme)
  favicon.svg      Logo mark
```

## Run locally
```
npm install
npm start          # http://localhost:3000
```

## Deploy (Railway + subdomain) — one-time setup
1. **GitHub:** create a new repo (e.g. `SMovetech/smt-website`), push this folder.
2. **Railway:** New Project → Deploy from GitHub → pick the repo. It auto-detects Node and runs `npm start`.
3. **Custom domain in Railway:** Service → Settings → Networking → Custom Domain →
   enter `smt.s-move.co.uk`. Railway shows a **CNAME target** (e.g. `xxxx.up.railway.app`).
4. **DNS (where s-move.co.uk is managed):** add a **CNAME** record:
   - Host/Name: `smt`
   - Value/Target: the Railway target from step 3
   - Proxy/DNS-only as your provider requires
5. Wait for DNS to propagate; Railway issues the SSL certificate automatically. Done.

Afterwards, deploys are automatic on every `git push` (same as the other apps).

## Editing content
Everything is plain HTML/CSS — edit files in `public/` and redeploy. Company/legal details
appear in the footer of every page and in the "Company details" panel on the home page.
