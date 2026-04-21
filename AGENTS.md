# Project Context: Sheen Ghazy Baba ERP

## Business Overview
- **Company**: Sheen Ghazy Baba (شین غزی بابا)
- **Industry**: Pipe manufacturing (PPRC, PVC, and fittings) in Afghanistan.
- **Target Audience**: Company managers, factory workers, and local customers.

## Infrastructure & Deployment
- **Hosting**: The system will be hosted on the company's **Internal Server** (32GB RAM, 1TB Storage).
- **Database**: **PostgreSQL** is MANDATORY for production. The system must be optimized for concurrent users and high reliability.
- **AI Integration**: Uses Google Gemini API (Free Tier - 1500 requests/day). The AI must operate within these free limits and process requests via the internal server's internet connection.

## Strict Coding Rules & Standards
1. **High Precision & Zero Errors**: Every piece of code must be meticulously written, tested, and production-ready. No half-baked solutions.
2. **Real Data Only**: Do not use mock data or hardcoded values for business logic. Always read/write from the PostgreSQL database via Sequelize.
3. **Advanced yet Simple UI/UX**: The Admin Panel (ERP) must use modern technologies (React, Tailwind, Recharts) but remain **extremely simple, intuitive, and easy to understand** for non-technical managers.
4. **Localization**: Full support for **Dari (Farsi)** and **Pashto** is required. The UI must be Right-to-Left (RTL) by default.
5. **Action-Oriented**: These rules must be applied automatically in every response. The AI must not wait for the user to remind it of these constraints.
