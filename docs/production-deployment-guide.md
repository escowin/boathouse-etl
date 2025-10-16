# Production Deployment Guide

## Overview

This guide covers deploying the Boathouse ETL system to production with the complete database schema, including the enhanced athlete competitive status system and simplified USRA categories.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Production PostgreSQL database is running and accessible
- [ ] Database user has CREATE, DROP, and ALTER privileges
- [ ] Node.js and npm are installed on production server
- [ ] `.env` file is configured with production database credentials

### 2. Backup Strategy
- [ ] **CRITICAL**: Full database backup completed
- [ ] Backup tested and verified
- [ ] Rollback plan documented

### 3. Testing
- [ ] Migration tested on staging environment
- [ ] All ETL processes validated
- [ ] Application functionality verified

## Deployment Steps

### Step 1: Prepare Production Environment

```bash
# 1. Clone or update the repository
git clone <repository-url>
cd boathouse-etl

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with production database credentials
```

### Step 2: Verify Configuration

```bash
# Test database connection
npm run test:db-connection

# Check configuration
npm run check:config
```

### Step 3: Run Production Deployment

```bash
# Option 1: Use the deployment script (recommended)
npm run deploy:production

# Option 2: Run migration directly
npm run migrate:up
```

### Step 4: Verify Deployment

```bash
# Check migration status
npm run migrate:status

# Test models
npm run test:models

# Run ETL validation
npm run etl:validate
```

## What Gets Deployed

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
# Run full ETL to populate data
npm run etl:full

# Or run individual ETL processes
npm run etl:athletes
npm run etl:teams
npm run etl:boats
```

### 2. Verify Data Integrity
```bash
# Check ETL status
npm run etl:status

# Validate data
npm run etl:validate
```

### 3. Set Up Monitoring
- Monitor ETL job status
- Set up database performance monitoring
- Configure error alerting

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

Required `.env` configuration:

```env
# Database Configuration
DB_HOST=production-db-host
DB_PORT=5432
DB_NAME=boathouse_etl
DB_USER=db-user
DB_PASSWORD=db-password

# Google Sheets API (if using ETL)
GOOGLE_SHEETS_CREDENTIALS_PATH=./credentials/google-service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=spreadsheet-id

# Application Settings
NODE_ENV=production
```

## Troubleshooting

### Common Issues

#### Migration Fails
- Check database permissions
- Verify .env configuration
- Check for existing conflicting data

#### ETL Fails
- Verify Google Sheets API credentials
- Check network connectivity
- Review ETL job logs

#### Performance Issues
- Monitor database indexes
- Check query performance
- Review ETL job frequency

### Support Commands

```bash
# Debug database connection
npm run debug:connection

# Debug Google Sheets
npm run debug:sheets

# Check configuration
npm run check:config

# Test models
npm run test:models
```

## Security Considerations

1. **Database Access**: Use dedicated database user with minimal required privileges
2. **API Keys**: Store Google Sheets credentials securely
3. **Environment Variables**: Never commit .env files
4. **Network Security**: Use VPN or secure connections for database access
5. **Backup Security**: Encrypt database backups

## Maintenance

### Regular Tasks
- Monitor ETL job performance
- Review database growth
- Update dependencies regularly
- Backup database regularly

### Updates
- Test updates in staging first
- Use migration system for schema changes
- Maintain rollback procedures
- Document all changes

## Support

For issues or questions:
1. Check logs and error messages
2. Review this documentation
3. Test in staging environment
4. Contact development team

---

**Last Updated**: January 16, 2025
**Version**: 1.0.0
