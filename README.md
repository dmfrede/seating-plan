# 🌿 Agerup Farm Seating Planner

A production-ready React + TypeScript + Firebase SaaS application for planning event seating arrangements.

## Features

- 🗺️ **Visual venue canvas** with drag-and-drop table positioning
- 🪑 **Multiple table types**: Round (153cm ⌀), Long L1 (217×50cm), Long L2 (240×80cm)
- 👥 **Guest management** with search, filter, and gender tracking
- ⚡ **Gender warning system** for adjacent same-gender seating detection
- 📤 **Export options**: Guest lists by name/table (text), seating chart (PDF)
- 🔐 **Firebase Auth** with email/password
- 🎯 **Demo mode** — no account needed to try it out
- ↩️ **Undo/Redo** history for authenticated users
- 📱 **Responsive design** with Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Canvas**: HTML5 Canvas API (custom rendering)
- **Backend**: Firebase Auth + Firestore
- **Build**: Vite 5
- **Export**: jsPDF + html2canvas

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your Firebase config:
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase configuration instructions.

## Project Structure

```
src/
├── components/
│   ├── App.tsx              # Root component + state management
│   ├── Auth/                # Login/Signup forms
│   ├── Canvas/              # VenueCanvas (HTML5 Canvas)
│   ├── Demo/                # Demo mode CTA banner
│   ├── Export/              # Export dropdown button
│   ├── Guests/              # Guest list + add form
│   ├── Tables/              # Table sidebar + config modal
│   └── UI/                  # Modal, Toast, TopBar
├── hooks/
│   ├── useAuth.ts           # Firebase Auth hook
│   ├── useDemo.ts           # Demo data management
│   ├── useSeating.ts        # Seat assignment logic
│   └── useUndoRedo.ts       # Undo/redo history
├── types/
│   └── index.ts             # TypeScript interfaces
└── utils/
    ├── canvas.ts            # Canvas math helpers
    ├── constants.ts         # App constants
    ├── demoData.ts          # Demo data generators
    ├── export.ts            # Export utilities
    ├── firebase.ts          # Firebase init
    └── validation.ts        # Form/data validation
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## License

MIT
