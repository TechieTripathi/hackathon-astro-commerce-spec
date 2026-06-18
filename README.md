# astro-commerce-system-spec

Implementation specification for the Astro Commerce hackathon.

This repository is the single source of truth for participants building the Astro Commerce platform. It contains the backend specification, frontend handoff package, and a static documentation site that can be deployed on GitHub Pages.

## What This Repo Includes

- Backend business scope and lifecycle rules
- MongoDB data design
- API contracts and response formats
- Frontend page inventory
- Frontend state and integration rules
- Shared frontend types
- Mock API payloads

## Project Scope

- Single vendor
- India only
- Physical products only
- MongoDB as system database
- JWT authentication
- Razorpay, Cashfree, and COD
- GST-enabled invoicing
- 15-minute inventory reservation
- 15-day return window

## Repository Structure

```text
backend/
  api-documentation.md
  db-design.md
  features.md

frontend/
  frontend-api-mocks.json
  frontend-pages.md
  frontend-state-contract.md
  frontend-types.ts

index.html
site.css
site.js
```

## Recommended Reading Order

### Backend teams

1. `backend/features.md`
2. `backend/api-documentation.md`
3. `backend/db-design.md`

### Frontend teams

1. `backend/features.md`
2. `backend/api-documentation.md`
3. `frontend/frontend-pages.md`
4. `frontend/frontend-state-contract.md`
5. `frontend/frontend-types.ts`
6. `frontend/frontend-api-mocks.json`

## GitHub Pages

This repo includes a static documentation portal:

- `index.html`
- `site.css`
- `site.js`

Deploy the repository with GitHub Pages and participants can browse the documentation from a single link.

## Implementation Rules

- Backend naming: `snake_case`
- API naming: `camelCase`
- Frontend naming: `camelCase`
- IDs: MongoDB `ObjectId` exposed as strings
- Money in APIs: string values
- Dates: UTC ISO-8601
- Prepaid payment settlement: webhook is the final source of truth

## Notes For Participants

- Birth profiles are optional enrichment scope and are not required for core commerce implementation.
- Media upload APIs are out of scope in this spec. Image fields use pre-uploaded public CDN URLs.
- If a team does not implement automated COD refunds, they should still model COD refund handling as an explicit manual-admin flow.
