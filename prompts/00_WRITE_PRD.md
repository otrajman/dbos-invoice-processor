# Prompt for Generating a Product Requirements Document (PRD)

## Persona

You are a Senior Product Manager with deep expertise in B2B FinTech. You excel at creating clear, actionable PRDs that bridge the gap between business needs and engineering execution.

## Task

Generate a comprehensive PRD for an AI-powered Invoice Processing application. This document will be the single source of truth for the development team. The PRD needs to be detailed enough to guide UI/UX design, backend development, and database architecture.

## Core Workflow

The application's core purpose is to automate the invoice lifecycle. An invoice moves through the following states:

1.  **Upload & Extraction**: A user uploads an invoice (PDF, PNG, JPG). An LLM extracts key data.
2.  **Validation**: The system performs automated checks (e.g., math validation, duplicate detection).
3.  **Triage**:
    *   **Success -> Awaiting Approval**: If validation passes.
    *   **Failure -> Needs Review**: If validation fails or data extraction has low confidence.
4.  **Manual Review**: A **Finance Clerk** reviews invoices in the "Needs Review" queue, corrects data using a side-by-side view of the invoice document and the data form, and then submits it for approval.
5.  **Approval**: A **Finance Manager** reviews invoices in the "Awaiting Approval" queue. They can approve or reject them.
6.  **Final State**: The invoice is now either "Approved" (and ready for payment) or "Rejected".

## PRD Structure

Generate the PRD with the following sections. Be specific and detailed.

### 1. Overview
*   **Problem Statement**: What are the key pains of manual invoice processing?
*   **Goals & Objectives**: What are the measurable goals (e.g., reduce processing time by X%, achieve Y% data accuracy)?
*   **User Personas**:
    *   **Finance Clerk**: Focus on their data entry and correction tasks.
    *   **Finance Manager**: Focus on their approval and oversight responsibilities.

### 2. Features & Functionality
*   **Dashboard**: What are the key metrics and queues for each persona?
*   **Invoice Upload**: Describe the UI and the immediate backend process.
*   **Invoice Detail View**: Describe the two-panel UI (document + data form). List all fields to be extracted by the LLM (e.g., Vendor Name, Invoice Number, Line Items, etc.).
*   **Workflow & Status**: Define all possible invoice statuses (`Processing`, `Needs Review`, `Awaiting Approval`, `Approved`, `Rejected`, `Paid`) and how they map to the dashboard queues.
*   **Manual Review**: Detail the correction and resubmission process.
*   **Approval/Rejection**: Describe the UI and logic for both actions.

### 3. Technical Requirements
*   **API Endpoints**: Define the necessary RESTful API endpoints (method, URL, purpose). Include endpoints for upload, CRUD operations on invoices, and workflow actions (approve, reject).
*   **Database Schema**: Propose a logical schema for the necessary tables (`invoices`, `vendors`, `users`, `line_items`). Specify key fields, types, and relationships.
*   **LLM Integration**: Describe the expected input (invoice file) and output (structured JSON with data and confidence scores) of the LLM service.

### 4. Non-Functional Requirements
*   **Security**: Mention basic security considerations (e.g., role-based access control, data encryption).
*   **Performance**: Define basic performance expectations (e.g., page load times, API response times).
*   **Scalability**: Briefly mention the need to handle growing data volumes.

### 5. Out of Scope
*   List features that will **not** be included in the initial release (e.g., payment processing, user management, mobile app).

Write the output to `context/prd.md`.
Confirm that the output is written to `context/prd.md`
