# WALKER SNEAKER — Setup Guide

A full-stack sneaker e-commerce store built with **Laravel 12**, **React**, **TypeScript**, and **MySQL**. This guide walks you through setting up the project from scratch — no prior experience assumed.

---

## What You Need to Install First

Before you start, make sure you have all of these installed on your computer.

| Tool | Version | Download |
|------|---------|----------|
| PHP | 8.2 or higher | https://www.php.net/downloads |
| Composer | Latest | https://getcomposer.org |
| Node.js | 18 or higher | https://nodejs.org |
| MySQL | 8.0 or higher | https://dev.mysql.com/downloads |
| Git | Latest | https://git-scm.com |

> **Windows users:** We recommend installing PHP and MySQL via [XAMPP](https://www.apachefriends.org) or [Laragon](https://laragon.org) — both give you PHP + MySQL in one package with no extra configuration.

> **Mac users:** Install PHP via [Homebrew](https://brew.sh): `brew install php` and MySQL via `brew install mysql`.

---

## Step 1 — Get the Project Files

Open your terminal (Command Prompt / PowerShell on Windows, Terminal on Mac) and run:

```bash
# Navigate to where you want to put the project
cd C:\Projects          # Windows example
cd ~/Projects           # Mac/Linux example

# Unzip the project folder you were given, or clone from Git
# If you have a zip file, extract it and cd into the folder:
cd Sneaker
```

---

## Step 2 — Install PHP Dependencies

```bash
composer install
```

This downloads all the Laravel packages the project needs. It may take 1–2 minutes.

---

## Step 3 — Set Up Your Environment File

The `.env` file holds your local settings like database credentials. Copy the example file:

```bash
# Mac/Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Then open `.env` in any text editor (VS Code, Notepad, etc.) and update these lines:

```env
APP_NAME="WALKER SNEAKER"
APP_URL=http://localhost:8000

DB_DATABASE=sneaker_shop
DB_USERNAME=root
DB_PASSWORD=             ← your MySQL password here (leave blank if none)

SESSION_LIFETIME=43200   ← change this from 120 to 43200 (30-day sessions)
```

> **Note:** If you used XAMPP or Laragon, your MySQL username is likely `root` with no password. If you installed MySQL separately, use the password you set during installation.

---

## Step 4 — Generate App Key

Laravel needs a secret key to encrypt sessions and cookies. Generate it:

```bash
php artisan key:generate
```

You will see: `Application key set successfully.`

---

## Step 5 — Create the Database

Open your MySQL client (XAMPP's phpMyAdmin, Laragon's HeidiSQL, MySQL Workbench, or terminal) and create a new database:

```sql
CREATE DATABASE sneaker_shop;
```

Or from terminal:

```bash
mysql -u root -p -e "CREATE DATABASE sneaker_shop;"
```

---

## Step 6 — Run the Migrations

This creates all the database tables:

```bash
php artisan migrate
```

You should see a list of tables being created. If you see errors, double-check your `.env` database credentials.

---

## Step 7 — Seed the Database

This fills the database with sample data — brands, products, sizes, colors, and a test user account:

```bash
# Seed everything (products + test user)
php artisan db:seed

# Seed the admin account separately
php artisan db:seed --class=AdminSeeder
```

After seeding you will have:

**Customer test account:**
- Email: `test@example.com`
- Password: `password`

**Admin account:**
- URL: `http://localhost:8000/admin/login`
- Email: `admin@WALKER SNEAKER`
- Password: `admin123`

**Sample data includes:**
- 4 Brands: Nike, Adidas, Jordan, New Balance
- 4 Categories: Lifestyle, Basketball, Running, Skateboarding
- 3 Genders: Men, Women, Unisex
- US sizes 4–13
- 36 sample products with variants

---

## Step 8 — Install Frontend Dependencies

```bash
npm install
```

This downloads all the React and TypeScript packages. May take a minute.

---

## Step 9 — Run the Project

You need **two terminal windows open at the same time.**

**Terminal 1 — Laravel backend:**
```bash
php artisan serve
```
This starts the server at `http://localhost:8000`

**Terminal 2 — Vite frontend (hot reload):**
```bash
npm run dev
```
This compiles your React/TypeScript files and watches for changes.

Now open your browser and go to: **http://localhost:8000**

---

## All Setup Commands in Order

If you want to copy-paste everything at once:

```bash
composer install
cp .env.example .env          # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan db:seed --class=AdminSeeder
npm install
```

Then in two separate terminals:
```bash
php artisan serve
npm run dev
```

---

## Project Structure Overview

```
Sneaker/
├── app/
│   ├── Http/
│   │   ├── Controllers/          ← Business logic
│   │   │   ├── Admin/            ← Admin panel controllers
│   │   │   └── Auth/             ← Login / Register
│   │   └── Middleware/           ← Session management, admin guard
│   └── Models/                   ← Database models
├── database/
│   ├── migrations/               ← Table definitions
│   └── seeders/                  ← Sample data
├── resources/
│   └── js/
│       ├── Components/           ← Reusable UI components
│       └── Pages/
│           ├── Admin/            ← Admin panel pages
│           ├── Auth/             ← Login, Register pages
│           ├── Orders/           ← Order history, detail
│           ├── Shop/             ← Product listing, detail, checkout
│           ├── Profile/          ← User profile hub
│           ├── Wishlist/         ← Saved products
│           └── Home.tsx          ← Homepage
└── routes/
    └── web.php                   ← All URL routes
```

---

## Pages & URLs

| URL | Description |
|-----|-------------|
| `http://localhost:8000` | Homepage |
| `http://localhost:8000/shop` | Product catalogue |
| `http://localhost:8000/shop/{id}` | Product detail page |
| `http://localhost:8000/checkout` | Checkout (login required) |
| `http://localhost:8000/orders` | Order history (login required) |
| `http://localhost:8000/wishlist` | Saved products (login required) |
| `http://localhost:8000/profile` | Profile hub (login required) |
| `http://localhost:8000/login` | Customer login |
| `http://localhost:8000/register` | Customer registration |
| `http://localhost:8000/admin/login` | Admin login |
| `http://localhost:8000/admin` | Admin dashboard |
| `http://localhost:8000/admin/products` | Manage products |
| `http://localhost:8000/admin/orders` | Manage orders |
| `http://localhost:8000/admin/customers` | Manage customers |
| `http://localhost:8000/admin/reviews` | Manage reviews |
| `http://localhost:8000/admin/settings` | Manage brands, categories, etc. |

---

## Features Summary

### Customer Side
- Browse products with search, brand, category, and gender filters
- Product detail page with colorway and size selection, stock awareness
- Size guide modal with Men's / Women's / Kids' US/EU/UK conversion
- Wishlist — save and manage favourite products
- Cart drawer — add, update, remove items
- Checkout — saved address book, card or Cash on Delivery payment
- Order history with delivery tracking timeline
- Order cancellation within 24 hours with stock restoration
- Product reviews — submit, edit, delete (purchased items only)
- Profile hub — personal info, address book, order history, password change

### Admin Panel
- Dashboard with revenue stats, order stats, low stock alerts
- Full product management — create, edit, toggle active, delete
- Variant management per product — color, size, stock, price, image
- Order management — update delivery status, cancel orders
- Customer management — view profiles, order history, activate/deactivate
- Review moderation — view and delete reviews
- Settings — manage brands, categories, genders, colors

### Session Management
- Customer sessions last 30 days with optional Remember Me
- Admin sessions expire after 3 hours of inactivity
- User and admin sessions are fully isolated

---

## Common Problems & Fixes

**`php artisan` commands not found**
→ Make sure PHP is in your system PATH. On Windows, restart your terminal after installing XAMPP/Laragon.

**Database connection error**
→ Check your `.env` file — `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` must match your MySQL setup.

**`npm run dev` crashes or shows errors**
→ Make sure Node.js is version 18 or higher: `node --version`
→ Try deleting `node_modules` and running `npm install` again.

**Page loads but shows blank/white screen**
→ Make sure `npm run dev` is running in a second terminal window.

**`Class not found` PHP errors**
→ Run `composer dump-autoload` and then `php artisan optimize:clear`.

**Changes not reflecting**
→ Run `php artisan optimize:clear` to clear all cached files.

---

## Resetting Everything

If something goes wrong and you want to start fresh:

```bash
php artisan migrate:fresh --seed
php artisan db:seed --class=AdminSeeder
php artisan optimize:clear
```

> ⚠️ `migrate:fresh` **deletes all data** and rebuilds the database from scratch. Only use this in development.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12 (PHP 8.2) |
| Frontend | React 18 + TypeScript |
| Routing | Inertia.js (connects Laravel to React) |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Database | MySQL 8 |
| Auth | Laravel Breeze (dual guard: customer + admin) |
