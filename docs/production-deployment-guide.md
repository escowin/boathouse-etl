# Production Deployment Guide

## Overview

This guide covers deploying the **Boathouse Ecosystem** to production, including both **CrewHub** (API server) and **boathouse-etl** (ETL service) with the complete database schema, authentication system, and data processing capabilities.

## Architecture Overview

The production deployment consists of two main services:

- **CrewHub**: Central API server and authentication hub
- **boathouse-etl**: ETL service for data processing and synchronization

Both services share the same PostgreSQL database (`boathouse_trc`) and use a shared resource architecture via `config.json`.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production PostgreSQL database is running and accessible
- [ ] Database user has CREATE, DROP, and ALTER privileges
- [ ] Node.js and npm are installed on production server
- [ ] `.env` files are configured for both services
- [ ] Google Service Account credentials are available (for ETL)

### 2. Backup Strategy
- [ ] **CRITICAL**: Full database backup completed
- [ ] Backup tested and verified
- [ ] Rollback plan documented

### 3. Testing
- [ ] Both services tested on staging environment
- [ ] ETL processes validated
- [ ] API endpoints verified
- [ ] Authentication system tested

## Deployment Steps

### Step 1: Prepare Production Environment

```bash
# 1. Clone both repositories
git clone <crewhub-repository-url>
git clone <boathouse-etl-repository-url>

# 2. Install dependencies for both services
cd crewhub
npm install

cd ../boathouse-etl
npm install

# 3. Configure environment files
cp .env.example .env
# Edit .env with production database credentials for both services
```

### Step 2: Deploy CrewHub (API Server)

```bash
cd crewhub

# Build the application
npm run build

# Run database migrations
npm run migrate:up

# Start the API server
npm run start
```

### Step 3: Deploy boathouse-etl (ETL Service)

```bash
cd ../boathouse-etl

# Build the application
npm run build

# Verify shared resource configuration
npm run validate:config

# Test ETL processes
npm run etl:validate
```

### Step 4: Verify Deployment

```bash
# Check CrewHub API health
curl http://localhost:3001/health

# Check ETL service status
cd boathouse-etl
npm run etl:status

# Test authentication
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"pin": "123456"}'
```

## What Gets Deployed

### CrewHub (API Server)
- **Authentication Service**: PIN-based login system with JWT tokens
- **API Gateway**: RESTful endpoints for all data operations
- **Database Models**: Sequelize models for data access
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **CORS Protection**: Configurable origin restrictions

### boathouse-etl (ETL Service)
- **Google Sheets Integration**: Automated data extraction
- **Data Transformation**: Clean, validate, and standardize data
- **Database Loading**: Populate PostgreSQL with structured data
- **Scheduled Processing**: Automated ETL jobs
- **Error Handling**: Comprehensive retry logic and reporting

### Database Schema (22 Tables)

#### Core Boathouse Management (15 tables)
- `usra_categories` - Age categories with simplified names
- `athletes` - Enhanced with competitive status system
- `teams` - Team management
- `team_memberships` - Athlete-team relationships
- `boats` - Boat inventory
- `practice_sessions` - Practice scheduling
- `attendance` - Attendance tracking
- `lineups` - Practice lineups
- `seat_assignments` - Seat assignments
- `regattas` - Regatta management
- `regatta_registrations` - Registration tracking
- `races` - Race results
- `erg_tests` - Erg test records
- `etl_jobs` - ETL job tracking
- `mailing_lists` - Email list management

#### Rowcalibur Competitive System (7 tables)
- `gauntlets` - Gauntlet tournaments
- `gauntlet_matches` - Match records
- `gauntlet_lineups` - Gauntlet lineups
- `gauntlet_seat_assignments` - Seat assignments
- `ladders` - Ranking ladders
- `ladder_positions` - Athlete positions
- `ladder_progressions` - Position changes

### Enhanced Features

#### Athlete Competitive Status System
- `competitive_status`: 'active', 'inactive', 'retired', 'banned'
- `retirement_reason`: 'deceased', 'transferred', 'graduated', 'personal', 'unknown'
- `retirement_date`: Date of retirement
- `ban_reason`: 'misconduct', 'safety_violation', 'harassment', 'other'
- `ban_date`: Date of ban
- `ban_notes`: Additional ban details

#### Simplified USRA Categories
- U15, U17, U19, U23, AA, A, B, C, D, E, F, G, H, I, J, K
- Pre-seeded in database

#### Performance Optimizations
- Comprehensive indexing strategy
- CASCADE delete system for data integrity
- Optimized foreign key relationships

## Post-Deployment Tasks

### 1. Run Initial ETL
```bash
cd boathouse-etl

# Run full ETL to populate data
npm run etl:full

# Or run individual ETL processes
npm run etl:athletes
npm run etl:teams
npm run etl:boats
npm run etl:practice-sessions
npm run etl:attendance
npm run etl:lineup
```

### 2. Verify Data Integrity
```bash
# Check ETL status
npm run etl:status

# Validate data
npm run etl:validate

# Test API endpoints
cd ../crewhub
npm run test:api
```

### 3. Set Up Monitoring
- Monitor ETL job status
- Monitor API server health
- Set up database performance monitoring
- Configure error alerting for both services

## Rollback Procedures

### If Migration Fails
```bash
# Check migration status
npm run migrate:status

# Rollback if needed
npm run migrate:down
```

### If Data Issues Occur
1. Restore from backup
2. Investigate root cause
3. Fix issues in staging
4. Re-deploy with fixes

## Environment Variables

### CrewHub Configuration

Required `.env` configuration for CrewHub:

```env
# Database Configuration
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=boathouse_trc
DB_USER=db-user
DB_PASSWORD=db-password
DB_SSL=true

# Server Configuration
PORT=3001
NODE_ENV=production

# Authentication
JWT_SECRET=your-jwt-secret-key
DEFAULT_PIN=123456

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
```

### boathouse-etl Configuration

Required `.env` configuration for boathouse-etl:

```env
# Database Configuration (same as CrewHub)
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=boathouse_trc
DB_USER=db-user
DB_PASSWORD=db-password
DB_SSL=true

# Google Sheets API
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/google-service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# ETL Configuration
ETL_BATCH_SIZE=100
ETL_RETRY_ATTEMPTS=3
ETL_RETRY_DELAY_MS=5000
ETL_LOG_LEVEL=info

# Application Settings
NODE_ENV=production
LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

#### CrewHub API Issues
- **Authentication fails**: Check JWT_SECRET and PIN configuration
- **CORS errors**: Verify CORS_ORIGIN configuration
- **Database connection**: Check database credentials and connectivity
- **Rate limiting**: Monitor request patterns and adjust limits

#### ETL Service Issues
- **Google Sheets API fails**: Verify service account credentials
- **Shared resource errors**: Check config.json paths and CrewHub availability
- **Data validation fails**: Review ETL logs and data quality
- **Performance issues**: Monitor batch sizes and retry settings

#### Database Issues
- **Migration fails**: Check database permissions and existing data
- **Connection pool exhausted**: Monitor connection usage
- **Performance degradation**: Review indexes and query patterns

### Support Commands

#### CrewHub Debugging
```bash
cd crewhub

# Check API health
curl http://localhost:3001/health

# Test authentication
npm run test:auth

# Debug database connection
npm run debug:db
```

#### ETL Service Debugging
```bash
cd boathouse-etl

# Debug shared resource configuration
npm run validate:config

# Debug Google Sheets connection
npm run debug:sheets

# Test ETL processes
npm run etl:test
```

## Security Considerations

1. **Database Access**: Use dedicated database user with minimal required privileges
2. **API Keys**: Store Google Sheets credentials securely
3. **JWT Secrets**: Use strong, unique JWT secrets for authentication
4. **Environment Variables**: Never commit .env files
5. **Network Security**: Use VPN or secure connections for database access
6. **CORS Configuration**: Restrict CORS origins to known frontend domains
7. **Rate Limiting**: Configure appropriate rate limits for API endpoints
8. **Backup Security**: Encrypt database backups

## Maintenance

### Regular Tasks
- Monitor ETL job performance and API server health
- Review database growth and performance metrics
- Update dependencies regularly for both services
- Backup database regularly
- Monitor authentication logs for security issues

### Updates
- Test updates in staging first for both services
- Use migration system for schema changes
- Maintain rollback procedures for both services
- Document all changes and coordinate between services
- Ensure shared resource compatibility during updates

## Service Dependencies

### CrewHub Dependencies
- PostgreSQL database (`boathouse_trc`)
- Node.js runtime environment
- Network access for frontend applications

### boathouse-etl Dependencies
- PostgreSQL database (`boathouse_trc`)
- CrewHub for shared resources (models, config)
- Google Sheets API access
- Node.js runtime environment

### Shared Resources
- Database models are shared via `config.json`
- Configuration files are shared via `config.json`
- Both services must be compatible versions

## Support

For issues or questions:
1. Check logs and error messages for both services
2. Review this documentation and CrewHub documentation
3. Test in staging environment
4. Contact Edwin Escobar at edwin@escowinart.com

---

**Last Updated**: January 16, 2025  
**Version**: 2.0.0  
**Architecture**: CrewHub + boathouse-etl microservices
