# KAHA Restaurant E-Commerce Platform

A comprehensive restaurant e-commerce platform built with NestJS, TypeORM, and PostgreSQL.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
cp .postgres_env.example .postgres_env

# Start PostgreSQL with Docker
docker-compose up -d

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 📚 Documentation

All project documentation is organized in the `/docs` folder:

- **[Architecture](./docs/architecture/)** - System design and architecture
- **[Database](./docs/database/)** - Database schemas and relationships
- **[API](./docs/api/)** - API specifications and endpoints
- **[Testing](./docs/testing/)** - Testing guides and Postman collections
- **[Production](./docs/production/)** - Production setup and deployment
- **[Fixes](./docs/fixes/)** - Bug fixes and patches

👉 **Start here**: [Documentation Index](./docs/README.md)

## 🏗️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger/OpenAPI

## 📦 Project Structure

```
restaurant-ecommerce/
├── src/
│   ├── modules/          # Feature modules
│   ├── entities/         # TypeORM entities
│   ├── repositories/     # Data access layer
│   ├── common/           # Shared utilities
│   ├── configuration/    # App configuration
│   └── database/         # Database setup
├── docs/                 # All documentation
├── postman/              # Postman collections
├── migrations/           # Database migrations
└── test/                 # E2E tests
```

## 🔧 Available Scripts

```bash
npm run start:dev        # Start development server
npm run build            # Build for production
npm run start:prod       # Start production server
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run migration:run    # Run database migrations
npm run migration:revert # Revert last migration
```

## 🧪 Testing

See the [Complete Testing Guide](./docs/testing/COMPLETE_TESTING_GUIDE.md) for detailed testing instructions.

Postman collections are available in the `/postman` folder.

## 🌐 API Documentation

Once the server is running, access the Swagger documentation at:
- Development: `http://localhost:3000/api`
- Production: Check [Production Setup](./docs/production/)

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRATION` - JWT expiration time

## 📝 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

## 📞 Support

For issues and questions, please refer to the documentation in the `/docs` folder or contact the development team.
