# Mono API

A simple backend API for [MONO](https://monograph.pages.dev) built with ElysiaJS on top of Bun.

## Structure

```plaintext
Mono API
└── src/                   # Source code directory
    ├── api/               # API routes
    │   ├── auth/          # Authentication
    │   ├── backup/        # Backups
    │   ├── file/          # Files
    │   ├── section/       # Sections
    │   ├── share/         # Sharing
    │   └── user/          # Users
    ├── database/          # Database configuration and migrations
    ├── utils.ts           # Utility functions
    └── index.ts           # Main entry point of the application
```

## Technologies

- [Bun](https://bun.sh) - Runtime
- [ElysiaJS](https://elysia.sh) - Framework
- [Drizzle](https://orm.drizzle.team/) - Database ORM
- [SQLite](https://sqlite.org) - Database
- [Docker](https://docker.com) - Containerization
- [Docker Compose](https://docker.com) - Orchestration
