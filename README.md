# Boathouse-ETL

A comprehensive data management and ETL (Extract, Transform, Load) system designed to modernize rowing club operations by replacing spreadsheet dependencies with a centralized, scalable database solution.

## 🎯 Project Goals

This project was created to address the challenges of managing a rowing club's data across multiple disconnected systems:

- **Replace Spreadsheet Dependencies**: Eliminate reliance on various Google Sheets and Excel files
- **Centralize Communications**: Consolidate decentralized communication channels
- **Improve Statistics Recording**: Create a robust system for tracking athlete performance and progress
- **Support Coaching Applications**: Provide data infrastructure for coaching and athlete management tools
- **Enable Competitive Systems**: Implement Gauntlet and Ladder systems for athlete ranking and challenges

## 🏗️ Architecture Overview

### Core Systems

#### 1. **ETL Pipeline**
- **Google Sheets Integration**: Automated data extraction from existing club spreadsheets
- **Data Transformation**: Clean, validate, and standardize data formats
- **Database Loading**: Populate PostgreSQL database with structured data
- **Scheduled Processing**: Automated ETL jobs for regular data updates

#### 2. **Database Schema**
- **Athletes & Teams**: Comprehensive athlete and team management
- **Boats & Equipment**: Boat inventory with standardized type notation (1x, 2x, 2-, 4x, 4+, 8+)
- **Practice Sessions**: Track practice attendance and participation
- **Lineups & Seat Assignments**: Detailed lineup management with seat assignments
- **Regattas & Races**: Competition tracking and results
- **USRA Categories**: Age and weight category management

#### 3. **Competitive Systems (Rowcalibur Integration)**
- **Gauntlet System**: Individual athlete challenge and ranking system
- **Ladder System**: Position-based ranking with progression tracking
- **Match Records**: Detailed match history and statistics
- **Seat Assignments**: Competitive lineup management

## 🚀 Features

### Data Management
- **Automated ETL**: Scheduled data extraction from Google Sheets
- **Data Validation**: Comprehensive data quality checks and error handling
- **Migration System**: Database schema migrations with rollback capabilities
- **Backup & Recovery**: Data integrity and recovery mechanisms

### Athlete & Team Management
- **Athlete Profiles**: Complete athlete information and history
- **Team Memberships**: Flexible team assignment and management
- **Attendance Tracking**: Practice session attendance and participation
- **Performance Metrics**: Erg test results and performance tracking

### Equipment Management
- **Boat Inventory**: Complete boat catalog with standardized naming
- **Seat Assignments**: Detailed lineup and seat management
- **Equipment Tracking**: Maintenance and usage history

### Competitive Features
- **Gauntlet Challenges**: Individual athlete ranking challenges
- **Ladder Rankings**: Position-based competitive system
- **Match History**: Comprehensive match and result tracking
- **Progress Analytics**: Performance trends and improvement tracking

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
   # Edit .env with your database and Google Sheets credentials
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

### Database Setup
- `npm run setup` - Complete database setup (all migrations)
- `npm run setup:rollback` - Rollback complete database setup
- `npm run migrate:up` - Run pending migrations
- `npm run migrate:down` - Rollback last migration

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

### Development
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_SHEETS_CREDENTIALS` - Path to Google service account JSON
- `GOOGLE_SHEETS_ID` - Google Sheets document ID
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

### Google Sheets Setup
1. Create a Google Service Account
2. Download the JSON credentials file
3. Share your Google Sheets with the service account email
4. Configure the sheet ID in environment variables

## 📊 Data Sources

The ETL system integrates with various Google Sheets containing:
- **Athlete Information**: Names, contact details, team assignments
- **Boat Inventory**: Boat names, types, and specifications
- **Practice Sessions**: Session dates, attendance, and notes
- **Team Rosters**: Team compositions and member assignments
- **USRA Categories**: Age and weight category classifications

## 🏆 Competitive Systems

### Gauntlet System
- Individual athlete challenges and rankings
- Match-based progression system
- Detailed performance tracking
- Personal ranking improvements

### Ladder System
- Position-based competitive rankings
- Automatic position updates based on match results
- Historical progression tracking
- Win/loss statistics and trends

## 🔄 Data Flow

1. **Extract**: Pull data from Google Sheets using API
2. **Transform**: Clean, validate, and standardize data
3. **Load**: Insert/update data in PostgreSQL database
4. **Validate**: Verify data integrity and completeness
5. **Report**: Generate status reports and error logs

## 📈 Benefits

### For Coaches
- **Centralized Data**: All athlete and team information in one place
- **Real-time Updates**: Automatic data synchronization
- **Performance Analytics**: Comprehensive performance tracking
- **Lineup Management**: Easy lineup creation and seat assignment

### For Athletes
- **Personal Progress**: Individual performance tracking
- **Competitive Features**: Gauntlet and ladder systems
- **Historical Data**: Complete performance history
- **Goal Setting**: Data-driven improvement tracking

### For Club Management
- **Reduced Manual Work**: Automated data processing
- **Data Consistency**: Standardized data formats
- **Scalability**: System grows with club needs
- **Integration Ready**: API-ready for future applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions, please:
- Check the documentation in the `docs/` folder
- Review existing issues
- Create a new issue with detailed information
- Contact the development team

---

**Built with ❤️ for the rowing community**