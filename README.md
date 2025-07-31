# AI-Powered Invoice Processing Application

This repository contains a full-stack, AI-driven invoice processing application built with DBOS (Durable Business Operating System). The application automates the entire invoice lifecycle, from upload and data extraction to multi-level approval workflows.

The backend is built on Node.js with the DBOS TypeScript SDK, ensuring that the core business logic is durable and fault-tolerant. The frontend is a modern single-page application built with React, TypeScript, and Tailwind CSS.

## Core Features

*   **Durable Workflows**: Leverages DBOS to create resilient, long-running workflows for invoice processing that can survive server restarts and failures.
*   **Automated Data Extraction**: A placeholder for an LLM-based service to extract key information from uploaded invoice documents (PDF, PNG, JPG).
*   **Role-Based Dashboards**: Separate, tailored dashboards for **Finance Clerks** (reviewing and correcting invoices) and **Finance Managers** (approving or rejecting invoices).
*   **Multi-Step Approval Process**: Invoices move through a defined lifecycle: `Uploaded` -> `Needs Review` -> `Awaiting Approval` -> `Approved`/`Rejected`.
*   **Side-by-Side Document Viewer**: A two-panel UI allowing users to view the original invoice document alongside the extracted data form for easy validation and correction.
*   **RESTful API**: A comprehensive API for managing invoices, users, and workflows.
*   **Database Management**: Uses Knex.js for database migrations and seeding.

## Tech Stack

| Area      | Technology                                       |
| --------- | ------------------------------------------------ |
| **Backend** | [DBOS](https://www.dbos.dev/), Node.js, Express, TypeScript |
| **Frontend**| React, TypeScript, Vite, Tailwind CSS, Axios     |
| **Database**| PostgreSQL, [Knex.js](https://knexjs.org/) (for migrations & seeding) |
| **Testing** | Jest, Supertest                                  |

## Project Structure

```
/
├── frontend/         # React frontend source code
├── migrations/       # Knex.js database migration files
├── seeds/            # Knex.js database seed files
├── src/              # DBOS backend source code (workflows, transactions, API)
├── tests/            # Backend integration tests
├── uploads/          # Directory for storing uploaded invoice files
├── dbos-config.yaml  # DBOS application configuration
├── knexfile.ts       # Knex.js configuration
├── package.json      # Project dependencies and scripts
└── tsconfig.json     # TypeScript configuration
```

## Getting Started

### Prerequisites

*   Node.js (v18 or later)
*   npm
*   A running PostgreSQL instance

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd dbos-invoice-processor
    ```

2.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your PostgreSQL connection string.

    ```env
    DBOS_DATABASE_URL="postgresql://postgres:*****@localhost:5432/postgres"
    ```

3.  **Install Dependencies:**
    This command installs both root-level and frontend dependencies.
    ```bash
    npm install
    ```

4.  **Run Database Migrations:**
    This will create the necessary tables in your database.
    ```bash
    npm run migrate
    ```

5.  **Seed the Database:**
    This will populate the database with initial demo data, including users and invoices.
    ```bash
    npm run seed
    ```

### Running the Application

1.  **Build the Application:**
    This command compiles the backend TypeScript code and builds the frontend React application.
    ```bash
    npm run build
    ```

2.  **Start the Server:**
    This starts the DBOS application, including the Express server that serves both the API and the frontend.
    ```bash
    npm run start
    ```
    The application will be available at **http://localhost:3000**.

### Development Mode

To run the application in development mode with hot-reloading for both the frontend and backend, use:

```bash
npm run dev
```

This command uses `concurrently` to run the Vite development server for the frontend and a `ts-node` server for the backend.

## Available Scripts

*   `npm run start`: Starts the production server after a build.
*   `npm run dev`: Starts the application in development mode.
*   `npm run build`: Builds both the backend and frontend for production.
*   `npm run build:backend`: Compiles the backend TypeScript code.
*   `npm run build:frontend`: Builds the frontend React application.
*   `npm test`: Runs the backend integration tests.
*   `npm run migrate`: Applies database migrations.
*   `npm run seed`: Seeds the database with initial data.

