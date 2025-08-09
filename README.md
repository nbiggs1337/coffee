# ☕ Coffee — Community Safety App

Build safer, more authentic communities through verified membership, photo-backed posts, and collaborative feedback. Green/Red flag voting, smart alerts, and an admin approval workflow keep the experience high-quality and respectful.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/noahs-projects-63042d26/v0-app-with-community-safety)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/yGkLLA8yPPL)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Edge%20Postgres-3ECF8E?logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Components-000000)

## ✨ Features

- 🔐 Verified onboarding
  - Agreement flow with profile details and verification photo
  - Email verification reminder and pending state until approved
- 🏠 Image‑first feed
  - Large, immersive post cards focused on photos
  - Post details, comments, and author profiles
- 💚/🚩 Voting
  - Green (thumbs up/right) and Red (thumbs down/left) votes with optimistic UI
- 🔍 Smart search
  - Query by name, location, phone, and more
- ❤️ Swipe
  - Tinder‑style card deck for quick green/red feedback
- 🔔 Notifications
  - Mark as read, clear all, and helpful toasts
- 🚨 Alerts
  - Create alerts by name, location, or phone; get notified on matches
- 🛡️ Admin panel
  - Approve/reject users, manage posts, and review verification photos
- 🖼️ Image uploads
  - Supabase Storage with robust mobile camera support and signed uploads

## 🧱 Tech Stack

- Frontend: Next.js 15 (App Router), React 19, TypeScript
- UI: Tailwind CSS, shadcn/ui, Lucide Icons
- Data & Auth: Supabase (Auth, Postgres, RLS, Storage)
- Deploy: Vercel

## 🗺️ App Structure

- `app/` — App Router routes and layouts (protected and public areas)
- `actions/` — Server Actions for posts, votes, uploads, admin, alerts, etc.
- `components/` — UI components and page-level client components
- `lib/` — Supabase clients (SSR, Admin), helpers, and types
- `scripts/` — SQL setup and maintenance scripts for Supabase
- `public/` — Static assets

Key buckets in Supabase Storage:
- `avatars` — user avatars
- `post-images` — post photos
- `verification-photos` — onboarding verification images

## 🚀 Getting Started

### 1) Prerequisites

- Node.js 18+ (or 20+ recommended)
- A Supabase project (URL and keys)
- Vercel account (optional, for deploy)

### 2) Clone and install

\`\`\`bash
git clone <your-repo-url>
cd coffee-app
npm install
