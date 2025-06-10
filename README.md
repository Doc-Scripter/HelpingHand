# HelpingHand
Trae

Here is a complete and realistic file structure for your SvelteKit-based anonymous donation platform with admin and Mpesa integration, followed by a full README and custom AI instructions for implementation.

## 📁 Suggested File Structure
```
HelpingHand/
├── README.md
├── LICENSE
├── package.json
├── svelte.config.js
├── vite.config.js
├── static/
│   └── favicon.png
├── src/
│   ├── app.d.ts
│   ├── hooks.server.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── mpesa.ts
│   │   │   └── projects.ts
│   │   ├── components/
│   │   │   ├── DonationForm.svelte
│   │   │   ├── ProjectCard.svelte
│   │   │   ├── ProjectList.svelte
│   │   │   ├── AdminDashboard.svelte
│   │   │   └── AdminProjectTable.svelte
│   │   └── utils/
│   │       └── validation.ts
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── admin/
│   │   │   ├── +layout.svelte
│   │   │   └── +page.svelte
│   │   ├── donate/
│   │   │   └── [projectId]/
│   │   │       └── +page.svelte
│   │   └── api/
│   │       ├── donate/
│   │       │   └── +server.ts
│   │       ├── projects/
│   │       │   └── +server.ts
│   │       └── mpesa/
│   │           └── +server.ts
│   └── styles/
│       └── global.css
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── .env
├── .gitignore
└── tsconfig.json
```
## 📖 README.md (Full Example)
# HelpingHand
A SvelteKit web application that allows well-wishers to anonymously donate to various social projects. No signup is required for donors. The platform provides an admin interface for tracking donations per project and integrates Mpesa for secure payments.

## Features
- List of social projects open for donations
- Anonymous donations (no signup required)
- Mpesa payment integration
- Admin dashboard for tracking donations and managing projects
- Responsive, modern UI
## Tech Stack
- SvelteKit
- Prisma ORM (with SQLite/PostgreSQL)
- Mpesa API
- TypeScript
- Tailwind CSS (optional for styling)
## Getting Started
### 1. Clone the repository
```
git clone https://github.com/yourusername/
HelpingHand.git
cd HelpingHand
```
### 2. Install dependencies
```
npm install
```
### 3. Configure Environment Variables
Create a .env file in the root directory:

```
DATABASE_URL="file:./dev.db"
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_
secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```
### 4. Set up the database
```
npx prisma migrate dev --name init
npx prisma db seed
```
### 5. Run the development server
```
npm run dev
```
Visit http://localhost:5173 to view the app.

## Project Structure
- src/routes/ — SvelteKit routes for pages and API endpoints
- src/lib/components/ — Reusable Svelte components
- src/lib/api/ — Mpesa and project API logic
- prisma/ — Database schema and seed data
- static/ — Static assets
## Mpesa Integration
- Mpesa payment logic is handled in src/lib/api/mpesa.ts and exposed via src/routes/api/mpesa/+server.ts .
- Ensure your credentials are correct in .env .
- For local testing, use the Mpesa sandbox environment.
## Admin Interface
- Accessible at /admin
- Displays donation stats per project
- (Optional) Protect with a simple password or IP whitelist
## Deployment
- Configure environment variables on your host
- Use npm run build and npm run preview for production