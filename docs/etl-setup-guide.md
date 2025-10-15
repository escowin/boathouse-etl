# Rowcalibur ETL Project Development Guide

## Overview

This guide provides a step-by-step approach to developing a separate ETL (Extract, Transform, Load) project for migrating data from my boathouse's Google Sheet to PostgreSQL. The ETL project will serve both Rowcalibur and Crewssignment applications, providing a unified data foundation for Phase 4 PostgreSQL integration.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ database
- Google Service Account credentials (already configured in Rowcalibur)
- Access to the shared Google Sheet used by both applications

## Project Structure

```
rowcalibur-etl/
├── src/
│   ├── extractors/          # Data extraction from Google Sheets
│   ├── transformers/        # Data transformation and validation
│   ├── loaders/            # PostgreSQL data loading
│   ├── services/           # Core ETL services
│   ├── models/             # TypeScript interfaces
│   ├── database/           # Schema and migrations
│   └── utils/              # Helper utilities
├── scripts/                # CLI scripts
├── tests/                  # Unit and integration tests
├── config/                 # Configuration files
└── docs/                   # Documentation
```

## Step 1: Project Setup

### 1.1 Initialize Project
- Create new directory: `boathouse-etl`
- Run `npm init -y`
- Install core dependencies: TypeScript, Google APIs, PostgreSQL client, Winston logging
- Install dev dependencies: Jest, ESLint, Prettier

### 1.2 Configuration Files
- Create `tsconfig.json` with strict TypeScript settings
- Create `.env.example` with database and Google Sheets configuration
- Set up `package.json` scripts for build, dev, test, migrate, validate

## Step 2: Database Schema Design

### 2.1 Core Tables
- **athletes**: Store athlete profiles with all attributes from Google Sheets
- **boats**: Store boat inventory with weight constraints
- **practice_sessions**: Store practice session dates and times
- **attendance**: Link athletes to practice sessions with status
- **lineups**: Store boat lineups for specific sessions
- **lineup_assignments**: Link athletes to lineups with seat positions
- **usra_categories**: Store USRA age categories
- **etl_jobs**: Track ETL job execution and status

### 2.2 Key Features
- UUID primary keys for all tables
- ETL metadata fields (source, last_sync timestamps)
- Proper foreign key relationships
- Performance indexes on frequently queried columns
- Check constraints for data validation

## Step 3: Data Models and Interfaces

### 3.1 TypeScript Models
- Create interfaces for Athlete, Boat, PracticeSession, Attendance, Lineup
- Include both raw data interfaces (from Google Sheets) and transformed interfaces (for PostgreSQL)
- Add ETL metadata fields to all models

### 3.2 Data Mapping
- Map Google Sheets column names to database field names
- Handle data type conversions (strings to numbers, dates, booleans)
- Define validation rules for each data type

## Step 4: Google Sheets Extractor

### 4.1 Base Extractor
- Create abstract base class for all extractors
- Implement common functionality (logging, error handling)
- Define standard extract/validate interface

### 4.2 Google Sheets Extractor
- Reuse existing GoogleSheetsService from Rowcalibur
- Extract athletes from 'Rowers' sheet
- Extract boats from 'Boats' sheet
- Extract attendance from 'Attendance' sheet
- Extract lineups from 'Line Up' sheet (based on Crewssignment analysis)
- Extract USRA categories from appropriate sheet

### 4.3 Data Processing
- Handle special values ('No', 'Yes', empty cells)
- Process newline-separated athlete names in lineup assignments
- Parse dates and times from attendance data
- Filter out header rows and invalid data

## Step 5: Data Transformers

### 5.1 Base Transformer
- Create abstract base class for all transformers
- Implement common validation and error handling
- Define standard transform/validate interface

### 5.2 Individual Transformers
- **AthleteTransformer**: Clean names, map types, parse weights, validate emails
- **BoatTransformer**: Parse weight constraints, validate boat types
- **AttendanceTransformer**: Process session dates, map attendance status
- **LineupTransformer**: Parse athlete assignments, handle coxswain identification

### 5.3 Data Validation
- Validate required fields
- Check data ranges (weights, ages, dates)
- Validate email formats and phone numbers
- Ensure referential integrity

## Step 6: PostgreSQL Loader

### 6.1 Base Loader
- Create abstract base class for all loaders
- Implement common database operations
- Handle connection pooling and transactions

### 6.2 PostgreSQL Loader
- Implement upsert operations for all data types
- Use ON CONFLICT for handling duplicates
- Batch operations for performance
- Track loading statistics and errors

### 6.3 Data Loading Strategy
- Load in dependency order (athletes → boats → sessions → attendance → lineups)
- Use transactions for data consistency
- Implement retry logic for failed operations
- Log detailed progress and error information

## Step 7: ETL Service and Orchestration

### 7.1 ETL Service
- Coordinate extraction, transformation, and loading
- Implement full ETL and incremental ETL modes
- Track job execution and status
- Handle errors and rollback scenarios

### 7.2 Job Management
- Create ETL job records in database
- Track start/end times, record counts, error messages
- Implement job status monitoring
- Support job cancellation and retry

### 7.3 Scheduling Options
- Full ETL: Complete data refresh (weekly)
- Incremental ETL: Process only recent changes (daily)
- On-demand ETL: Manual trigger for specific dates

## Step 8: Database Services

### 8.1 Database Service
- Implement connection pooling
- Handle query execution with logging
- Support transactions
- Implement connection health checks

### 8.2 Logging Service
- Use Winston for structured logging
- Log to files and console
- Include request IDs and timestamps
- Support different log levels

## Step 9: CLI Scripts and Automation

### 9.1 Main Scripts
- **run-etl.ts**: Main ETL execution script with command-line arguments
- **migrate-data.ts**: Database schema migration script
- **validate-data.ts**: Data integrity validation script

### 9.2 Command Line Interface
- Support full/incremental ETL modes
- Accept date parameters for targeted processing
- Provide verbose logging options
- Return appropriate exit codes

## Step 10: Integration with Rowcalibur

### 10.1 DataService Updates
- Add 'etl_postgresql' data source option
- Implement PostgreSQL data fetching methods
- Maintain backward compatibility with existing sources
- Add configuration for database connection

### 10.2 Environment Configuration
- Update .env files to support PostgreSQL
- Add database connection parameters
- Configure ETL vs direct Google Sheets modes
- Set up connection pooling parameters

## Step 11: Testing and Validation

### 11.1 Unit Tests
- Test individual transformers with sample data
- Validate data transformation logic
- Test error handling scenarios
- Mock external dependencies

### 11.2 Integration Tests
- Test full ETL pipeline with test data
- Validate database operations
- Test error recovery scenarios
- Verify data integrity

### 11.3 Data Validation
- Compare source vs target data counts
- Validate referential integrity
- Check for orphaned records
- Verify data quality metrics

## Step 12: Deployment and Monitoring

### 12.1 Docker Configuration
- Create Dockerfile for ETL service
- Set up docker-compose with PostgreSQL
- Configure environment variables
- Set up volume mounts for logs

### 12.2 Scheduling
- Set up cron jobs for automated ETL
- Configure different schedules for full vs incremental
- Implement job overlap prevention
- Set up alerting for failed jobs

### 12.3 Monitoring
- Create health check endpoints
- Monitor ETL job success rates
- Track data quality metrics
- Set up alerting for data issues

## Step 13: Data Migration Strategy

### 13.1 Migration Phases
1. **Phase 1**: Set up ETL project and test with sample data
2. **Phase 2**: Run ETL in parallel with existing system
3. **Phase 3**: Switch Rowcalibur to use ETL-sourced data
4. **Phase 4**: Implement real-time updates and advanced features

### 13.2 Rollback Plan
- Maintain Google Sheets as backup data source
- Keep existing DataService functionality
- Implement feature flags for data source switching
- Document rollback procedures

## Step 14: Performance Optimization

### 14.1 Database Optimization
- Create appropriate indexes
- Optimize query performance
- Implement connection pooling
- Monitor database performance

### 14.2 ETL Optimization
- Implement batch processing
- Use parallel processing where possible
- Optimize memory usage
- Monitor ETL performance metrics

## Implementation Order

1. **Week 1**: Project setup, database schema, basic models
2. **Week 2**: Google Sheets extractor, basic transformers
3. **Week 3**: PostgreSQL loader, ETL service
4. **Week 4**: CLI scripts, testing, validation
5. **Week 5**: Integration with Rowcalibur, deployment
6. **Week 6**: Monitoring, optimization, documentation

## Key Benefits

- **Separation of Concerns**: Clean separation between data pipeline and application logic
- **Scalability**: Can handle large datasets and multiple data sources
- **Data Quality**: Comprehensive validation and error handling
- **Monitoring**: Full observability into ETL job performance
- **Integration**: Seamless integration with existing Rowcalibur system
- **Maintainability**: Well-structured, testable, and documented code

## Next Steps

1. **Implement the ETL project** following this guide
2. **Test with my boathouse data** to ensure compatibility
3. **Deploy to infrastructure** with proper monitoring
4. **Update Rowcalibur** to use ETL-sourced data
5. **Plan Phase 5 features** with the new database foundation

This approach sets you up for success with multi-user support, real-time synchronization, and advanced features in future phases.
