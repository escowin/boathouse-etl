# Boathouse-ETL

A specialized ETL (Extract, Transform, Load) service designed to modernize rowing club operations by replacing spreadsheet dependencies with a centralized, scalable database solution. This service focuses purely on data processing and synchronization.

## 🎯 Project Goals

This ETL service was created to address the challenges of data management in rowing club operations:

- **Replace Spreadsheet Dependencies**: Eliminate reliance on various Google Sheets and Excel files
- **Automate Data Synchronization**: Scheduled data extraction and processing
- **Ensure Data Quality**: Comprehensive data validation and error handling
- **Maintain Data Consistency**: Standardized data formats across all systems
- **Support Data Infrastructure**: Provide clean, structured data for other applications

## 🏗️ Architecture Overview

### Core Systems

#### 1. **ETL Pipeline**
- **Google Sheets Integration**: Automated data extraction from existing club spreadsheets
- **Data Transformation**: Clean, validate, and standardize data formats
- **Database Loading**: Populate PostgreSQL database with structured data
- **Scheduled Processing**: Automated ETL jobs for regular data updates
- **Error Handling**: Comprehensive retry logic and error reporting

#### 2. **Data Sources**
- **Athlete Information**: Names, contact details, team assignments
- **Boat Inventory**: Boat names, types, and specifications
- **Practice Sessions**: Session dates, attendance, and notes
- **Team Rosters**: Team compositions and member assignments
- **USRA Categories**: Age and weight category classifications
- **Attendance Records**: Practice session participation tracking
- **Lineup Data**: Seat assignments and boat configurations

#### 3. **Database Integration**
- **PostgreSQL Database**: Central data repository (boathouse_trc)
- **Sequelize ORM**: Database operations and migrations
- **Data Validation**: Comprehensive data quality checks
- **Migration System**: Schema updates and rollback capabilities

## 🚀 Features

### ETL Processing
- **Automated Data Extraction**: Scheduled data extraction from Google Sheets
- **Data Transformation**: Clean, validate, and standardize data formats
- **Batch Processing**: Configurable batch sizes for optimal performance
- **Error Handling**: Comprehensive retry logic and error reporting
- **Data Validation**: Quality checks and data integrity verification

### Data Sources
- **Athlete Data**: Complete athlete profiles and information
- **Team Data**: Team compositions and member assignments
- **Boat Inventory**: Equipment catalog with standardized naming
- **Practice Sessions**: Session scheduling and management data
- **Attendance Records**: Practice participation tracking
- **Lineup Data**: Seat assignments and boat configurations
- **USRA Categories**: Age and weight classifications

### Database Operations
- **Migration System**: Database schema migrations with rollback capabilities
- **Data Integrity**: Comprehensive data validation and consistency checks
- **Connection Management**: Efficient database connection pooling
- **Transaction Safety**: Atomic operations for data consistency

## 🛠️ Technology Stack

- **Backend**: Node.js with TypeScript
- **Database**: PostgreSQL with Sequelize ORM
- **ETL**: Custom ETL pipeline with Google Sheets API integration
- **Migration**: Sequelize migrations with custom scripts
- **Environment**: Docker support for containerized deployment

## 📁 Project Structure

```
boathouse-etl/
├── src/
│   ├── config/           # Database and environment configuration
│   ├── etl/              # ETL pipeline components
│   │   ├── orchestrator.ts    # Main ETL orchestration
│   │   ├── athletes.ts        # Athlete data processing
│   │   ├── boats.ts           # Boat data processing
│   │   ├── teams.ts           # Team data processing
│   │   ├── practice-sessions.ts # Practice session processing
│   │   ├── attendance.ts      # Attendance data processing
│   │   ├── lineup.ts          # Lineup data processing
│   │   ├── usra-categories.ts # USRA category processing
│   │   └── google-sheets-service.ts # Google Sheets integration
│   ├── models/           # Sequelize database models
│   ├── migrations/       # Database migration files
│   ├── scripts/          # Utility and migration scripts
│   └── utils/            # Helper utilities
├── docs/                 # Project documentation
├── credentials/          # Google service account credentials
└── migrations/           # Legacy migration files
```

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Google Service Account credentials
- Environment variables configured

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:escowin/boathouse-etl.git
   cd boathouse-etl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with database and Google Sheets credentials
   ```

4. **Setup database**
   ```bash
   npm run setup
   ```

5. **Run ETL pipeline**
   ```bash
   npm run etl:full
   ```

## 📋 Available Scripts

### ETL Operations
- `npm run etl` - Run ETL pipeline (default: full)
- `npm run etl:full` - Full ETL with all data sources
- `npm run etl:boats` - Extract boat data only
- `npm run etl:usra-categories` - Extract USRA categories only
- `npm run etl:athletes` - Extract athlete data only
- `npm run etl:teams` - Extract team data only
- `npm run etl:practice-sessions` - Extract practice session data
- `npm run etl:attendance` - Extract attendance data only
- `npm run etl:lineup` - Extract lineup data only
- `npm run etl:test` - Test ETL pipeline without database changes
- `npm run etl:validate` - Validate data without processing
- `npm run etl:status` - Check ETL job status

### Database Setup
- `npm run setup` - Complete database setup (all migrations)
- `npm run setup:rollback` - Rollback complete database setup
- `npm run migrate:up` - Run pending migrations
- `npm run migrate:down` - Rollback last migration
- `npm run migrate:status` - Check migration status

### Development
- `npm run dev` - Start ETL service
- `npm run build` - Build TypeScript
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Configuration
- `npm run validate:config` - Validate shared resource paths

## 🔧 Configuration

### Environment Variables
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name (boathouse_trc)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SSL` - SSL connection (true/false)
- `GOOGLE_SHEETS_CREDENTIALS_PATH` - Path to Google service account JSON
- `GOOGLE_SHEETS_SPREADSHEET_ID` - Google Sheets document ID
- `ETL_BATCH_SIZE` - Batch size for processing (default: 100)
- `ETL_RETRY_ATTEMPTS` - Number of retry attempts (default: 3)
- `ETL_RETRY_DELAY_MS` - Delay between retries in milliseconds (default: 5000)
- `ETL_LOG_LEVEL` - ETL logging level (debug, info, warn, error)
- `LOG_LEVEL` - General logging level (debug, info, warn, error)

### Google Sheets Setup
1. Create a Google Service Account
2. Download the JSON credentials file
3. Share Google Sheets with the service account email
4. Configure the sheet ID in environment variables

## 📊 Data Sources

The ETL system integrates with various Google Sheets containing:
- **Athlete Information**: Names, contact details, team assignments
- **Boat Inventory**: Boat names, types, and specifications
- **Practice Sessions**: Session dates, attendance, and notes
- **Team Rosters**: Team compositions and member assignments
- **USRA Categories**: Age and weight category classifications
- **Attendance Records**: Practice session participation tracking
- **Lineup Data**: Seat assignments and boat configurations

## 🔄 ETL Process Flow

1. **Extract**: Pull data from Google Sheets using API
2. **Transform**: Clean, validate, and standardize data formats
3. **Load**: Insert/update data in PostgreSQL database
4. **Validate**: Verify data integrity and completeness
5. **Report**: Generate status reports and error logs

## 🏗️ Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Google Sheets  │    │  boathouse-etl  │    │  boathouse_trc  │
│                 │    │                 │    │                 │
│ 📊 Source Data  │───▶│ 🏭 ETL Service  │───▶│ 🏠 Database     │
│ - Athletes      │    │ - Extract       │    │ - PostgreSQL    │
│ - Boats         │    │ - Transform     │    │ - Centralized   │
│ - Sessions      │    │ - Load          │    │ - Structured    │
│ - Attendance    │    │ - Validate      │    │ - Consistent    │
│ - Lineups       │    │ - Report        │    │ - Accessible    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │    crewhub      │
                       │                 │
                       │ 🌐 API Server   │
                       │ - Authentication│
                       │ - Data Access   │
                       │ - Applications  │
                       └─────────────────┘
                                ▲
                                │
                       ┌─────────────────┐
                       │  Shared Models  │
                       │  & Config       │
                       │  (via config.json)│
                       └─────────────────┘
```

### 🔗 **Shared Resource Integration**

Boathouse-ETL uses a config.json approach to share resources with CrewHub:

- **Shared Models**: Database models loaded from `../crewhub/src/models`
- **Shared Config**: Environment and database config from `../crewhub/src/config`
- **Module Proxy**: `src/shared/index.ts` handles dynamic path resolution
- **No Duplication**: Always uses latest shared resources
- **Service Optimization**: ETL-optimized database configuration

## 🔄 Data Flow

1. **Extract**: Pull data from Google Sheets using API
2. **Transform**: Clean, validate, and standardize data
3. **Load**: Insert/update data in PostgreSQL database
4. **Validate**: Verify data integrity and completeness
5. **Report**: Generate status reports and error logs

## 📈 Benefits

### For Data Management
- **Automated Processing**: Eliminates manual data entry and synchronization
- **Data Quality**: Comprehensive validation and error handling
- **Consistency**: Standardized data formats across all systems
- **Reliability**: Robust retry logic and error recovery

### For System Integration
- **Clean Data**: Structured, validated data for other applications
- **Real-time Sync**: Regular data updates from source systems
- **Scalability**: Handles growing data volumes efficiently
- **Maintainability**: Clear separation of ETL and API concerns

### For Development
- **Modular Design**: Focused ETL service with clear responsibilities
- **Easy Debugging**: Comprehensive logging and error reporting
- **Flexible Configuration**: Environment-based settings for different deployments
- **Testing Support**: Built-in validation and testing capabilities

## 📝 License

This is proprietary software. All rights reserved.

**NO USE WITHOUT PERMISSION**: This software may not be used, copied, modified, distributed, or sold without explicit written permission from Edwin Escobar.

For licensing inquiries, commercial use, or permission requests, contact:
**Edwin Escobar**  
Email: edwin@escowinart.com

See LICENSE and LICENSING.md files for complete terms and conditions.

## 🆘 Support

For questions, issues, or licensing inquiries, please:
- Check the documentation in the `docs/` folder
- Contact Edwin Escobar at edwin@escowinart.com

---

**Built with ❤️ for the rowing community**