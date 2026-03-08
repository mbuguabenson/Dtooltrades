# The Ultimate Account Hub & Admin Dashboard Prompt

Use the following detailed prompt to build or re-create a professional-grade Account Hub and Admin Dashboard for a trading platform integrated with the Deriv API (via WebSockets).

---

## **Prompt Objective**
Build two high-performance, visually stunning modules: an **Account Hub** for traders and a **comprehensive Admin Dashboard** for platform management. The design must be "Premium" (dark mode, glassmorphism, vibrant gradients, fluid animations) and the code must be modular and type-safe.

---

## **Module 1: Account Hub**
A centralized dashboard where traders manage their profile, stats, and history.

### **Core Features:**
1.  **Hero Profile Card**:
    *   Display avatar, username (editable), and Account ID with a "Copy" badge.
    *   Show "Verified" status and Account Type (Real/Demo).
    *   Dynamic background gradients based on currency/account type (e.g., Emerald for Real-USD, Slate for Demo).
2.  **Stat Grid**:
    *   Quick-glance cards for Total Accounts, Real/Demo counts, and active trading status.
3.  **Tabbed Interface**:
    *   **User Details**: List of all linked Deriv accounts with real-time balance fetching and a "Portfolio Total" summary.
    *   **Transaction Statement**: A chronological list of all deposits, withdrawals, and trades.
    *   **Profit Reports**: Visual breakdown of daily/weekly performance.
    *   **Performance Journey**: A graphical representation of account growth over time using Recharts.
    *   **Strategy Analytics**: Deep dive into win rates, average trade duration, and asset-specific performance.

---

## **Module 2: Admin Dashboard**
A high-level command center for monitoring global platform activity.

### **Core Features:**
1.  **Global Stats Header**:
    *   Cards for Total Active Users, Global Real Balance Reserve, Net Platform Performance, and Trading Volume.
2.  **Performance Analytics**:
    *   A large, interactive Area Chart (using Recharts) showing global P/L trends.
    *   Filters for Time Range, Account Type (All/Real/Demo), and Curve Type (Monotone/Linear/Step).
3.  **Live activity Feed**:
    *   A real-time stream of authorization events, trade openings, and balance updates.
4.  **User Management (`/admin/users`)**:
    *   A powerful searchable/filterable table of all platform users.
    *   Ability to see "New Today" users and "Blocked" users.
    *   **User Profile Detail Panel**: Shows IP address, location (City/Country), device/browser info, and a 20-point balance history sparkline.
    *   **Admin Controls**: One-click actions to Whitelist, Blacklist, or Block accounts.
5.  **Trading Console**:
    *   An embedded terminal for administrative trades or platform testing.

---

## **Technical & Aesthetic Requirements**
*   **Tech Stack**: Next.js (App Router), Tailwind CSS, Lucide Icons, Recharts, Radix UI (Tabs, Dialogs, etc.).
*   **Aesthetics**:
    *   **Backgrounds**: Hex `#050505` or deep slate with subtle glows.
    *   **Cards**: Glassomorphic style with `backdrop-blur-xl`, `border-white/5`, and `bg-white/[0.02]`.
    *   **Typography**: Bold black-style headers with tight tracking (`tracking-tighter`).
    *   **Feedback**: Use `lucide-react` icons for every primary action and state.
*   **Performance**: Fast refresh intervals (5-15s) for live stats with loading skeletons or "alive" pulse effects.
