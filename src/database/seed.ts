import { db } from "./connection";
import { files, keys, sections } from "./schema";

db.insert(keys).values({
  key: Bun.env.DEFAULT_API_KEY!,
});

db.insert(sections).values({
  name: "General",
  authorId: "1",
  public: true,
});

db.insert(files).values([
  {
    filename: "readme.md",
    text: "# Project Documentation\nWelcome to the project documentation.",
    type: "text/markdown",
    sectionId: "1",
    authorId: "1",
    path: "docs/readme.md",
    section: "General",
  },
  {
    filename: "config.json",
    text: '{"debug": true, "port": 3000, "environment": "development"}',
    type: "application/json",
    sectionId: "1",
    authorId: "1",
    path: "config/config.json",
    section: "General",
  },
  {
    filename: "styles.css",
    text: "body { font-family: sans-serif; margin: 0; padding: 20px; }",
    type: "text/css",
    sectionId: "1",
    authorId: "1",
    path: "assets/styles.css",
    section: "General",
  },
  {
    filename: "script.js",
    text: "function init() { console.log('Application started'); }",
    type: "application/javascript",
    sectionId: "1",
    authorId: "1",
    path: "src/script.js",
    section: "General",
  },
  {
    filename: "schema.sql",
    text: "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);",
    type: "application/sql",
    sectionId: "1",
    authorId: "1",
    path: "database/schema.sql",
    section: "General",
  },
]);
