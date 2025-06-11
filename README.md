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
DATABASE_URL="file:./database/dev.db"
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_
secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
```

**Note:** The database file will be stored in the `database/` folder. This directory and the `donations.db` file will be created automatically when the application starts.

### Database Auto-Setup
The application includes automatic database initialization:
- ✅ Creates `database/` folder if it doesn't exist
- ✅ Creates `donations.db` file automatically
- ✅ Sets up all required tables (projects, donations, pending_transactions, admin_users)
- ✅ Inserts sample data for testing
- ✅ Creates default admin user (username: `admin`, password: `admin123`)

### 4. Set up the database
```
npx prisma migrate dev --name init
npx prisma db seed
```


**Optional: Test database setup**
```bash
npm run test:db
```
This will verify that the database directory and file are created correctly and that all tables are properly initialized.

### 5. Run the development server
-  Execute this on your terminal.
```
npm run dev
```
or
```
make
```
Visit http://localhost:5173 to view the app.

## Project Structure
- src/routes/ — SvelteKit routes for pages and API endpoints
- src/lib/components/ — Reusable Svelte components
- src/lib/api/ — Mpesa and project API logic
- database/ — SQLite database files
- prisma/ — Database schema and seed data
- static/ — Static assets
## Mpesa Integration with ngrok

### Setting up ngrok for M-Pesa Webhooks

M-Pesa requires publicly accessible URLs for webhooks during development. ngrok creates secure tunnels to your localhost, making it perfect for testing M-Pesa integrations.

#### 1. Install ngrok

**Option A: Download from website**
1. Visit [ngrok.com](https://ngrok.com/)
2. Sign up for a free account
3. Download ngrok for your operating system
4. Extract the downloaded file to a directory in your PATH

**Option B: Install via package manager**

On macOS (using Homebrew):
```bash
brew install ngrok/ngrok/ngrok
```

On Windows (using Chocolatey):
```bash
choco install ngrok
```

On Linux (using Snap):
```bash
sudo snap install ngrok
```

#### 2. Authenticate ngrok
1. Get your auth token from [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Configure ngrok with your token:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

#### 3. Start your development server
First, start your SvelteKit application:
```bash
npm run dev
```
Your app should be running on `http://localhost:5173`

#### 4. Create ngrok tunnel
In a new terminal window, create a tunnel to your local server:
```bash
ngrok http 5173
```

You'll see output similar to:
```
ngrok                                                          

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5173

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

#### 5. Update M-Pesa Configuration
Use the ngrok HTTPS URL (e.g., `https://abc123.ngrok-free.app`) in your M-Pesa configuration:

**Update your .env file:**
```env
# Add your ngrok URL for M-Pesa callbacks
MPESA_CALLBACK_URL=https://abc123.ngrok-free.app/api/mpesa/callback
MPESA_RESULT_URL=https://abc123.ngrok-free.app/api/mpesa/result
```

**Important Notes:**
- Always use the HTTPS URL from ngrok (not HTTP)
- The ngrok URL changes each time you restart ngrok (unless you have a paid plan)
- Update your M-Pesa sandbox/production settings with the new ngrok URL
- Keep the ngrok terminal window open while testing

#### 6. Test M-Pesa Integration
1. Make a test donation through your application
2. Monitor the ngrok web interface at `http://127.0.0.1:4040` to see incoming webhook requests
3. Check your application logs for M-Pesa callback processing

#### Troubleshooting ngrok
- **"command not found"**: Ensure ngrok is in your PATH or use the full path to the executable
- **"tunnel not found"**: Check that your local server is running on the specified port
- **M-Pesa callbacks not received**: Verify the ngrok HTTPS URL is correctly configured in M-Pesa settings
- **ngrok session expired**: Free accounts have session limits; restart ngrok if needed

### M-Pesa Integration Details
- M-Pesa payment logic is handled in `src/lib/api/mpesa.ts` and exposed via `src/routes/api/mpesa/+server.ts`
- Ensure your credentials are correct in `.env`
- For local testing, use the M-Pesa sandbox environment with ngrok tunnels
- Always test webhook endpoints using the ngrok HTTPS URL before deploying to production
## Admin Interface
- Accessible at /admin
- Displays donation stats per project
- (Optional) Protect with a simple password or IP whitelist
## Deployment
- Configure environment variables on your host
- Use npm run build and npm run preview for production