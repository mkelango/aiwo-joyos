# AIWO Joy OS

Front end for AIWO Joy OS. All data is specimen data; there is no back end, real sign-in or payments yet.

| Folder | What it is | Run locally |
|---|---|---|
| `joy-os-web/` | Web app (React 19, Vite, Tailwind) | `cd joy-os-web && npm install && npm run dev` |
| `joy-os-mobile/` | Mobile app (Expo, expo-router); also exports to web | `cd joy-os-mobile && npm install && npx expo start` |

`PLAN.md` is the as-built record. Each app deploys to Vercel as its own project, with that folder set as the root directory.
