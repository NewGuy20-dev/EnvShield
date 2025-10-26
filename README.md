# EnvShield

EnvShield is a secure environment variable manager designed for teams. It provides a Git-like CLI workflow and a web dashboard to securely store, share, and manage environment variables. Secrets are encrypted at rest using AES-256-GCM.

## Local Setup

1.  Clone the repository:
    ```bash
    git clone <repo>
    ```
2.  Navigate to the project directory:
    ```bash
    cd envshield
    ```
3.  Create a local environment file from the example:
    ```bash
    cp .env.example .env.local
    ```
4.  Fill in the required environment variables in `.env.local`.
5.  Install the dependencies for the main application:
    ```bash
    npm install
    ```
6.  Run the database migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
7.  Start the development server:
    ```bash
    npm run dev
    ```
8.  In a separate terminal, install the CLI dependencies and link the CLI for local usage:
    ```bash
    cd cli
    npm install
    npm link
    ```

The web application will be available at `http://localhost:3000`, and the `envshield` command will be available in your terminal.
