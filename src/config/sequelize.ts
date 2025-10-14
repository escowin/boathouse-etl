import { Sequelize } from 'sequelize';
import { config } from './database';
import { env } from './env';

// Sequelize CLI configuration for migrations
export const sequelizeConfig = {
  development: {
    ...config,
    // Additional development-specific options
    logging: console.log,
    benchmark: true
  },
  test: {
    ...config,
    database: `${config.database}_test`,
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    ...config,
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    // Production-specific options
    dialectOptions: {
      ssl: env.DB_SSL ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

export default sequelizeConfig;
