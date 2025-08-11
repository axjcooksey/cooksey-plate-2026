# Cooksey Plate 2025

A family AFL tipping competition web application that replaces the Excel-based system with an automated platform integrating with the Squiggle API for live AFL data.

## 🚀 Project Status

**Phase:** Foundation Setup Complete
- ✅ Documentation Setup
- ✅ Project Initialization (Frontend + Backend)  
- ✅ Git Repository Setup
- 🔄 Next: Database Schema Creation

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- React Router
- Axios for API calls

**Backend:**
- Node.js + Express + TypeScript
- SQLite (development) / PostgreSQL (production)
- Squiggle API integration
- node-cron for scheduling

## 📁 Project Structure

```
cooksey-plate/
├── frontend/                 # React TypeScript app
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components  
│   │   ├── services/       # API calls
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript definitions
│   └── package.json
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── db/             # Database setup
│   │   └── schedulers/     # Automated jobs
│   ├── scripts/            # Utility scripts
│   └── package.json
├── claude.md               # AI assistant context
├── cooksey-plate-prd-v2.md # Product requirements
└── cooksey-plate-roadmap-v2.md # Implementation roadmap
```

## 🏁 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/[username]/cooksey-plate-2025.git
   cd cooksey-plate-2025
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../backend  
   npm install
   cp .env.example .env
   ```

### Development

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   # Server runs on http://localhost:3001
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   # App runs on http://localhost:5173
   ```

## 📚 Documentation

- **[CLAUDE.md](./claude.md)** - Comprehensive project context for AI development
- **[Product Requirements](./cooksey-plate-prd-v2.md)** - Detailed feature specifications
- **[Roadmap](./cooksey-plate-roadmap-v2.md)** - Step-by-step implementation guide

## 👥 Family Structure

The application manages 25 family members across 8 groups:
- Ashtons & PFCs (7 members)
- PJCs (3 members)  
- Chelsea Florences (3 members)
- Richmond Cookseys (2 members)
- South-East Cookseys (2 members)
- Perth Cookseys (3 members)
- Tassie Cookseys (2 members)
- Individuals (3 members)

## 🔑 Key Features (Planned)

- **Family-based tipping:** Members can tip for their family group
- **Live AFL data:** Integration with Squiggle API
- **Transparent competition:** Tips visible after first game starts
- **Automated scoring:** Real-time ladder updates
- **Historical import:** Migrate existing Excel data
- **Admin controls:** Scheduler management and manual overrides

## 🚀 Deployment

- **Frontend:** Vercel
- **Backend:** Railway
- **Database:** PostgreSQL (production)

## 📈 Development Progress

See [Roadmap](./cooksey-plate-roadmap-v2.md) for detailed implementation timeline.

---

**Previous System:** Excel-based manual tracking  
**New System:** Automated web application with live data integration