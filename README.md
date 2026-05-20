# TrackStack

TrackStack is a modern Agile Project Management platform built with Next.js, NestJS, Prisma and Neon PostgreSQL.

It helps teams manage workspaces, projects, sprints and tasks with structured collaboration workflows and sprint analytics.

---

# Features

## Workspace Management

- Super Admins can create and manage workspaces
- Workspace Admins can manage workspace members
- Users can be invited into workspaces
- Role-based workspace access control

## Project Management

- Workspace Admins can create projects
- Organized project listing and management
- Invitation-based project member system

## Task Board

- Modern Kanban-style task board
- Task workflow management
- Task comments for collaboration and discussions
- Team communication directly inside tasks

## Sprint Management

- Create sprint cycles with goals and timelines
- Start and complete sprint workflows
- Sprint lifecycle tracking

## Sprint Analytics

- Sprint analysis reports
- Charts and productivity insights
- Agile workflow monitoring

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- TailwindCSS
- TanStack Query

## Backend

- NestJS
- Prisma ORM
- Neon PostgreSQL

## UI & Libraries

- Lucide React Icons
- Sonner Toast
- Reusable Component Architecture

---

# Package Manager

This project uses **Yarn** for both frontend and backend.

---

# Project Structure

```bash
trackstack/
│
├── frontend/
└── backend/
```

---

# Frontend Setup

## Navigate to Frontend

```bash
cd frontend
```

## Install Dependencies

```bash
yarn
```

## Run Development Server

```bash
yarn dev
```

Frontend runs on:

```bash
http://localhost:3000
```

---

# Backend Setup

## Navigate to Backend

```bash
cd backend
```

## Install Dependencies

```bash
yarn
```

## Setup Environment Variables

Create `.env`

```env
DATABASE_URL=your_neon_postgres_url
JWT_SECRET=your_secret
PORT=3001
```

---

# Prisma Setup

## Generate Prisma Client

```bash
yarn prisma generate
```

## Run Database Migrations

```bash
yarn prisma migrate dev
```

---

# Run Backend Server

```bash
yarn start
```

Backend runs on:

```bash
http://localhost:3001
```

---

# Roles

## Super Admin

- Manage workspaces
- Add workspace admins

## Workspace Admin

- Create projects
- Invite project members
- Manage collaboration workflows

## Member

- Access assigned projects
- Collaborate on tasks and sprints

---

# Main Modules

## Workspaces

Workspace creation and team management.

## Projects

Project organization and agile workflows.

## Tasks

Kanban task board with collaboration comments.

## Sprints

Sprint creation, completion and analytics tracking.

## Reports & Analytics

Sprint performance reports and charts.

---

# UI Features

- Responsive modern dashboards
- Light-themed clean UI
- Skeleton loading states
- Reusable modals and layouts
- Mobile responsive design

---

# Database

TrackStack uses:

- Prisma ORM
- Neon PostgreSQL Database

---

# Future Improvements

- Real-time notifications
- Drag and drop task board
- File attachments
- Team chat system
- Activity timeline
- WebSocket updates

---

# Author

Built using Next.js, NestJS, Prisma and Neon PostgreSQL.
