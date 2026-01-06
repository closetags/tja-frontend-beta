# Event Manager - Admin Frontend

Next.js 14+ web application for event administrators to manage events, guests, and track attendance.

## Features

- Event creation and management
- Guest list management with CSV import
- QR code generation and distribution
- Web-based QR scanner for check-ins and souvenirs
- Souvenir distribution tracking
- Comprehensive reports and analytics
- Real-time statistics dashboard

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- html5-qrcode for QR scanning

## Setup

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3. Start development server:
```bash
npm run dev
```

Application will be available at http://localhost:3000

## Pages

### Authentication
- `/` - Auto-redirects to login or dashboard
- `/login` - Staff login with JWT authentication

### Dashboard
- `/dashboard` - Event list with statistics

### Event Management
- `/events/new` - Create new event
- `/events/[id]` - Event details with guest list
- `/events/[id]/check-in` - QR scanner for check-ins
- `/events/[id]/souvenirs` - Souvenir statistics
- `/events/[id]/souvenirs/scan` - Souvenir scanner
- `/events/[id]/reports` - Reports and analytics

### Guest Management
- `/events/[id]/guests/upload` - CSV bulk upload

## Production Build

```bash
npm run build
npm start
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## License

Proprietary - Event Manager

