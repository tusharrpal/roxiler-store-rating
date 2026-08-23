# Roxiler Store Rating Platform

A full-stack web application that lets users discover stores and submit ratings (1–5) for them. Built for the Roxiler FullStack Intern coding challenge.

The platform supports three roles — **System Administrator**, **Normal User**, and **Store Owner** — behind a single, unified login system, each with role-scoped access enforced via JWT.

## Tech Stack

| Layer      | Technology                                  |
|------------|-----------------------------------------------|
| Frontend   | React 19 (Vite), React Router, Axios, Bootstrap |
| Backend    | Express 5 (Node.js)                          |
| Database   | PostgreSQL (`pg` driver, raw SQL — no ORM)   |
| Auth       | JWT (`jsonwebtoken`) + `bcrypt` password hashing |
| Validation | `express-validator`                          |

## Features

### System Administrator
- Dashboard (`GET /api/admin/dashboard`) with totals for users, stores, and ratings
- Add new users — normal or admin (`POST /api/admin/users`)
- Add new stores (`POST /api/admin/stores`)
- List and filter users (`GET /api/admin/users`) and stores (`GET /api/admin/stores`)
- View full details of a single user, including their rating if they're a Store Owner (`GET /api/admin/users/:id`)
- Update their own password (`PUT /api/admin/password`)

### Normal User
- Register (`POST /api/auth/register`) and log in (`POST /api/auth/login`)
- Browse and search stores (`GET /api/user/stores`)
- Submit or update a rating for a store (`POST /api/user/stores/:storeId/rating`)
- Update their own password (`PUT /api/user/password`)

### Store Owner
- Log in through the same shared login
- View their dashboard — raters and average rating (`GET /api/owner/dashboard`)
- Update their own password (`PUT /api/owner/password`)

### Cross-cutting
- Single login system (`POST /api/auth/login`) shared by all three roles, with `authenticate` + `authorize(role)` middleware gating every protected route
- Server-side validation on register/login via `express-validator`

## Form Validation Rules

Enforced in `backend/src/validators/authValidator.js`:

| Field    | Rule                                                                 |
|----------|-----------------------------------------------------------------------|
| Name     | 20–60 characters                                                     |
| Email    | Standard email format                                                |
| Address  | Optional, max 400 characters                                        |
| Password | 8–16 characters, must contain at least one uppercase letter and one special character |

## Project Structure

```
roxiler-store-rating/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               # PostgreSQL pool
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   ├── ownerController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # authenticate + authorize(role)
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── ownerRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── validators/
│   │   │   └── authValidator.js
│   │   ├── app.js                  # Express app + route mounting
│   │   └── server.js               # Entry point, connects DB, starts server
│   ├── .env
│   └── package.json
├── database/
│   └── schema.sql                  # PostgreSQL schema dump
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   └── ChangePassword.jsx
│   │   ├── App.jsx                 # Route definitions
│   │   └── main.jsx
│   └── package.json
└── .gitignore
```

## Database Schema

From `database/schema.sql`:

**users**
| Column     | Type                  | Notes                                          |
|------------|------------------------|-------------------------------------------------|
| id         | SERIAL                | Primary key                                    |
| name       | VARCHAR(60)            |                                                 |
| email      | VARCHAR(255)           | Unique                                         |
| password   | VARCHAR(255)           | Hashed with bcrypt                             |
| address    | VARCHAR(400)           |                                                 |
| role       | VARCHAR(20)            | `ADMIN`, `USER`, or `STORE_OWNER`              |
| created_at / updated_at | TIMESTAMP |                                                 |

**stores**
| Column     | Type                  | Notes                                          |
|------------|------------------------|-------------------------------------------------|
| id         | SERIAL                | Primary key                                    |
| name       | VARCHAR(60)            |                                                 |
| email      | VARCHAR(255)           |                                                 |
| address    | VARCHAR(400)           |                                                 |
| owner_id   | FK → users.id          | `ON DELETE CASCADE`                            |

**ratings**
| Column     | Type                  | Notes                                          |
|------------|------------------------|-------------------------------------------------|
| id         | SERIAL                | Primary key                                    |
| user_id    | FK → users.id          | `ON DELETE CASCADE`                            |
| store_id   | FK → stores.id         | `ON DELETE CASCADE`                            |
| rating     | INTEGER                | `CHECK (rating BETWEEN 1 AND 5)`               |
|            |                        | `UNIQUE (user_id, store_id)` — one rating per user per store |

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Clone the repository
```bash
git clone https://github.com/tusharrpal/roxiler-store-rating.git
cd roxiler-store-rating
```

### 2. Set up the database
```bash
createdb roxiler_store_rating
psql -d roxiler_store_rating -f database/schema.sql
```

### 3. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```
PORT=5001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=roxiler_store_rating
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_jwt_secret
```

Run the server:
```bash
npm run dev      # nodemon, for development
# or
npm start        # node, for production
```
The API starts on `http://localhost:5001` (or whatever `PORT` is set to) and logs `Database connected` once it can reach PostgreSQL.

### 4. Frontend setup
```bash
cd ../frontend
npm install
npm run dev
```
The frontend runs on Vite's default port (`http://localhost:5173`).

> The frontend doesn't currently read an API base URL from an env file — if you add one, point it at your backend's `PORT` (default `5001`).

## API Reference

All protected routes require `Authorization: Bearer <token>` and enforce role via `authorize(...)`.

### Auth (public)
| Method | Endpoint              | Description                     |
|--------|-------------------------|----------------------------------|
| POST   | `/api/auth/register`   | Register a normal user           |
| POST   | `/api/auth/login`      | Log in (any role)                |

### Admin (`role: ADMIN`)
| Method | Endpoint                  | Description                          |
|--------|-----------------------------|----------------------------------------|
| GET    | `/api/admin/dashboard`     | User/store/rating counts               |
| POST   | `/api/admin/users`         | Create a user or admin                 |
| POST   | `/api/admin/stores`        | Create a store                         |
| GET    | `/api/admin/users`         | List/filter users                      |
| GET    | `/api/admin/stores`        | List/filter stores                     |
| GET    | `/api/admin/users/:id`     | Get a single user's details            |
| PUT    | `/api/admin/password`      | Update own password                    |

### Normal User (`role: USER`)
| Method | Endpoint                        | Description                        |
|--------|-----------------------------------|--------------------------------------|
| GET    | `/api/user/stores`               | List/search stores                   |
| POST   | `/api/user/stores/:storeId/rating` | Submit or update a rating          |
| PUT    | `/api/user/password`             | Update own password                  |

### Store Owner (`role: STORE_OWNER`)
| Method | Endpoint                | Description                          |
|--------|----------------------------|----------------------------------------|
| GET    | `/api/owner/dashboard`     | Raters + average rating for own store |
| PUT    | `/api/owner/password`      | Update own password                    |

## Frontend Routes

Defined in `frontend/src/App.jsx`:

| Path               | Page               |
|---------------------|---------------------|
| `/`                 | Redirects to `/login` |
| `/login`            | `Login.jsx`         |
| `/signup`           | `Signup.jsx`        |
| `/admin`            | `AdminDashboard.jsx`|
| `/user`             | `UserDashboard.jsx` |
| `/owner`            | `OwnerDashboard.jsx`|
| `/change-password`  | `ChangePassword.jsx`|

## Notes

- Passwords are hashed with `bcrypt`; only the hash is ever stored or read back.
- A user can hold exactly one rating per store — enforced at the database level with a `UNIQUE (user_id, store_id)` constraint on `ratings`, so "submit" and "modify" both resolve to the same upsert path.
- `express-validator` handles registration/login input rules; add equivalent validators for the admin "create user/store" and rating-submission endpoints if not already covered in their controllers.
- No ORM is used — all queries go through the `pg` pool directly (`backend/src/config/db.js`).

## Author

Submitted as part of the Roxiler FullStack Intern coding challenge.








------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------




<img width="1000" height="956" alt="Screenshot 2026-08-23 at 4 17 17 PM" src="https://github.com/user-attachments/assets/d0c0ee19-6908-45e1-840b-13f81480be65" />
<img width="1000" height="956" alt="Screenshot 2026-08-23 at 4 17 50 PM" src="https://github.com/user-attachments/assets/981c464a-58d0-490d-9f28-b01521dc5ee1" />
<img width="1000" height="956" alt="Screenshot 2026-08-23 at 4 17 59 PM" src="https://github.com/user-attachments/assets/e34f9a16-b5e7-43ef-9741-92e1bb1eed5e" />
<img width="1000" height="956" alt="Screenshot 2026-08-23 at 4 18 36 PM" src="https://github.com/user-attachments/assets/852cd753-cde7-4feb-8113-c147fc6ed3a1" />
<img width="1000" height="956" alt="Screenshot 2026-08-23 at 4 20 07 PM" src="https://github.com/user-attachments/assets/0ed7c40b-fea9-49eb-bf9e-90b89fc30513" />





