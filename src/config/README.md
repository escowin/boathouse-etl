# Sequelize Configuration

This directory contains the Sequelize configuration for the Boathouse ETL backend process.

## Files

### `env.ts`
- Typed environment variable configuration
- Centralized environment variable management
- Type-safe access to all configuration values

### `database.ts`
- Main database configuration
- Sequelize instance creation
- Connection management utilities
- ETL-optimized settings (connection pooling, retry logic)

### `sequelize.ts`
- Sequelize CLI configuration for migrations
- Environment-specific configurations (development, test, production)
- Migration and seeding paths

## Usage

### Basic Database Connection
```typescript
import sequelize from '../config/database';

// Test connection
await sequelize.authenticate();
```

### Using Database Utilities
```typescript
import { DatabaseUtils } from '../utils/database';

// Initialize database
await DatabaseUtils.initialize();

// Execute transaction
await DatabaseUtils.executeTransaction(async (transaction) => {
  // Database operations here
});

// Bulk operations
await DatabaseUtils.bulkInsert(Model, records);
```

### Environment Variables
Create a `.env` file in the project root with:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boathouse_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SSL=false

# Application
NODE_ENV=development
```

## Testing

Test the database connection:
```bash
npm run test:db-connection
```

## Migration Commands

```bash
# Create a new migration
npx sequelize-cli migration:generate --name create-athletes-table

# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down
```

## Configuration Features

### ETL Optimizations
- Connection pooling for high-volume operations
- Retry logic for network issues
- Bulk operation utilities
- Transaction management
- Health check utilities

### Multi-Environment Support
- Development: Verbose logging, benchmarking
- Test: Isolated test database
- Production: SSL support, optimized pooling

### Type Safety
- Fully typed environment variables
- TypeScript interfaces for all configurations
- Compile-time validation of database settings
