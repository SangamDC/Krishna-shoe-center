# Krishna Shoe Center

Wholesale footwear catalog (client side) + inventory ledger (owner side).

## Run locally
```
npm install
npm run dev
```

## Before you launch
- Change `OWNER_PIN` in `src/App.jsx` from the demo value.
- Update the WhatsApp number and address in Owner Desk → Shop Settings (or edit `DEFAULT_SETTINGS` in `src/App.jsx`).
- Data is saved in the browser's `localStorage` — per device, not shared across customers. Fine for a demo/single-device use; for a real shared live catalog, add a backend (Firebase/Supabase).

## Deploy — GitHub Pages
```
npm install
npm run build
npm run deploy
```
Then in your GitHub repo: Settings → Pages → set source to the `gh-pages` branch.
Site will be live at `https://<your-username>.github.io/krishna-shoe-center/`

## Deploy — Vercel (recommended, easier)
1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Framework preset: Vite. Leave build settings as default. Deploy.
