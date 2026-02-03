# Monitor de Salut 📊
Full-stack system for health metrics analysis (Blood Pressure, Weight, SpO2, etc.) with a professional "Data Tool" aesthetic.

## 🚀 Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/ui, Recharts.
- **Backend:** NestJS, Prisma ORM, PostgreSQL, Supabase.
- **Key Libraries:** `js-cookie` for theme management, `next-intl` for i18n, `sonner` for notifications.

## 💡 Key Technical Decisions: Zero Theme Flicker
The most significant technical implementation is the **Cookie-based Theme Strategy**. Unlike standard `localStorage` approaches (which cause a white flash on page load), this app:
1. Stores the user's theme preference in a cookie via `js-cookie`.
2. Reads the cookie server-side in `layout.tsx` using `next/headers`.
3. Injects the `dark` or `light` class directly into the `<html>` tag during SSR.
This ensures a 100% flicker-free experience, even during language switching or hard refreshes.

## 🎨 UI/UX Principles
- **Minimalist Aesthetic:** Using Slate/Zinc palettes to minimize visual noise.
- **Admin Discrete UI:** Admin access and logout buttons are minimalist circular icons.
- **Professional Toasts:** Solid, opaque notifications with color-coded left borders for non-intrusive feedback.

## 🛠️ Setup
1. **Backend:** `cd api-app && npm install && npx prisma migrate dev && npm run start:dev`
2. **Frontend:** `cd web-app && npm install && npm run dev`
