# Re:Scope

**Re:Scope** is an advanced AI-powered KOL (Key Opinion Leader) Intelligence and Campaign Management platform. It helps agencies and brands identify, analyze, and manage influencer campaigns with ease, utilizing real-time data from TikTok and AI-driven insights.

## 🚀 Features

- **Campaign Management**: Create, track, and manage influencer marketing campaigns.
- **AI-Powered Discovery**: Uses Google Gemini to analyze campaign briefs and recommend relevant KOL categories.
- **Real-time Scraper**: Integrates with Apify to fetch real-time TikTok profile data.
- **Automated Grading**: Automatically categorizes influencers into tiers (Nano, Micro, Macro, Mega) based on follower counts.
- **Interactive Dashboard**: Visualizes campaign data, tiered heatmaps, and performance metrics.
- **Secure Authentication**: Built-in login system with route protection.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS v4, Lucide React (Icons).
- **Backend**: PocketBase (Go-based realtime backend & database).
- **AI & Data**: Google Generative AI (Gemini), Apify SDK.
- **Language**: TypeScript / JavaScript.

## 📦 Prerequisites

- **Node.js** (v18 or higher)
- **PocketBase** (v0.22+)

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ciscoexplains/rescope-v0.1.0.git
cd rescope-v0.1.0
```

### 2. Backend Setup (PocketBase)
PocketBase acts as the database and authentication server.

1.  Navigate to the `backend` directory (if you have the binary there) or ensure PocketBase is installed.
2.  Start the server:
    ```bash
    ./pocketbase serve
    ```
    The Admin UI will be available at `http://127.0.0.1:8090/_/`.

### 3. Frontend Setup
1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment Variables:
    Create a `.env.local` file in the `frontend` directory:
    ```env
    NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
    NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
    APIFY_API_TOKEN=your_apify_token
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will be running at `http://localhost:3000`.

## 🔐 Authentication & User Management

The application is protected by a login screen. To access it, you need to create a user in PocketBase.

### Creating a User (via Script)
We have provided a helper script to quickly create an authorized user.

Run the following command from the `frontend` directory:

```bash
node scripts/setup_user.mjs <email> <password>
```

**Example:**
```bash
node scripts/setup_user.mjs admin@rescope.com securePassword123
```

Alternatively, you can manually create users via the **PocketBase Admin UI** (`http://127.0.0.1:8090/_/`) in the **users** collection.

## 📁 Project Structure

```
rescope/
├── backend/                  # PocketBase data and migrations
│   ├── pb_data/              # Database files
│   ├── pb_migrations/        # Schema migrations
│   └── pocketbase            # Binary (linux)
├── frontend/                 # Next.js Application
│   ├── app/                  # App Router pages
│   │   ├── api/              # Next.js API Routes (Gemini, Apify)
│   │   ├── login/            # Login Page
│   │   └── projects/         # Campaign Pages
│   ├── components/           # React Components (Sidebar, UI)
│   ├── lib/                  # Utilities (PocketBase client)
│   └── scripts/              # Helper scripts (migrations, setup)
└── README.md                 # This file
```

## 🛡️ License

Private and Confidential - Property of Re:noir Technology.
