# PlantTree System Overview & Roadmap

This document provides a high-level summary of the current system architecture, its functional state, and strategic recommendations for future growth.

## 🏗️ System Architecture

The application is built on a modern **MERN** inspired stack with a robust data layer:
- **Frontend**: React.js with Tailwind CSS (Modern, Responsive UI).
- **Backend**: Node.js & Express (RESTful API).
- **Database**: PostgreSQL (via Prisma ORM) for reliable relational data management.
- **Media**: Cloudinary integration for scalable image storage.
- **Auth**: JWT (JSON Web Tokens) for secure, stateless authentication.

## 👥 Key Roles & Flows

### 1. Investors (The Buyers)
- **Goal**: Browse land/farms, invest in trees, and track growth.
- **Key Features**: Marketplace, Investment Tracking, Booking visits, and receiving Harvests.

### 2. Farmers (The Caretakers)
- **Goal**: Manage farms, log plant growth, and earn for their labor.
- **Key Features**: Profile management, Growth Logs (Photos/Activities), Availability settings, and Earnings dashboard.

### 3. Landowners (The Providers)
- **Goal**: Register lands for lease to farmers/investors.
- **Key Features**: Land registration and lease management.

### 4. Admins (The Overseers)
- **Goal**: Moderate the platform, approve requests, and monitor payments.
- **Key Features**: User Management, Investment Monitoring, and Approval Centers.

## ✅ Current Functional State (Health Check)

| Area | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | 🟢 Stable | Secure login/register and role-based access. |
| **Marketplace** | 🟢 Stable | Real-time browsing of available plants and farms. |
| **Farmer Dashboard**| 🟢 Optimized | **New**: Standardized navigation and duplicate prevention. |
| **Tracking History**| 🟢 Enhanced | **New**: Reliable photo logs and activity timelines. |
| **Financials** | 🟢 Clean | Accurate earnings breakdown and payment tracking. |
| **Harvests** | 🟢 Fixed | **New**: Plants correctly load for harvest recording. |

---

## 🚀 Future Recommendations

### 🔧 Technical Recommendations (Reliability & Scale)
1. **Real-time Notifications**: Implement **Socket.io** to provide instant alerts for hiring requests and messages without needing page refreshes.
2. **Automated Testing**: Expand the test suite (Jest/Cypress) to cover critical paths like Payment and Harvest flows to prevent future regressions.
3. **Image Optimization**: Implement client-side compression before uploading to Cloudinary to save bandwidth and improve performance for farmers in remote areas.
4. **Error Boundaries**: Add React Error Boundaries to "catch" component crashes and show a friendly UI instead of a blank screen.

### ✨ Functional Recommendations (XP & Growth)
1. **Investor Rewards**: Introduce a reward system where investors earn "Eco-Points" for trees reaching milestones (gamification).
2. **Community Messaging**: Enhance the current messaging system to support file sharing (PDF reports) and group chats between investors and their farmers.
3. **Mobile App (PWA)**: Convert the frontend to a Progressive Web App (PWA) so farmers can use "offline mode" to log activities while on the field and sync when they have signal.
4. **Advanced Analytics**: Provide investors with a "CO2 Offset" calculator based on the species and age of their trees.
5. **Subscription Model**: Allow investors to set up recurring payments for monthly farm maintenance, providing steady income for farmers.

---

> [!TIP]
> **Priority Suggestion**: Focus on **Email/SMS Notifications** first. Ensuring farmers are instantly alerted to hired requests will significantly increase the conversion rate for your investors.
