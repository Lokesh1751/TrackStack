# TrackStack

TrackStack is a modern Agile Project Management platform built with Next.js, NestJS, Prisma and Neon PostgreSQL.

It helps teams manage workspaces, projects, sprints, tasks and collaboration workflows with real-time updates, notifications and sprint analytics.

---

# Features

## Workspace Management

* Super Admins can create and manage workspaces
* Workspace Admins can manage workspace members
* Users can be invited into workspaces
* Role-based workspace access control

## Profile Management

* User profile management
* Update personal information
* Profile settings and account preferences
* Secure account management

## Project Management

* Workspace Admins can create projects
* Organized project listing and management
* Invitation-based project member system
* Project member management

## Task Board

* Modern Kanban-style task board
* Task workflow management
* Task assignment and tracking
* Task comments for collaboration and discussions
* Nested threaded replies for task discussions
* User mentions inside comments
* Task status management
* Drag and drop task board

## Sprint Management

* Create sprint cycles with goals and timelines
* Start and complete sprint workflows
* Sprint lifecycle tracking
* Sprint planning and execution

## Sprint Analytics

* Sprint analysis reports
* Charts and productivity insights
* Agile workflow monitoring
* Performance tracking dashboards

## Notifications System

* Database-backed notifications
* Real-time WebSocket notifications
* Read and unread notification tracking
* Notification center
* Deep linking support for notifications
* Direct navigation to related resources

## Real-Time Updates

* WebSocket integration
* Instant notification delivery
* Live collaboration experience
* Real-time task and activity updates

## Deep Linking

* Smart redirection from notifications
* Project-level navigation
* Task-level navigation
* Sprint-level navigation
* Comment and mention-based navigation

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* TanStack Query
* Socket.IO Client

## Backend

* NestJS
* Prisma ORM
* Neon PostgreSQL
* Socket.IO

## UI & Libraries

* Lucide React Icons
* Sonner Toast
* Reusable Component Architecture

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
http://localhost:3001
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
PORT=3000
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
http://localhost:3000
```

---

# Roles

## Super Admin

* Manage workspaces
* Add workspace admins

## Workspace Admin

* Create projects
* Invite project members
* Manage collaboration workflows

## Member

* Access assigned projects
* Collaborate on tasks and sprints

---

# Main Modules

## Workspaces

Workspace creation and team management.

## Projects

Project organization and agile workflows.

## Tasks

Kanban task board with threaded discussions, mentions and collaboration.

## Sprints

Sprint creation, completion and analytics tracking.

## Notifications

Database and WebSocket powered notification system with deep linking.

## Profile

User account and profile management.

## Reports & Analytics

Sprint performance reports and charts.

---

# UI Features

* Responsive modern dashboards
* Light-themed clean UI
* Skeleton loading states
* Reusable modals and layouts
* Mobile responsive design
* Real-time toast notifications
* Smart navigation and deep linking

---

# Database

TrackStack uses:

* Prisma ORM
* Neon PostgreSQL Database

---

# Future Improvements

* File attachments
* Team chat system
* Activity timeline
* Email digest notifications
* Advanced reporting dashboard
* Calendar and timeline views

---

# Author

Built using Next.js, NestJS, Prisma, Neon PostgreSQL and WebSocket-based real-time architecture.
