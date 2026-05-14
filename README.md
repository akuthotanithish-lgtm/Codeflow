# CodeFlow

A full-stack real-time competitive coding and social platform built for developers to practice coding, collaborate, and compete.

## Features

- Real-time competitive coding environment
- Multi-user support with live interactions
- Real-time chat using WebSockets
- Secure code execution engine
- Authentication and authorization system
- Admin dashboard and management endpoints
- Image uploads and user profile support
- Responsive frontend UI
- Backend API integration

---

# Tech Stack

## Frontend
- Next.js
- React.js
- Tailwind CSS
- WebSockets

## Backend
- Node.js
- Express.js
- MongoDB
- Redis
- WebSockets

## Other Tools
- Git & GitHub
- REST APIs
- JWT Authentication

---

# Project Structure

```bash
codeflow/
├── codeflowfrontend/
├── codeflow-backend/
├── .gitignore
└── README.md
```

---

# Key Highlights

## Real-Time Code Execution Engine
Built a real-time code execution engine using Node.js child processes and WebSockets with sandboxing and timeout control.

## Real-Time Communication
Implemented live interactions and messaging using WebSockets.

## Authentication System
Integrated secure user authentication and protected routes.

## Scalable Backend
Designed backend APIs with modular architecture and database integration.

---

# Installation

## Clone Repository

```bash
git clone https://github.com/akuthotanithish-lgtm/Codeflow.git
cd Codeflow
```

---

# Backend Setup

```bash
cd codeflow-backend
npm install
```

Create a `.env` file inside `codeflow-backend`.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
OPENROUTER_API_KEY=your_api_key
```

Start backend:

```bash
npm run dev
```

---

# Frontend Setup

```bash
cd codeflowfrontend
npm install
npm run dev
```

---

# Future Improvements

- Docker sandboxing for code execution
- Leaderboards and rankings
- Online judge integration
- Video calling and collaboration rooms
- AI-powered coding assistant
- CI/CD deployment pipeline

---

# Author

## Nithish Akuthota

- GitHub: https://github.com/akuthotanithish-lgtm

---

# License

This project is created for learning, development, and portfolio purposes.
