import { Sequelize } from 'sequelize';
import { getConfig } from '../shared';
const config = getConfig();
const { env } = config;

// ETL-optimized database configuration interface
interface ETLDatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'postgres';
  logging: boolean | ((sql: string) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  define: {
    timestamps: boolean;
    underscored: boolean;
    freezeTableName: boolean;
  };
  // ETL-specific options
  benchmark: boolean;
  retry: {
    match: RegExp[];
    max: number;
  };
}

// ETL-optimized database configuration
const etlConfig: ETLDatabaseConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  // ETL-optimized connection pool (smaller, longer timeouts for bulk operations)
  pool: {
    max: 5,        // Lower max connections for ETL
    min: 0,        // No minimum connections needed
    acquire: 60000, // Longer timeout for bulk operations
    idle: 10000    // Standard idle timeout
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  // ETL-specific optimizations
  benchmark: env.NODE_ENV === 'development',
  retry: {
    match: [
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
      /ECONNRESET/,
      /ECONNREFUSED/,
      /ESOCKETTIMEDOUT/,
      /EPIPE/,
      /EAI_AGAIN/,
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/
    ],
    max: 3
  }
};

// Create ETL-optimized Sequelize instance
const sequelize = new Sequelize(
  etlConfig.database,
  etlConfig.username,
  etlConfig.password,
  {
    host: etlConfig.host,
    port: etlConfig.port,
    dialect: etlConfig.dialect,
    logging: etlConfig.logging,
    pool: etlConfig.pool,
    define: etlConfig.define,
    benchmark: etlConfig.benchmark,
    retry: etlConfig.retry,
    // ETL-specific optimizations
    hooks: {
      beforeBulkCreate: (instances: any, _options: any) => {
        console.log(`🔄 ETL: Bulk creating ${instances.length} records`);
      },
      afterBulkCreate: (instances: any, _options: any) => {
        console.log(`✅ ETL: Successfully created ${instances.length} records`);
      },
      beforeBulkUpdate: (_options: any) => {
        console.log(`🔄 ETL: Bulk updating records`);
      },
      afterBulkUpdate: (_options: any) => {
        console.log(`✅ ETL: Successfully updated records`);
      }
    }
  }
);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✅ Database connection closed successfully.');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

export default sequelize;
export { etlConfig as config };
