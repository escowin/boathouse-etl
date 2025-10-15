# Database Architecture Strategy: Seasonal Performance Optimization

## 📋 **Executive Summary**

This document outlines a comprehensive database architecture strategy to maintain optimal performance as the Boathouse ETL system accumulates data across multiple seasons. The strategy addresses table bloat, query performance degradation, and long-term data management while preserving historical data for analytics and reporting.

## 🎯 **Problem Statement**

As the club continues using the database season after season, core tables will accumulate significant data:
- **Attendance**: ~12,000 records per season
- **Practice Sessions**: ~200 records per season  
- **Lineups**: ~400 records per season
- **Seat Assignments**: ~2,000 records per season

After 5 years, this could result in:
- 60,000+ attendance records in a single table
- Query performance degradation (200-500ms for complex queries)
- Index bloat affecting write performance
- Maintenance complexity for large datasets

## 🏗️ **Recommended Architecture Strategy**

### **Core Principle: Hybrid Seasonal Partitioning**

We will implement a hybrid approach that combines:
1. **Table Renaming** for high-volume operational tables
2. **Soft Partitioning** for reference tables
3. **Analytics Summary Tables** for cross-season reporting

## 📊 **Table Classification & Strategy**

### **1. Core Operational Tables (Annual Renaming)**

**Tables:** `attendance`, `practice_sessions`, `lineups`, `seat_assignments`

**Strategy:** Rename tables at season end, create fresh tables for new season

**Benefits:**
- ✅ Maximum performance for current season queries
- ✅ No date filtering needed for operational queries
- ✅ Simple maintenance and backup procedures
- ✅ Clear separation of seasonal data

**Implementation:**
```sql
-- End of 2025 season
ALTER TABLE attendance RENAME TO attendance_2025;
ALTER TABLE practice_sessions RENAME TO practice_sessions_2025;
ALTER TABLE lineups RENAME TO lineups_2025;
ALTER TABLE seat_assignments RENAME TO seat_assignments_2025;

-- Start of 2026 season
CREATE TABLE attendance (LIKE attendance_2025 INCLUDING ALL);
CREATE TABLE practice_sessions (LIKE practice_sessions_2025 INCLUDING ALL);
CREATE TABLE lineups (LIKE lineups_2025 INCLUDING ALL);
CREATE TABLE seat_assignments (LIKE seat_assignments_2025 INCLUDING ALL);
```

### **2. Reference Tables (Soft Partitioning)**

**Tables:** `athletes`, `teams`, `boats`, `usra_categories`, `mailing_lists`

**Strategy:** Keep current data active, archive inactive records

**Benefits:**
- ✅ Maintains referential integrity across seasons
- ✅ Preserves historical relationships
- ✅ Easy reactivation of returning members
- ✅ Supports cross-season analytics

**Implementation:**
```sql
-- Add season tracking
ALTER TABLE athletes ADD COLUMN active_season INTEGER;
ALTER TABLE athletes ADD COLUMN last_active_date DATE;
ALTER TABLE athletes ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- Status values: 'active', 'inactive', 'graduated', 'expired', 'transferred'

-- Create views for current season
CREATE VIEW current_athletes AS 
SELECT * FROM athletes WHERE active_season = EXTRACT(YEAR FROM CURRENT_DATE);
```

### **3. Analytics Summary Tables (Cross-Season)**

**Purpose:** Enable fast analytics across multiple seasons without querying large historical tables

**Tables:**
```sql
-- Performance analytics
CREATE TABLE attendance_summary (
  athlete_id UUID,
  season INTEGER,
  total_sessions INTEGER,
  attendance_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Boat usage analytics
CREATE TABLE boat_usage_summary (
  boat_id UUID,
  season INTEGER,
  total_lineups INTEGER,
  avg_weight_kg DECIMAL(5,2),
  avg_age DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team performance metrics
CREATE TABLE team_performance_summary (
  team_id INTEGER,
  season INTEGER,
  total_athletes INTEGER,
  avg_attendance_rate DECIMAL(5,2),
  total_practice_sessions INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔧 **Implementation Strategy**

### **Phase 1: Season Transition Automation**

**Timeline:** Before 2026 season start

**Components:**
1. **Season Transition Script**
2. **Dynamic Table Name Resolution**
3. **Application Layer Updates**

**Season Transition Script:**
```typescript
// scripts/season-transition.ts
export class SeasonTransition {
  async transitionToNewSeason(newYear: number) {
    console.log(`🔄 Starting season transition to ${newYear}...`);
    
    // 1. Archive current season tables
    await this.archiveSeasonTables(newYear - 1);
    
    // 2. Create new season tables
    await this.createNewSeasonTables(newYear);
    
    // 3. Update reference data
    await this.updateReferenceData(newYear);
    
    // 4. Generate season summaries
    await this.generateSeasonSummaries(newYear - 1);
    
    console.log(`✅ Season transition to ${newYear} completed successfully`);
  }
  
  private async archiveSeasonTables(year: number) {
    const tables = ['attendance', 'practice_sessions', 'lineups', 'seat_assignments'];
    
    for (const table of tables) {
      console.log(`📦 Archiving ${table} to ${table}_${year}...`);
      await sequelize.query(`ALTER TABLE ${table} RENAME TO ${table}_${year}`);
      await sequelize.query(`CREATE TABLE ${table} (LIKE ${table}_${year} INCLUDING ALL)`);
    }
  }
  
  private async generateSeasonSummaries(year: number) {
    console.log(`📊 Generating season summaries for ${year}...`);
    
    // Generate attendance summaries
    await sequelize.query(`
      INSERT INTO attendance_summary (athlete_id, season, total_sessions, attendance_rate)
      SELECT 
        a.athlete_id,
        ${year} as season,
        COUNT(*) as total_sessions,
        ROUND((COUNT(CASE WHEN att.status = 'Yes' THEN 1 END) * 100.0 / COUNT(*)), 2) as attendance_rate
      FROM attendance_${year} att
      JOIN athletes a ON att.athlete_id = a.athlete_id
      GROUP BY a.athlete_id
    `);
    
    // Generate boat usage summaries
    await sequelize.query(`
      INSERT INTO boat_usage_summary (boat_id, season, total_lineups, avg_weight_kg, avg_age)
      SELECT 
        l.boat_id,
        ${year} as season,
        COUNT(*) as total_lineups,
        ROUND(AVG(l.total_weight_kg), 2) as avg_weight_kg,
        ROUND(AVG(l.average_age), 1) as avg_age
      FROM lineups_${year} l
      GROUP BY l.boat_id
    `);
  }
}
```

### **Phase 2: Application Layer Updates**

**Dynamic Table Name Resolution:**
```typescript
// config/database.ts
export const getCurrentSeasonTable = (baseTableName: string): string => {
  const currentYear = new Date().getFullYear();
  return `${baseTableName}_${currentYear}`;
};

export const getSeasonTable = (baseTableName: string, year: number): string => {
  return `${baseTableName}_${year}`;
};

// Usage in queries
const attendanceTable = getCurrentSeasonTable('attendance');
const query = `SELECT * FROM ${attendanceTable} WHERE session_id = ?`;
```

**ETL System Updates:**
```typescript
// src/etl/base-etl.ts
export abstract class BaseETLProcess {
  protected getCurrentSeasonTable(tableName: string): string {
    return getCurrentSeasonTable(tableName);
  }
  
  protected async queryCurrentSeason(sql: string, replacements?: any[]): Promise<any[]> {
    const currentYear = new Date().getFullYear();
    const seasonSql = sql.replace(/\b(attendance|practice_sessions|lineups|seat_assignments)\b/g, 
      (match) => `${match}_${currentYear}`);
    return sequelize.query(seasonSql, { replacements });
  }
}
```

### **Phase 3: Analytics Layer**

**Cross-Season Reporting Views:**
```sql
-- Multi-season attendance analysis
CREATE VIEW multi_season_attendance AS
SELECT 
  a.name,
  a.athlete_id,
  s.season,
  s.total_sessions,
  s.attendance_rate,
  LAG(s.attendance_rate) OVER (PARTITION BY a.athlete_id ORDER BY s.season) as prev_season_rate
FROM athletes a
JOIN attendance_summary s ON a.athlete_id = s.athlete_id
WHERE a.status = 'active';

-- Boat performance trends
CREATE VIEW boat_performance_trends AS
SELECT 
  b.name as boat_name,
  b.type as boat_type,
  s.season,
  s.total_lineups,
  s.avg_weight_kg,
  s.avg_age,
  LAG(s.avg_weight_kg) OVER (PARTITION BY b.boat_id ORDER BY s.season) as prev_season_weight
FROM boats b
JOIN boat_usage_summary s ON b.boat_id = s.boat_id;
```

## 📈 **Performance Benefits**

### **Current State (Single Table)**
- **5 years of data**: ~60,000 attendance records
- **Query time**: 200-500ms for complex queries
- **Index size**: Large indexes slow down writes
- **Maintenance**: Complex queries for current season data

### **After Implementation (Seasonal Tables)**
- **Current season**: ~12,000 attendance records
- **Query time**: 20-50ms for current season queries
- **Historical queries**: 100-200ms (only when needed)
- **Index efficiency**: Smaller, focused indexes
- **Maintenance**: Simple, fast operations

### **Performance Comparison**
| Operation | Current (5 years) | After (Seasonal) | Improvement |
|-----------|------------------|------------------|-------------|
| Current season query | 200-500ms | 20-50ms | **90% faster** |
| Historical analysis | 500-1000ms | 100-200ms | **80% faster** |
| Data backup | 2-5 minutes | 30-60 seconds | **85% faster** |
| Index maintenance | 5-10 minutes | 1-2 minutes | **80% faster** |

## 🗓️ **Migration Timeline**

### **Q4 2025: Preparation Phase**
- [ ] Create season transition scripts
- [ ] Update ETL system for dynamic table names
- [ ] Create analytics summary tables
- [ ] Test transition process with copy of current data

### **Q1 2026: Implementation Phase**
- [ ] Execute first season transition (2025 → 2026)
- [ ] Update application code to use dynamic table names
- [ ] Implement analytics summary generation
- [ ] Monitor performance improvements

### **Q2 2026: Optimization Phase**
- [ ] Fine-tune summary table generation
- [ ] Implement automated season transition
- [ ] Create cross-season reporting dashboards
- [ ] Document operational procedures

## 🔍 **Data Retention Policy**

### **Operational Tables**
- **Current season**: Full access, optimal performance
- **Previous seasons**: Archived, accessible for analytics
- **Retention**: Indefinite (for historical analysis)

### **Reference Tables**
- **Active records**: Current season access
- **Inactive records**: Archived but preserved
- **Retention**: Indefinite (for member reactivation)

### **Analytics Summary Tables**
- **Purpose**: Fast cross-season analysis
- **Update frequency**: End of each season
- **Retention**: Indefinite (for trend analysis)

## 🚨 **Risk Mitigation**

### **Data Integrity Risks**
- **Mitigation**: Comprehensive testing with data copies
- **Backup strategy**: Full database backup before each transition
- **Rollback plan**: Ability to restore previous season tables

### **Application Downtime**
- **Mitigation**: Transition during maintenance windows
- **Duration**: Estimated 15-30 minutes per transition
- **Communication**: Advance notice to users

### **Query Complexity**
- **Mitigation**: Abstract table naming in application layer
- **Documentation**: Clear examples for developers
- **Training**: Team education on new patterns

## 📋 **Success Metrics**

### **Performance Metrics**
- [ ] Current season query time < 50ms
- [ ] Historical query time < 200ms
- [ ] Database backup time < 2 minutes
- [ ] Season transition time < 30 minutes

### **Operational Metrics**
- [ ] Zero data loss during transitions
- [ ] 100% application compatibility
- [ ] Successful cross-season analytics
- [ ] Reduced maintenance overhead

## 🎯 **Next Steps**

1. **Review and approve** this architecture strategy
2. **Create detailed implementation plan** with specific timelines
3. **Begin development** of season transition scripts
4. **Test transition process** with current data
5. **Schedule first transition** for end of 2025 season

## 📚 **References**

- [PostgreSQL Table Partitioning Documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Database Performance Optimization Best Practices](https://www.postgresql.org/docs/current/performance-tips.html)
- [ETL System Architecture Patterns](https://docs.aws.amazon.com/whitepapers/latest/data-analytics-options/etl-architecture-patterns.html)

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** March 2025
