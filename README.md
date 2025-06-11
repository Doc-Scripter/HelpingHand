- [HelpingHand](#helpinghand)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Getting Started](#getting-started)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Install dependencies](#2-install-dependencies)
    - [3. Configure Environment Variables](#3-configure-environment-variables)
    - [Database Auto-Setup](#database-auto-setup)
    - [4. Set up the database](#4-set-up-the-database)
    - [5. Run the development server](#5-run-the-development-server)
  - [Project Structure](#project-structure)
  - [Mpesa Integration with ngrok](#mpesa-integration-with-ngrok)
    - [Setting up ngrok for M-Pesa Webhooks](#setting-up-ngrok-for-m-pesa-webhooks)
      - [1. Install ngrok](#1-install-ngrok)
      - [2. Authenticate ngrok](#2-authenticate-ngrok)
      - [3. Start your development server](#3-start-your-development-server)
      - [4. Create ngrok tunnel](#4-create-ngrok-tunnel)
      - [5. Update M-Pesa Configuration](#5-update-m-pesa-configuration)
      - [6. Test M-Pesa Integration](#6-test-m-pesa-integration)
      - [Troubleshooting ngrok](#troubleshooting-ngrok)
    - [M-Pesa Integration Details](#m-pesa-integration-details)
      - [To get this working](#to-get-this-working)
  - [Admin Interface](#admin-interface)
  - [Deployment](#deployment)

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
Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Then edit `.env` with your actual M-Pesa credentials:

```env
# Server Configuration
PORT=5173

# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_actual_consumer_key
MPESA_CONSUMER_SECRET=your_actual_consumer_secret
MPESA_BUSINESS_SHORT_CODE=your_actual_shortcode
MPESA_PASSKEY=your_actual_passkey
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/mpesa/callback
MPESA_TIMEOUT_URL=https://your-ngrok-url.ngrok-free.app/api/mpesa/timeout
```

**Note:** 
- The database file will be stored in the `database/` folder and created automatically
- M-Pesa credentials must be obtained from [Safaricom Developer Portal](https://developer.safaricom.co.ke/)
- For local development, you'll need ngrok for M-Pesa webhooks (see M-Pesa Integration section)

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
  
#### To get this working 
- Checkout [MPESA INTERGRATION](./docs/mpesa/MPESA_INTEGRATION.md) for step by step to get Mpesa setup
## Admin Interface
- Accessible at /admin
- Displays donation stats per project
- (Optional) Protect with a simple password or IP whitelist
## Features to be Added

### 🎨 UI/UX Improvements
- **Enhanced Visual Design**
  - Implement consistent color scheme and typography across all pages
  - Add modern card-based layouts for project listings
  - Improve responsive design for better mobile experience
  - Add loading states and skeleton screens for better perceived performance
  - Implement dark/light theme toggle for user preference

- **User Experience Enhancements**
  - Add project image galleries and detailed descriptions
  - Implement donation progress bars with visual indicators
  - Add success animations and micro-interactions
  - Create intuitive donation flow with step-by-step guidance
  - Add social sharing buttons for projects

### 🔧 Functionality Enhancements
- **Donation Features**
  - Multiple payment methods (PayPal, Stripe, bank transfers)
  - Recurring donation options (monthly, quarterly, yearly)
  - Donation impact calculator showing real-world effects
  - Anonymous vs. named donation options with donor recognition
  - Donation certificates/receipts generation

- **Project Management**
  - Project categories and filtering system
  - Search functionality with advanced filters
  - Project status tracking (active, completed, paused)
  - Goal achievement notifications and celebrations
  - Project updates and milestone reporting

### 📊 Analytics & Reporting
- **Admin Dashboard Improvements**
  - Real-time donation tracking with charts and graphs
  - Donor demographics and donation patterns analysis
  - Export functionality for financial reports
  - Project performance metrics and insights
  - Automated email reports for administrators

- **User Engagement**
  - Email notifications for project updates
  - Newsletter subscription system
  - Donor impact stories and testimonials
  - Community features (comments, project discussions)

### 🧪 Testing & Quality Assurance
- **Comprehensive Test Coverage**
  - Unit tests for all service functions (database, M-Pesa, validation)
  - Component testing for all Svelte components
  - Integration tests for API endpoints and payment flows
  - End-to-end testing for complete user journeys
  - Performance testing for database operations
  - Security testing for payment processing

- **Code Quality**
  - TypeScript migration for better type safety
  - ESLint and Prettier configuration refinement
  - Code coverage reporting and monitoring
  - Automated testing in CI/CD pipeline

### 🔒 Security & Performance
- **Security Enhancements**
  - Input validation and sanitization improvements
  - Rate limiting for API endpoints
  - CSRF protection implementation
  - Secure session management for admin users
  - Payment data encryption and PCI compliance

- **Performance Optimizations**
  - Database query optimization and indexing
  - Image optimization and lazy loading
  - Caching strategies for frequently accessed data
  - Bundle size optimization and code splitting
  - CDN integration for static assets

### 🌐 Deployment & DevOps
- **Infrastructure Improvements**
  - Docker containerization for consistent deployments
  - Database migration scripts and version control
  - Automated backup and recovery procedures
  - Environment-specific configuration management
  - Health checks and monitoring setup

- **CI/CD Pipeline**
  - Automated testing on pull requests
  - Staging environment for pre-production testing
  - Automated deployment to production
  - Rollback capabilities for failed deployments

### 📱 Mobile & Accessibility
- **Mobile Experience**
  - Progressive Web App (PWA) capabilities
  - Mobile-optimized donation forms
  - Touch-friendly interface elements
  - Offline functionality for basic browsing

- **Accessibility**
  - WCAG 2.1 compliance implementation
  - Screen reader compatibility
  - Keyboard navigation support
  - High contrast mode support
  - Multi-language support (i18n)

### 🔄 User Retention Features
- **Engagement Strategies**
  - Gamification elements (donation badges, achievement levels)
  - Personalized project recommendations
  - Donor loyalty program with rewards
  - Social proof elements (recent donations, donor count)
  - Email marketing automation for donor retention

- **Community Building**
  - Donor profiles and contribution history
  - Project creator profiles and stories
  - Community forums and discussion boards
  - Volunteer opportunity integration
  - Event calendar for fundraising activities

## Deployment
- Configure environment variables on your host
- Use npm run build and npm run preview for production