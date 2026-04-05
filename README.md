# Antigravity Kanban - Full-Stack Team Work Management

A modern, high-performance Kanban Board application inspired by Trello, built with React, Spring Boot, and MongoDB.

## Features

- **Authentication**: Secure JWT-based login and signup.
- **Boards**: Create, update, and manage multiple projects.
- **Lists & Tasks**: Dynamic drag-and-drop lists and task cards.
- **Checklists**: Task-level sub-items with completion tracking.
- **Priorities**: Color-coded task priorities (Low, Medium, High).
- **Comments**: Real-time discussions on tasks with timestamps.
- **Design**: Premium UI with glassmorphism, responsive layout, and smooth animations (Framer Motion).
- **Collaboration**: Invite members to boards and assign tasks.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** (Modern styling system)
- **Redux Toolkit** (State management)
- **@dnd-kit** (For advanced Drag & Drop)
- **Framer Motion** (Smoother animations)
- **Lucide-React** (Premium iconography)
- **Axios** (API communication)

### Backend
- **Java 17** + **Spring Boot 3.x**
- **Spring Security** (JWT-based Auth)
- **Spring Data MongoDB**
- **Lombok** (Boilerplate reduction)
- **Maven** (Dependency management)

### Database
- **MongoDB** (NoSQL for flexible task structures)

---

## Getting Started

### 1. Database Setup
Ensure MongoDB is running locally on port `27017` or update `backend/src/main/resources/application.properties` with your connection URI.

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### 2. Backend Setup
1. Navigate to the `backend` folder.
2. Build and run with Maven:
```bash
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080`.

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
```bash
npm install
```
3. Start the Vite dev server:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## API Documentation
The backend exposes RESTful endpoints under `/api`.
- `/api/auth/**` (Public)
- `/api/boards/**` (Protected)
- `/api/lists/**` (Protected)
- `/api/tasks/**` (Protected)
- `/api/comments/**` (Protected)
- `/api/users/**` (Protected)

---

## Implementation Details

### Drag & Drop
We use `@dnd-kit` for its modularity and accessibility. The board supports both vertical and horizontal reordering through a single `DndContext`.

### Security
JWT tokens are returned upon successful sign-in and stored in `localStorage`. They are automatically included in outgoing requests via an Axios interceptor.

### Optimistic UI
State updates immediately in the frontend for smooth D&D, then synchronizes with the backend through background API calls to ensure a lag-free experience.
