# Veer Enterprise Inventory Management System

A modern, full-stack inventory management application built for **Veer Enterprise** to manage spare parts, stock levels, transactions, and inventory reports from a single platform.

The application is designed for reliable multi-device access, clean workflows, and a responsive experience across desktop and mobile.

---

## Overview

The Veer Enterprise Inventory Management System helps manage day-to-day inventory operations, including:

- Product and spare-part management
- Part Code and automatic SKU generation
- Stock In and Stock Out transactions
- Product search and selection
- Inventory tracking
- Stock movement history
- Low-stock monitoring
- Transaction reports
- Date-based filtering
- Pagination
- Print-ready reports
- Excel export
- Company information and logo settings
- Role-based access control

The system is built to preserve historical transaction data and maintain accurate stock records as products are edited over time.

---

## Features

### Product Management

- Add, edit, and manage spare parts.
- Store product name, Part Code, SKU, quantity, price, description, category, subcategory, and photo.
- Automatically generate SKUs using a company prefix and date-based format.
- Store Part Codes in uppercase.
- Allow duplicate Part Codes when multiple products share the same business identifier.
- Display product information consistently across the application.
- Search products by name, Part Code, or SKU.

### Transaction Management

- Create Stock In and Stock Out transactions.
- Add multiple products to a single transaction.
- Display available stock while selecting products.
- Add remarks to transactions.
- Track total products, total units, and total value.
- Preserve historical transaction information.
- Prevent duplicate transaction creation.
- Update stock quantities safely through the backend.

### Reports

The application includes four report sections:

1. **Inventory Report**
   - Product Name
   - Part Code
   - Category
   - Quantity
   - Status

2. **Stock Movement**
   - Individual product-level stock movements
   - Transaction type
   - Date
   - Quantity
   - SKU
   - Part Code
   - Remarks
   - Price
   - Total Price
   - Transaction Reference

3. **Low Stock Report**
   - Low-stock products
   - Part Code
   - Product description/notes
   - Product details navigation

4. **Transactions Report**
   - Complete transaction-level records
   - Transaction reference
   - Date
   - Transaction type
   - Remarks
   - Total units
   - Total value

### Report Tools

- Date-range filtering
- Pagination
- Report-specific refresh
- Print only the active report
- Excel export
- Export all filtered records, not only the current page
- Responsive report layouts

### Dashboard

- Inventory overview
- Spare Parts navigation
- Needs Attention / Low Stock navigation
- Recent Movement
- Clickable transaction references
- Useful inventory summaries

### Company Settings

- Company information management
- Company logo upload and display
- Responsive settings layout
- Clear loading, saving, and error states

### Responsive Design

- Desktop and mobile support
- Mobile-friendly product search
- Touch-friendly controls
- Responsive tables
- Usable pagination and date filters
- Clean, professional interface
- Consistent design across all pages

---

## Tech Stack

### Frontend

- React
- Vite
- JavaScript / JSX
- Bootstrap
- React Router
- CSS

### Backend

- Node.js
- Express.js
- REST APIs
- Supabase

### Database

- PostgreSQL
- Supabase Database

### Authentication

- Supabase Authentication
- Role-based access control

### Development Tools

- Git
- GitHub
- npm

> Update this section if the project uses additional libraries or a different implementation.

---

## Project Structure

The project is organized into separate frontend and backend applications.

```text
Veer-Enterprise-Inventory/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── routes/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
