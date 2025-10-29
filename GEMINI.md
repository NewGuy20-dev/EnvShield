# EnvShield: Gemini Development Guide

This document provides a comprehensive overview of the EnvShield project for Gemini, outlining the project structure, key technologies, and development conventions.

## Project Overview

EnvShield is a secure environment variable manager designed for teams. It consists of two main components:

1.  **Web Dashboard:** A Next.js application that provides a user interface for managing projects, environments, and variables.
2.  **CLI:** A Node.js-based command-line interface that offers a Git-like workflow for interacting with environment variables.

Secrets are encrypted at rest using AES-256-GCM, with the database schema managed by Prisma.

### Key Technologies

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Styling:** Tailwind CSS
*   **CLI:** Commander.js

## Building and Running

The following commands are essential for setting up and running the EnvShield project:

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Set Up Local Environment:**
    ```bash
    npm run setup:env
    ```
    This creates a `.env.local` file and generates an encryption key.

*   **Run Database Migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```
*   **Start Development Server:**
    ```bash
    npm run dev
    ```
    The web application will be available at `http://localhost:3000`.

*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Start Production Server:**
    ```bash
    npm run start
    ```
*   **Lint the Code:**
    ```bash
    npm run lint
    ```

### CLI Setup

To use the CLI locally, follow these steps:

1.  Navigate to the `cli` directory:
    ```bash
    cd cli
    ```
2.  Install CLI dependencies:
    ```bash
    npm install
    ```
3.  Link the CLI for local usage:
    ```bash
    npm link
    ```
    The `envshield` command will then be available in your terminal.

## Development Conventions

*   **Code Style:** The project uses ESLint for code linting. Run `npm run lint` to check for issues.
*   **Database:** Database schema changes are managed with Prisma Migrate. When you modify the `prisma/schema.prisma` file, run `npx prisma migrate dev` to create a new migration.
*   **API:** The web application likely communicates with the backend via API routes in the `app/api` directory (though none are present yet).
*   **Components:** React components are located in the `app/` directory, following the Next.js App Router conventions.
*   **Security:** Encryption logic is centralized in `lib/encryption.ts`. All sensitive data, such as environment variable values, should be encrypted before being stored in the database.
