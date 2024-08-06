# Orbiter API

Welcome to the Orbiter API, a comprehensive backend solution for real-time messaging and user management. Built on Node.js with Express, this API features integration with Socket.IO for live communications, Firebase Admin SDK for authentication, MongoDB for data persistence, and many more technologies to provide you with a robust and scalable backend service.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Common Endpoints](#common-endpoints)
  - [User Endpoints](#user-endpoints)
  - [Search Endpoints](#search-endpoints)
  - [Posts Endpoints](#posts-endpoints)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Chats Endpoints](#chats-endpoints)
  - [Groups Endpoints](#groups-endpoints)
  - [Hirings Endpoints](#hirings-endpoints)
  - [Messaging Endpoints](#messaging-endpoints)
  - [News Endpoints](#news-endpoints)
  - [Notifications Endpoints](#notifications-endpoints)
  - [Admin Endpoints](#admin-endpoints)
  - [Feedback Endpoints](#feedback-endpoints)
- [Static Files](#static-files)

---
## Features

- Real-time group messaging through WebSocket connections.
- User authentication and session management.
- Scheduled cron jobs for routine tasks.
- Middleware customization and efficient logging with Morgan.
- File handling with Multer for uploads.
- Environment variable management through dotenv.
- Cross-Origin Resource Sharing (CORS) enabled.
- Custom error handling for file upload errors.

## Prerequisites

Before you get started, make sure you have:

- Node.js installed (v20.x or later).
- NPM for package management.
- MongoDB running locally or set up as a cloud instance.
- Firebase project created and `serviceAccountKeyFirebase.json` available.
- A `.env` file in your root directory with necessary environment variables set.

## Installation

To get this project up and running on your local machine, follow these steps:

```bash
# Clone the repository
git clone https://github.com/diasporahamlet/socilious.git

# Navigate to the repository directory
cd socilious

# Install dependencies
npm install

# Start the server (default port is set to 3000)
npm start

```
## Environment Variables
Create a `.env` file in the root of your project and fill it with the necessary information:

## Usage
How you can interact with some of the main endpoints:

## Endpoints

Each section below provides information about the corresponding set of endpoints managed by the respective routers. All endpoints are prefixed with `/api/v1`.

### Common Endpoints
Endpoints for common utility actions across the application.
- `GET /api/v1/common/...`: General endpoints for fetching common data.

### User Endpoints
Endpoints related to user account management and profile functionality.
- `POST /api/v1/user/forgot-password`: Endpoint to request password reset links for users.


### Search Endpoints
Endpoints for search functionality and user activity tracking.

- `POST /api/v1/search`: Endpoint to perform a search.
- `POST /api/v1/search_history`: Endpoint to track search history.
- `POST /api/v1/fetch_history`: Endpoint to fetch saved search data.
- `POST /api/v1/profile_visit`: Endpoint to track profile visits.
- `POST /api/v1/saved_profile`: Endpoint to save a profile.


### Posts Endpoints
Endpoints for post creation, modification, deletion, and retrieval.
- `GET /api/v1/posts/...`: Retrieve all posts, or specific posts by ID.
- `POST /api/v1/posts/...`: Create new posts.

### Authentication Endpoints
Endpoints for user authentication including login and registration paths.
- `POST /api/v1/auth/login`: Authenticate a user and return a token.
- `POST /api/v1/auth/register`: Register a new user.

### Chats Endpoints
Endpoints for real-time chat functionality.
- `GET /api/v1/chats/...`: Fetch user-specific chat rooms.

### Groups Endpoints
Endpoints for managing group-related features.
- `POST /api/v1/groups/...`: Create a new group.

### Hirings Endpoints
Endpoints for hiring processes and job postings.
- `GET /api/v1/hirings/...`: Retrieve available job postings.

### Messaging Endpoints
Endpoints for handling private messaging between users.
- `POST /api/v1/messaging/...`: Send a new message to another user.

### News Endpoints
Endpoints for news articles sharing and management.
- `GET /api/v1/news/...`: Fetch latest news articles.

### Notifications Endpoints
Endpoints for managing user notifications.
- `GET /api/v1/notification/...`: Retrieve current user notifications.

### Admin Endpoints

Endpoints for administrative tasks.

- `POST /api/v1/admin/register`: Register a new admin.
- `POST /api/v1/admin/login`: Login as an admin.
- `POST /api/v1/admin/forgotPassword`: Reset admin password.
- `POST /api/v1/admin/changePassword`: Change admin password.

Requires authentication as an admin:

- `GET /api/v1/admin/getAllRecruiter`: Get all recruiters.
- `GET /api/v1/admin/getAllJobseekers`: Get all job seekers.
- `GET /api/v1/admin/getAllUsers`: Get all users.
- `PATCH /api/v1/admin/changeStatus`: Change status of a recruiter.
- `GET /api/v1/admin/getFeedback`: Get all feedbacks.
- `GET /api/v1/admin/getAllVerifications`: Get all verifications.
- `PATCH /api/v1/admin/changeVerificationStatus`: Change verification status.
- `GET /api/v1/admin/getInvestors`: Get all investors.

### Feedback Endpoints
Endpoints for collecting user feedback.
- `POST /api/v1/feedback/...`: Submit user feedback.

---

## Static Files

The API also serves static files uploaded by users:

- **Avatars**: Accessed via `/avatar/image-name.jpg`. Served from the local `upload/images` directory.
- **Videos**: (Commented out in the provided code) Could be accessed via `${apiv1}/posts/videos/video-name.mp4` if enabled.

