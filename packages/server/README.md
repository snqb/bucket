# Bucket Server

Real-time synchronization server with user management and REST API capabilities.

## Features

- 🔄 **Real-time Sync**: WebSocket-based real-time synchronization using TinyBase
- 👥 **User Management**: User registration, authentication, and session management
- 🛡️ **Security**: JWT authentication, rate limiting, CORS protection
- 📊 **API**: RESTful API endpoints for server operations
- 🐳 **Docker**: Production-ready Docker configuration
- 📝 **Logging**: Structured logging with Winston
- 💾 **Database**: SQLite with migrations and user isolation

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite3 with TinyBase synchronization
- **Language**: TypeScript
- **Real-time**: WebSocket (TinyBase synchronizers)
- **Authentication**: JWT + bcryptjs
- **Deployment**: Docker, Railway ready

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=development
PORT=8040
HOST=localhost
DB_PATH=./data/storage.db
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
LOG_FILE=./logs/server.log
```

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Info
- `GET /api` - API information and endpoints

### WebSocket Connection
- `ws://localhost:8040/<userId>` - Real-time sync connection

## Docker

### Development

```bash
docker-compose up
```

### Production

```bash
docker build -t bucket-server .
docker run -p 8040:8040 bucket-server
```

## Railway Deployment

The server is configured for Railway deployment:

1. Connect your repository to Railway
2. Railway will automatically build and deploy
3. Configure environment variables in Railway dashboard

## Architecture

### Directory Structure

```
src/
├── server.ts           # Main server file
├── services/           # Business logic
│   ├── config.ts      # Configuration management
│   └── logger.ts      # Logging service
├── db/                # Database layer
│   └── database.ts    # SQLite database service
├── routes/            # API routes
├── middleware/        # Express middleware
├── types/             # TypeScript definitions
└── tests/             # Test files
```

### Data Model

- **Users**: User accounts with email/password authentication
- **Sessions**: JWT-based session management
- **TinyBase**: Per-user data isolation with table prefixes

## Monitoring

- Health checks at `/health`
- Structured logging with configurable levels
- Memory usage and uptime tracking
- Database connection status

## Security

- Helmet.js for security headers
- CORS for cross-origin requests
- Rate limiting for API protection
- JWT authentication with expiration
- Password hashing with bcryptjs
- User data isolation in database

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Write tests for new functionality
4. Update documentation

## License

ISC