# Chaussy API

A home asset and warranty management REST API built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**.

---

## Features

- **User auth** — JWT access tokens + rotating refresh tokens via HTTP-only cookies, Google OAuth 2.0
- **Email flows** — email verification and password reset via SendGrid
- **Homes & rooms** — manage properties and rooms with profile picture support (S3)
- **Assets** — track household assets assigned to a home or room
- **Warranties** — manual entry or AI-assisted extraction from PDF (Gemini 2.5 Flash)
- **Warranty documents** — upload and retrieve files from S3 with presigned URLs
- **Automated notifications** — cron jobs send expiry reminder emails at 30 days, 7 days, and on expiry
- **Data export** — download a full JSON export of all user data with presigned document URLs
- **Account deletion** — GDPR-compliant full data wipe including S3 files
- **Premium system** — free tier limits on assets, warranties, homes, and AI extractions
- **Rate limiting** — tiered limits for general, auth, and sensitive routes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| File Storage | AWS S3 |
| Email | SendGrid |
| AI Extraction | Google Gemini 2.5 Flash |
| Auth | JWT, bcrypt, Google OAuth 2.0 |
| Validation | Zod |
| Scheduling | node-cron |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- AWS S3 bucket
- SendGrid account with a verified sender
- Google Cloud project with OAuth 2.0 credentials
- Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/ejohchisimdi-collab/Chaussy.git
cd chaussy
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
POSTGRES_USER=chaussy
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=chaussy

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@yourdomain.com

# Google Gemini
GEMINI_API_KEY=your_gemini_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/oauth/google/callback
```

### 3. Run with Docker

```bash
docker compose up --build
```

The API will be available at `http://localhost:3000`.

On first start, Prisma migrations are automatically applied before the server boots.

### 4. Run locally (without Docker)

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/register` | ❌ | Register a new user |
| POST | `/users/login` | ❌ | Log in, receive access token + refresh cookie |
| GET | `/users/profiles` | ✅ | View your profile |
| PUT | `/users/profiles` | ✅ | Update your name |
| POST | `/users/picture` | ✅ | Upload profile picture |
| DELETE | `/users/picture` | ✅ | Delete profile picture |
| GET | `/users/picture` | ✅ | Get profile picture presigned URL |
| POST | `/users/email/generation` | ✅ | Send email verification code |
| POST | `/users/email/confirmation` | ✅ | Verify email with code |

### Token Refresh — `/refresh`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/refresh` | ❌ | Refresh access token using cookie |
| POST | `/refresh/logout` | ❌ | Revoke refresh token and clear cookie |

### Google OAuth — `/oauth/google`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/oauth/google/redirect` | Redirect to Google login |
| GET | `/oauth/google/callback` | Handle Google OAuth callback |

### Password Reset — `/passwords`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/passwords/reset?email=` | Send password reset code to email |
| POST | `/passwords/confirmation` | Confirm code and set new password |

### Homes — `/homes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/homes` | ✅ | Add a home |
| PUT | `/homes` | ✅ | Edit a home |
| GET | `/homes` | ✅ | List your homes |
| POST | `/homes/profiles/:id` | ✅ | Upload home profile picture |
| DELETE | `/homes/profiles/:id` | ✅ | Delete home profile picture |
| GET | `/homes/profiles/:id` | ✅ | Get home profile picture presigned URL |

### Rooms — `/rooms`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/rooms` | ✅ | Add a room to a home |
| PUT | `/rooms` | ✅ | Edit a room |
| GET | `/rooms/:homeId` | ✅ | List rooms for a home |

### Assets — `/assets`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/assets/homes` | ✅ | Add asset to a home |
| POST | `/assets/rooms` | ✅ | Add asset to a room |
| PUT | `/assets` | ✅ | Edit an asset |
| GET | `/assets/homes/:homeId` | ✅ | List assets for a home |
| GET | `/assets/rooms/:roomId` | ✅ | List assets for a room |

### Warranties — `/warranties`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/warranties` | ✅ | Add a warranty manually |
| PUT | `/warranties` | ✅ | Edit a warranty |
| GET | `/warranties/:assetId` | ✅ | List warranties for an asset |
| POST | `/warranties/documents/auto/:assetId` | ✅ | Upload PDF and auto-extract warranty via AI |
| POST | `/warranties/documents/:warrantyId` | ✅ | Upload a warranty document |
| GET | `/warranties/documents/:warrantyId` | ✅ | List documents for a warranty |
| GET | `/warranties/documents/url/:documentId` | ✅ | Get document presigned download URL |
| DELETE | `/warranties/documents/:documentId` | ✅ | Delete a warranty document |

### Settings — `/settings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PUT | `/settings` | ✅ | Update settings (email notifications) |
| GET | `/settings` | ✅ | View your settings |

### Deletes — `/deletes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| DELETE | `/deletes/homes/:homeId` | ✅ | Delete a home and all its data |
| DELETE | `/deletes/rooms/:roomId` | ✅ | Delete a room and all its data |
| DELETE | `/deletes/asset/:assetId` | ✅ | Delete an asset and all its data |
| DELETE | `/deletes/account` | ✅ | GDPR account deletion |

### Export — `/exports`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/exports` | ✅ | Download full data export as JSON |

### Premium — `/request-premium`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/request-premium` | ✅ | Register interest in premium |

---

## Free Tier Limits

| Resource | Limit |
|---|---|
| Homes | 1 |
| Assets | 20 |
| Warranties | 15 |
| AI PDF extractions | 3 |
| Warranty document storage | 50 MB total |

---

## Pagination & Sorting

All list endpoints support the following query parameters:

| Parameter | Default | Description |
|---|---|---|
| `pageNumber` | `0` | Zero-indexed page number |
| `size` | `10` | Results per page |
| `orderBy` | `desc` | `asc` or `desc` by `createdAt` |

---

## Authentication

Chaussy uses a dual-token strategy:

- **Access token** — short-lived JWT (15 min), passed as `Authorization: Bearer <token>`
- **Refresh token** — long-lived UUID (7 days), stored in an HTTP-only `Strict` cookie; rotated on every use

---

## Scheduled Jobs

Three cron jobs run daily at 09:00 to manage warranty lifecycle:

- **Status update** — marks warranties as `ACTIVE`, `EXPIRING_SOON`, or `EXPIRED`
- **30-day reminder** — emails users whose warranties expire within 30 days
- **7-day reminder** — emails users whose warranties expire within 7 days
- **Expiry notification** — emails users the day after a warranty expires

Email notifications only fire if the user has `enableEmailNotifications: true` in their settings and a verified email address.

---

## License

ALL RIGHTS RESERVED