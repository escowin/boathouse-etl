/**
 * Shared Module Proxy
 * 
 * This module provides a proxy to shared resources from crewhub,
 * using paths defined in config.json for flexible configuration.
 */

import config from '../../config.json';
import path from 'path';

// Validate that config.json exists and has required structure
if (!config.shared || !config.shared.models || !config.shared.config) {
  throw new Error('Invalid config.json: Missing required shared configuration');
}

// Module proxy that resolves to shared resources
const sharedModules = {
  /**
   * Get shared models from crewhub
   */
  models: () => {
    if (!config.shared.models.enabled) {
      throw new Error('Shared models are disabled in config.json');
    }
    const modelsPath = path.resolve(__dirname, '..', '..', config.shared.models.path);
    return require(modelsPath);
  },

  /**
   * Get shared config from crewhub
   */
  config: () => {
    const configModules: any = {};
    
    // Load env config
    if (config.shared.config.env?.enabled) {
      const envPath = path.resolve(__dirname, '..', '..', config.shared.config.env.path);
      configModules.env = require(envPath);
    } else {
      // Fallback to process.env when shared env config is disabled
      configModules.env = process.env;
    }
    
    // Load database config
    if (config.shared.config.database?.enabled) {
      const dbPath = path.resolve(__dirname, '..', '..', config.shared.config.database.path);
      configModules.database = require(dbPath);
    }
    
    return configModules;
  },

  /**
   * Get shared auth services from crewhub
   */
  auth: () => {
    if (!config.shared.auth?.enabled) {
      throw new Error('Shared auth services are disabled in config.json');
    }
    const authPath = path.resolve(__dirname, '..', '..', config.shared.auth.path);
    return require(authPath);
  },

  /**
   * Get shared services from crewhub
   */
  services: () => {
    if (!config.shared.services?.enabled) {
      throw new Error('Shared services are disabled in config.json');
    }
    const servicesPath = path.resolve(__dirname, '..', '..', config.shared.services.path);
    return require(servicesPath);
  }
};

// Convenience exports for commonly used items
export const getModels = sharedModules.models;
export const getConfig = sharedModules.config;
export const getAuth = sharedModules.auth;
export const getServices = sharedModules.services;

// Default export for the full proxy
export default sharedModules;
