# Mono API

A simple backend API for [MONO](https://monograph.pages.dev) built with ElysiaJS on top of Bun.

## Structure

```plaintext
Mono API
├── src/                   # Source code directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── backup/        # Backups
│   │   ├── file/          # Files
│   │   ├── section/       # Sections
│   │   ├── share/         # Sharing
│   │   └── user/          # Users
│   ├── database/          # Database configuration and migrations
│   ├── utils.ts           # Utility functions
│   └── index.ts           # Main entry point of the application
└── start.sh               # Startup script
```

## Technologies

- [Bun](https://bun.sh) - Runtime
- [ElysiaJS](https://elysia.sh) - Framework
- [Prisma](https://prisma.io) - Database ORM
- [PostgreSQL](https://postgresql.org) - Database
- [Docker](https://docker.com) - Containerization
- [Docker Compose](https://docker.com) - Orchestration
