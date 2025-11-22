<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neon Arcade

A cyberpunk-themed arcade platform with a React frontend and Node.js/Express backend.

## Features
- **Cyberpunk UI**: Glassmorphism design, neon accents, and smooth animations.
- **Game Hub**: Browse and play various mini-games (Tic-Tac-Toe, Binary Hacker, etc.).
- **Account System**: Secure user registration and login using JWT and bcrypt.
- **Backend API**: RESTful API built with Express and SQLite.

## Project Structure
- `src/`: Frontend source code (React, Tailwind CSS).
- `server/`: Backend source code (Express, Sequelize, SQLite).

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

### Running the Application

You need to run both the frontend and backend servers.

1. **Start the Backend Server**:
   Open a terminal and run:
   ```bash
   cd server
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

2. **Start the Frontend Development Server**:
   Open a new terminal and run:
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:3000`.

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
  - Body: `{ "username": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login`: Login and receive a JWT token.
  - Body: `{ "email": "...", "password": "..." }`

## Technologies
- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, SQLite, Sequelize
- **Auth**: JSON Web Tokens (JWT), bcryptjs
