import sequelize from '../config/database';
import { testConnection, closeConnection } from '../config/database';
import { QueryTypes } from 'sequelize';

/**
 * Database utility functions for ETL processes
 */
export class DatabaseUtils {
  /**
   * Initialize database connection and run health checks
   */
  static async initialize(): Promise<boolean> {
    try {
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Failed to establish database connection');
      }
      
      // Run additional health checks
      await this.runHealthChecks();
      
      console.log('✅ Database initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return false;
    }
  }

  /**
   * Run database health checks
   */
  static async runHealthChecks(): Promise<void> {
    try {
      // Test basic query
      await sequelize.query('SELECT 1 as health_check');
      
      // Check if we can access system tables
      await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 1
      `);
      
      console.log('✅ Database health checks passed');
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      throw error;
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  static async executeTransaction<T>(
    callback: (transaction: any) => Promise<T>
  ): Promise<T> {
    const transaction = await sequelize.transaction();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Bulk insert with error handling
   */
  static async bulkInsert<T>(
    model: any,
    records: T[],
    options: any = {}
  ): Promise<T[]> {
    try {
      const result = await model.bulkCreate(records, {
        validate: true,
        individualHooks: false,
        ...options
      });
      
      console.log(`✅ Bulk inserted ${result.length} records into ${model.name}`);
      return result;
    } catch (error) {
      console.error(`❌ Bulk insert failed for ${model.name}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update with error handling
   */
  static async bulkUpdate<T>(
    model: any,
    records: T[],
    updateFields: string[],
    options: any = {}
  ): Promise<number> {
    try {
      let updatedCount = 0;
      
      for (const record of records) {
        const result = await model.update(record, {
          where: { id: (record as any).id },
          fields: updateFields,
          ...options
        });
        updatedCount += result[0];
      }
      
      console.log(`✅ Bulk updated ${updatedCount} records in ${model.name}`);
      return updatedCount;
    } catch (error) {
      console.error(`❌ Bulk update failed for ${model.name}:`, error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<any> {
    try {
      const stats = await sequelize.query(`
        SELECT 
          schemaname,
          relname as tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `, { type: QueryTypes.SELECT });
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get database stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup and close connections
   */
  static async cleanup(): Promise<void> {
    try {
      await closeConnection();
      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
      throw error;
    }
  }
}

export default DatabaseUtils;
