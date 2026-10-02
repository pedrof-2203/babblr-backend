# Babblr Backend

Babblr is a chat API built with NestJS and MongoDB. It provides user accounts, cookie-based authentication, chat creation, message history, and GraphQL subscriptions for new messages.

## Features

- Register users with validated email addresses and passwords hashed with bcrypt.
- Log in and out using an HTTP-only JWT cookie.
- Query users and update or delete the authenticated user's account.
- Create chats and list them with their latest message.
- Send messages and retrieve paginated message history, newest first.
- Subscribe to new messages in selected chats, excluding messages sent by the subscriber.
- Retrieve chat and message counts through REST endpoints.
- Apply database migrations on startup and log HTTP requests with Pino.

## Tech stack

| Area                         | Technologies                                                               |
| ---------------------------- | -------------------------------------------------------------------------- |
| Language and runtime         | TypeScript 6, Node.js                                                      |
| Application                  | NestJS 12, Express 5                                                       |
| API                          | Apollo Server 5, code-first GraphQL, `graphql-ws`, `graphql-subscriptions` |
| Persistence                  | MongoDB, Mongoose 9, `migrate-mongo`                                       |
| Authentication               | Passport local/JWT strategies, `@nestjs/jwt`, bcrypt, cookie-parser        |
| Validation and configuration | class-validator, class-transformer, Joi, `@nestjs/config`                  |
| Logging                      | nestjs-pino, pino-http, pino-pretty                                        |
| Development and testing      | pnpm, Nest CLI, Oxlint, Prettier, Jest, ts-jest, Supertest                 |

## Architecture

This is a single NestJS application. REST controllers and GraphQL resolvers call services; repositories encapsulate Mongoose access. GraphQL types and inputs are defined with decorators, and the schema is generated in memory at startup.

Users are stored in the `users` collection. Chats are stored in `chats`, with messages embedded in each chat document. Aggregation pipelines provide pagination, latest-message summaries, and message authors. A shared in-memory PubSub instance distributes subscription events within one application process.

```text
src/
├── main.ts                 # Bootstrap, validation, cookies, logging, listening port
├── app.module.ts           # Configuration and GraphQL/subscription setup
├── auth/                   # Login/logout, JWT and local strategies, guards
├── users/                  # User model, repository, service, GraphQL resolver
├── chats/                  # Chat persistence, queries, creation, REST count
│   └── messages/           # Embedded messages, subscriptions, REST count
├── common/
│   ├── database/           # MongoDB connection, base repository, migration runner
│   ├── dto/                # Shared pagination arguments
│   └── pub-sub/            # In-memory subscription event bus
└── migrations/             # Database migrations compiled with the application
test/                       # HTTP smoke test and E2E configuration
jest.config.ts              # Unit test configuration
pnpm-workspace.yaml         # Dependency build permissions, including bcrypt
```

Chat access currently requires authentication but is not restricted by ownership or membership. Authenticated users can list all chats and read or send messages to any chat ID. PubSub events are not shared across application instances.

## Getting started

### Prerequisites

- Node.js compatible with the installed dependencies. Node.js 24 was used to verify the build; the repository does not pin a Node.js version.
- pnpm. A lockfile is included, but no package-manager version is pinned.
- A running MongoDB instance accessible to the application, with permission to write data and create indexes. The repository does not specify a MongoDB server version.

### Install

From the repository root:

```bash
pnpm install --frozen-lockfile
```

### Configure the environment

Create a `.env` file in the repository root. The following values are local examples; replace the JWT secret with your own random secret.

```dotenv
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/babblr
DB_NAME=babblr
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION=3600
NODE_ENV=development
```

`.env` is ignored by Git. The application loads it through `@nestjs/config`.

| Variable         | Required | Purpose                                                                                                                |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PORT`           | Yes      | HTTP listening port; no application default is defined.                                                                |
| `MONGODB_URI`    | Yes      | MongoDB connection URI for Mongoose and the migration runner. Include the database name in the URI.                    |
| `DB_NAME`        | Yes      | Database selected by the migration runner. Use the same database as the URI.                                           |
| `JWT_SECRET`     | Yes      | Secret used to sign and verify JWTs for HTTP and WebSocket authentication.                                             |
| `JWT_EXPIRATION` | Yes      | JWT lifetime in seconds, converted to a number when configuring JWT signing. Also used to calculate cookie expiration. |
| `NODE_ENV`       | No       | `production` selects info-level logging without pino-pretty; other values use debug-level, pretty-printed logging.     |

Only `MONGODB_URI` is validated by the Joi startup schema; the other required values are read with `getOrThrow`.

### Database setup

Ensure MongoDB is running before starting the application. No seed command or standalone migration script is provided.

At startup, `DbMigrationService` uses `migrate-mongo` to apply compiled `.js` migrations from `dist/migrations` and records them in the `changelog` collection. The existing migration creates a unique index on `users.email`. Existing duplicate email addresses must be resolved before that migration can succeed.

Mongoose selects its database from `MONGODB_URI`, while migrations explicitly use `DB_NAME`; these must match. The Nest build compiles the TypeScript migration along with the application.

### Run locally

```bash
pnpm run start:dev
```

With the example configuration, the HTTP API is available at `http://localhost:3000` and GraphQL at `http://localhost:3000/graphql`. `GET /` returns `Hello World!`; it is a basic response, not a database health check.

### Build and run

```bash
pnpm run build
pnpm run start:prod
```

Set `NODE_ENV=production` in the runtime environment when using production logging. `start:prod` runs the existing `dist/main` build; it does not build the application or set `NODE_ENV` itself. Keep the compiled migrations available and provide all required environment variables.

## Running with Docker

### Prerequisites and configuration

Install Docker Engine with the Compose plugin, or Docker Desktop running Linux
containers. Start the Docker engine before running the commands below. No local
Node.js, pnpm, or MongoDB installation is required for Compose.

Create your local configuration (keep an existing `.env` if you already have one):

```bash
cp .env.example .env
```

In PowerShell, use `Copy-Item .env.example .env`. Generate a JWT secret with:

```bash
docker run --rm node:24.16.0-bookworm-slim node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the output after `JWT_SECRET=` in `.env`. This is the only required value
you must supply for Compose; it rejects an unset or empty secret. Do not commit
`.env`. Environment files and credentials are excluded from the image.

Compose defaults `DB_NAME` to `babblr`, `JWT_EXPIRATION` to `3600` seconds, and
the host `PORT` to `3000`. It sets `NODE_ENV=production` and the container port
to `3000`, and constructs `MONGODB_URI` using the `mongo` service and `DB_NAME`
so the application and migrations use the same database. Compose deliberately
overrides `.env` values for `MONGODB_URI` and `NODE_ENV`; the URI in the example
is for running Node.js locally or configuring a standalone container.

### Start and stop the complete environment

From the repository root:

```bash
docker compose up --build
```

For background operation, use `docker compose up --build -d`. The API is at
`http://localhost:3000`, GraphQL and WebSocket subscriptions at `/graphql`.
Change `PORT` in `.env` if the host port is occupied; the container still listens
on `3000`. The API is published only on the local machine's loopback interface.

MongoDB is the only external service. Compose provides MongoDB 8.0, waits for
its ping health check, and then starts the app. Compiled migrations in
`dist/migrations` run automatically before the app starts listening, including
the unique email index. No separate migration or seed command is needed; create
the first user with the registration mutation documented below.

```bash
docker compose ps
docker compose logs -f app
curl http://localhost:3000/
```

The last command returns `Hello World!`. The image health check probes this
endpoint; it checks HTTP responsiveness, not ongoing database connectivity.

```bash
docker compose down
```

MongoDB data persists in the named `mongo-data` volume across container rebuilds
and `down`/`up`. To intentionally delete **all development database data**:

```bash
docker compose down --volumes
```

Compose's MongoDB has no authentication and no published host port. This setup
is for local development. Production deployments should supply an authenticated
MongoDB connection and appropriate network access controls.

### Image architecture and standalone use

The multi-stage Dockerfile uses the official Node.js 24.16.0 Debian slim image
and pnpm 12.6.0 (matching the tools used to validate this repository). Node 24
satisfies the locked dependencies' engine requirements. There is one application,
not a monorepo; `pnpm-workspace.yaml` supplies dependency build permissions.
Dependency layers use the frozen lockfile and a BuildKit pnpm cache. Native
build tools for bcrypt are confined to build stages. The final image contains
production dependencies and compiled application/migrations, runs as the `node`
user, and starts `node dist/main.js`, equivalent to `pnpm run start:prod`.

Build the image independently:

```bash
docker build -t babblr-backend .
```

For standalone use, provision MongoDB first and set `.env`'s `MONGODB_URI` to an
address reachable **from the container**. `127.0.0.1` inside a container refers
to that container, not the host. For a host database on Docker Desktop, use
`mongodb://host.docker.internal:27017/babblr`; on Linux Engine also pass
`--add-host=host.docker.internal:host-gateway` and ensure MongoDB accepts connections
from the Docker network. An external authenticated MongoDB URI also works.
Set `DB_NAME` to the database in the URI, supply `JWT_SECRET` and
`JWT_EXPIRATION`, and use `PORT=3000` for the command below:

```bash
docker run --detach --init --name babblr-backend --env-file .env -e NODE_ENV=production -p 127.0.0.1:3000:3000 babblr-backend
docker logs -f babblr-backend
docker stop babblr-backend
docker rm babblr-backend
```

### Rebuilds and configuration changes

After source, dependency, or build configuration changes, run
`docker compose up --build -d`. Update and commit `pnpm-lock.yaml` whenever
dependencies change; frozen installs reject an inconsistent lockfile. After
editing `.env`, run `docker compose up -d --force-recreate app` to apply the new
environment. A plain restart does not reload container environment variables.
There are no source bind mounts or file watchers in this production image.
For a fresh base image, run `docker compose build --pull` followed by
`docker compose up -d`.

## API

### Authentication

1. Register through the public GraphQL `createUser` mutation.
2. Send `POST /auth/login` with a JSON body containing `email` and `password`.
3. Preserve and send the returned `Authentication` cookie on protected requests.
4. Send `POST /auth/logout` to expire the cookie.

Login sets an HTTP-only cookie; it does not return a token response body. HTTP JWT authentication reads this cookie, not an Authorization bearer header. Cross-origin browser access requires additional CORS configuration; none is enabled in `main.ts`.

### REST endpoints

| Method | Path                      | Authentication     | Behavior                                         |
| ------ | ------------------------- | ------------------ | ------------------------------------------------ |
| GET    | `/`                       | Public             | Returns `Hello World!`.                          |
| POST   | `/auth/login`             | Email and password | Sets the `Authentication` cookie.                |
| POST   | `/auth/logout`            | Public             | Expires the authentication cookie.               |
| GET    | `/chats/count`            | JWT cookie         | Returns the total number of chats.               |
| GET    | `/messages/count/:chatId` | JWT cookie         | Returns `{ "messages": n }` when messages exist. |

The message-count aggregation returns no result for an empty or nonexistent chat; it does not normalize that case to `{ "messages": 0 }`.

### GraphQL

Send GraphQL requests to `/graphql`. All queries and mutations except `createUser` require authentication.

| Operation                       | Arguments                                      | Purpose                                                 |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `createUser` (mutation)         | `createUserInput: CreateUserInput!`            | Register with `email`, `username`, and `password`.      |
| `users` (query)                 | None                                           | List users.                                             |
| `user` (query)                  | `_id: String!`                                 | Retrieve a user.                                        |
| `me` (query)                    | None                                           | Return the authenticated JWT payload as a User.         |
| `updateUser` (mutation)         | `updateUserInput: UpdateUserInput!`            | Update the current user's email, username, or password. |
| `removeUser` (mutation)         | None                                           | Delete the current user.                                |
| `createChat` (mutation)         | `createChatInput: CreateChatInput!`            | Create a chat with a nonempty `name`.                   |
| `chats` (query)                 | `skip: Int!`, `limit: Int!`                    | List chats with latest-message summaries.               |
| `chat` (query)                  | `_id: String!`                                 | Retrieve a chat.                                        |
| `createMessage` (mutation)      | `createMessageInput: CreateMessageInput!`      | Send nonempty `content` to a `chatId`.                  |
| `messages` (query)              | `chatId: String!`, `skip: Int!`, `limit: Int!` | Retrieve messages, newest first.                        |
| `messageCreated` (subscription) | `chatIds: [String!]!`                          | Receive new messages for the selected chats.            |

IDs come from MongoDB ObjectIds. Supply `skip` and `limit` explicitly; they have no GraphQL defaults. Passwords are not exposed in the User GraphQL type. The `me` resolver returns only JWT claims (`_id` and `email`), so requesting its non-null `username` field currently produces a GraphQL error.

Example registration:

```graphql
mutation {
  createUser(
    createUserInput: {
      email: "developer@example.com"
      username: "developer"
      password: "Example-only-Password123!"
    }
  ) {
    _id
    email
    username
  }
}
```

After login, query chats:

```graphql
query {
  chats(skip: 0, limit: 25) {
    _id
    name
    latestMessage {
      content
      createdAt
      user {
        _id
        username
      }
    }
  }
}
```

Subscriptions use the `graphql-ws` protocol at `/graphql` (`ws://localhost:3000/graphql` for the example configuration). The connection must carry the `Authentication` cookie in its handshake headers; authentication is not read from `connectionParams`.

```graphql
subscription {
  messageCreated(chatIds: ["REPLACE_WITH_CHAT_ID"]) {
    _id
    chatId
    content
    createdAt
    user {
      _id
      username
    }
  }
}
```

The subscription filter excludes the sender's own messages. Use the `createMessage` mutation response to display a message immediately for its sender.

## Testing

```bash
pnpm run test --runInBand
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e
```

Unit tests live beside source files and use Jest with ts-jest. They include a root-controller assertion, password-hashing checks, and module-construction tests. Coverage output is written to `coverage/`.

The test suite is currently incomplete: several controller, resolver, and service tests do not provide their required dependencies or guard configuration and fail during module construction. The user-service test inputs also lag behind the current DTO definitions.

The E2E suite contains one Supertest smoke test for `GET /`. It attempts to replace database access, but only mocks the user model, leaving chat-model dependencies unresolved. Its setup supplies test database settings but does not supply `JWT_SECRET` or `JWT_EXPIRATION`; those still require test configuration. It is not a complete authentication, chat, or subscription integration suite.

## Useful scripts

| Command                | Purpose                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `pnpm run start`       | Compile and start through Nest CLI.                                                     |
| `pnpm run start:dev`   | Start with file watching.                                                               |
| `pnpm run start:debug` | Start with debugging and file watching.                                                 |
| `pnpm run build`       | Compile the application and migrations to `dist/`.                                      |
| `pnpm run start:prod`  | Run the compiled application.                                                           |
| `pnpm run lint`        | Run type-aware Oxlint over `src/` and `test/`.                                          |
| `pnpm run format`      | Rewrite TypeScript source and tests with Prettier.                                      |
| `pnpm run test`        | Run unit tests.                                                                         |
| `pnpm run test:watch`  | Run unit tests in watch mode.                                                           |
| `pnpm run test:cov`    | Run unit tests with coverage.                                                           |
| `pnpm run test:debug`  | Run Jest with the Node debugger.                                                        |
| `pnpm run test:e2e`    | Run the separate E2E configuration.                                                     |
| `pnpm run deploy`      | Invoke `nest deploy`; deployment credentials and target configuration are not included. |

## Contributing

Create a branch, make a focused change, and update relevant tests and documentation. Run the build, lint, and applicable tests before opening a pull request. Describe the behavior changed and report any existing test failures separately from regressions. Keep credentials out of commits.

## License

`package.json` declares this project `UNLICENSED` and private. No license file granting open-source usage rights is included.
