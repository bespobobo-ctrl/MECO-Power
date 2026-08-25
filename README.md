# MECO Power Uzbekistan Web API

Production-ready RESTful Web API for MECO Power Uzbekistan (Solar Energy Storage Solutions, Portable Solar Generators, Solar Panels, Regional Distributors and Service Management).

## Architecture Overview

This project follows **Modular Clean Architecture** principles to separate concerns into feature modules, controllers, services, and middlewares:

- `src/config`: Application & environment settings
- `src/middlewares`: Security, auth verification, and global error handling
- `src/modules`: Domain feature modules
  - `auth`: Authentication & User roles (Admin, Distributor, Customer)
  - `products`: Solar Power Banks, Solar Generators, Solar Panels inventory
  - `orders`: Commercial quotes and purchase orders
  - `distributors`: Regional hubs across Uzbekistan (Tashkent, Samarkand, Fergana, etc.)
  - `service-tickets`: After-sales warranty, repair tickets & manual downloads
- `src/utils`: Standardized API response formatters & helper functions

## Getting Started

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   npm start
   ```
