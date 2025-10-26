# Multi-User Database Sync Strategy

**Date:** October 2025  
**Status:** PLANNING  
**Priority:** High  

## Overview

This document outlines a comprehensive strategy for implementing real-time, multi-user synchronization between the frontend (IndexedDB) and backend (PostgreSQL) databases. The current single-user optimized sync will be enhanced to support multiple concurrent users with intelligent change detection and selective synchronization.

## Current State Analysis

### Existing Sync Architecture
- **Frontend**: IndexedDB cache with simplified gauntlet service
- **Backend**: PostgreSQL with REST API endpoints
- **Sync Pattern**: Client-initiated, time-based throttling
- **Limitations**: No real-time updates, no multi-user awareness

### Performance Optimizations Already Implemented
- ✅ Sync control mechanism with throttling
- ✅ Cache timeout management (5-minute intervals)
- ✅ Prevention of continuous background loops
- ✅ Optimized ID mismatch checking
- ✅ Memoized UI components to prevent unnecessary re-renders

## Multi-User Sync Requirements

### Functional Requirements
1. **Real-time Updates**: Users should see changes from other users immediately
2. **Selective Sync**: Only sync data that affects the current user
3. **Conflict Resolution**: Handle concurrent edits gracefully
4. **Offline Support**: Maintain functionality when API is unavailable
5. **Performance**: Minimize unnecessary API calls and data transfer

### Technical Requirements
1. **Scalability**: Support multiple concurrent users
2. **Reliability**: Automatic reconnection and error handling
3. **Security**: Maintain authentication and authorization
4. **Monitoring**: Track sync performance and error rates

## Proposed Architecture

### **Option 1: Server-Sent Events (SSE) - Recommended**

#### Backend Implementation

**1. SSE Endpoint Setup**
```typescript
// Add to boathouse-etl/src/index.ts
import { createServer } from 'http';

const server = createServer(app);

// Store active SSE connections
const activeConnections = new Map<string, Response>();

// SSE endpoint for real-time sync notifications
app.get('/api/sync/events', authenticateToken, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': corsOrigins,
    'Access-Control-Allow-Credentials': 'true'
  });

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    timestamp: Date.now(),
    userId: req.user.athlete_id 
  })}\n\n`);

  // Store connection for this user
  const userId = req.user.athlete_id;
  activeConnections.set(userId, res);

  // Handle connection cleanup
  req.on('close', () => {
    activeConnections.delete(userId);
    console.log(`SSE connection closed for user: ${userId}`);
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});
```

**2. Change Notification System**
```typescript
// Add to boathouse-etl/src/services/changeNotificationService.ts
interface DataChangeEvent {
  type: 'data_change';
  changeType: 'athlete' | 'attendance' | 'practice_session' | 'gauntlet' | 'lineup' | 'seat_assignment';
  tableName: string;
  recordId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  affectedUsers: string[]; // Users who should receive this notification
  data: any;
  timestamp: number;
}

class ChangeNotificationService {
  private static instance: ChangeNotificationService;
  private activeConnections: Map<string, Response> = new Map();

  static getInstance(): ChangeNotificationService {
    if (!ChangeNotificationService.instance) {
      ChangeNotificationService.instance = new ChangeNotificationService();
    }
    return ChangeNotificationService.instance;
  }

  addConnection(userId: string, response: Response): void {
    this.activeConnections.set(userId, response);
  }

  removeConnection(userId: string): void {
    this.activeConnections.delete(userId);
  }

  notifyDataChange(event: DataChangeEvent): void {
    console.log(`📡 Broadcasting data change: ${event.changeType} ${event.operation} on ${event.tableName}`);
    
    // Send to all affected users
    event.affectedUsers.forEach(userId => {
      const connection = this.activeConnections.get(userId);
      if (connection && !connection.writableEnded) {
        try {
          connection.write(`data: ${JSON.stringify(event)}\n\n`);
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error);
          this.removeConnection(userId);
        }
      }
    });
  }

  // Helper method to determine affected users
  determineAffectedUsers(changeType: string, data: any): string[] {
    // Implementation depends on business logic
    // For now, notify all connected users
    return Array.from(this.activeConnections.keys());
  }
}
```

**3. Integration with Existing Routes**
```typescript
// Example: Update gauntlet routes to trigger notifications
// In boathouse-etl/src/routes/gauntlets.ts

import { ChangeNotificationService } from '../services/changeNotificationService';

const changeNotificationService = ChangeNotificationService.getInstance();

// Update POST route
router.post('/', authenticateToken, async (req, res) => {
  try {
    const gauntlet = await Gauntlet.create({
      // ... existing creation logic
    });

    // Trigger change notification
    changeNotificationService.notifyDataChange({
      type: 'data_change',
      changeType: 'gauntlet',
      tableName: 'gauntlets',
      recordId: gauntlet.gauntlet_id,
      operation: 'INSERT',
      affectedUsers: changeNotificationService.determineAffectedUsers('gauntlet', gauntlet),
      data: gauntlet,
      timestamp: Date.now()
    });

    res.status(201).json(gauntlet);
  } catch (error) {
    // ... error handling
  }
});
```

#### Frontend Implementation

**1. Enhanced Simplified Gauntlet Service**
```typescript
// Add to frontend/src/services/simplifiedGauntletService.ts
class SimplifiedGauntletService {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds

  // ... existing properties

  /**
   * Initialize Server-Sent Events connection
   */
  private initializeSSE(): void {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/sync/events', {
        withCredentials: true
      });

      this.eventSource.onopen = () => {
        console.log('🔗 SSE connection established');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.eventSource.onmessage = (event) => {
        this.handleSSEMessage(event);
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        this.handleSSEError();
      };

    } catch (error) {
      console.error('Failed to initialize SSE:', error);
    }
  }

  private handleSSEMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('✅ SSE connected successfully');
          break;
          
        case 'heartbeat':
          // Connection is alive, no action needed
          break;
          
        case 'data_change':
          this.handleDataChange(data);
          break;
          
        default:
          console.log('Unknown SSE message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }

  private handleDataChange(event: DataChangeEvent): void {
    console.log(`📡 Received data change notification: ${event.changeType} ${event.operation}`);
    
    // Determine if this change affects current user
    if (this.shouldSyncForChange(event)) {
      console.log(`🔄 Triggering sync for ${event.changeType} change`);
      this.triggerSelectiveSync(event);
    }
  }

  private shouldSyncForChange(event: DataChangeEvent): boolean {
    // Define which changes should trigger sync for current user
    const relevantChanges = ['athlete', 'attendance', 'practice_session', 'gauntlet'];
    
    if (!relevantChanges.includes(event.changeType)) {
      return false;
    }

    // Additional logic to determine if change affects current user
    // For example, only sync gauntlet changes if user is involved
    if (event.changeType === 'gauntlet') {
      // Check if current user is the creator or participant
      return this.isUserAffectedByGauntletChange(event);
    }

    return true;
  }

  private isUserAffectedByGauntletChange(event: DataChangeEvent): boolean {
    // Implementation depends on gauntlet access logic
    // For now, sync all gauntlet changes
    return true;
  }

  private triggerSelectiveSync(event: DataChangeEvent): void {
    // Reset sync time to allow immediate sync
    this.lastSyncTime = 0;
    
    // Trigger background sync
    this.syncGauntletsInBackground().catch(error => {
      console.error('Selective sync failed:', error);
    });
  }

  private handleSSEError(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting SSE reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
      
      setTimeout(() => {
        this.initializeSSE();
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max SSE reconnection attempts reached');
    }
  }

  /**
   * Enhanced getGauntlets with SSE initialization
   */
  async getGauntlets(): Promise<Gauntlet[]> {
    try {
      // Initialize SSE on first call
      if (!this.eventSource) {
        this.initializeSSE();
      }

      // ... existing getGauntlets logic
      const cachedGauntlets = await indexedDBService.getGauntlets();
      console.log(`📦 Found ${cachedGauntlets.length} gauntlets in cache`);

      // Only sync on first initialization
      if (!this.isInitialized) {
        this.isInitialized = true;
        this.syncGauntletsInBackground().catch(error => {
          console.error('Background gauntlet sync failed:', error);
        });
      }

      return cachedGauntlets.map(gauntlet => this.convertToGauntlet(gauntlet));
    } catch (error) {
      console.error('Error loading gauntlets from cache:', error);
      return [];
    }
  }

  /**
   * Cleanup SSE connection
   */
  destroy(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

### **Option 2: Database Triggers + Change Log**

#### Database Schema
```sql
-- Create change log table
CREATE TABLE data_change_log (
  change_id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(50) NOT NULL,
  change_type VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by VARCHAR(50),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_data_change_log_table_name ON data_change_log(table_name);
CREATE INDEX idx_data_change_log_changed_at ON data_change_log(changed_at);
CREATE INDEX idx_data_change_log_processed ON data_change_log(processed);

-- Create trigger function
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_change_log (table_name, record_id, change_type, changed_by, change_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.athlete_id::text, OLD.athlete_id::text, NEW.gauntlet_id::text, OLD.gauntlet_id::text),
    TG_OP,
    current_setting('app.current_user_id', true),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER athletes_change_log 
  AFTER INSERT OR UPDATE OR DELETE ON athletes
  FOR EACH ROW EXECUTE FUNCTION log_data_changes();

CREATE TRIGGER attendance_change_log 
  AFTER INSERT OR UPDATE OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION log_data_changes();

CREATE TRIGGER practice_sessions_change_log 
  AFTER INSERT OR UPDATE OR DELETE ON practice_sessions
  FOR EACH ROW EXECUTE FUNCTION log_data_changes();

CREATE TRIGGER gauntlets_change_log 
  AFTER INSERT OR UPDATE OR DELETE ON gauntlets
  FOR EACH ROW EXECUTE FUNCTION log_data_changes();
```

#### API Endpoint for Change Polling
```typescript
// Add to boathouse-etl/src/routes/sync.ts
router.get('/changes', authenticateToken, async (req, res) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    const changes = await sequelize.query(`
      SELECT change_id, table_name, record_id, change_type, changed_by, changed_at, change_data
      FROM data_change_log
      WHERE changed_at > :sinceDate
        AND processed = false
      ORDER BY changed_at ASC
    `, {
      replacements: { sinceDate },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      changes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching changes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch changes'
    });
  }
});
```

### **Option 3: Hybrid Smart Polling**

#### Intelligent Sync Intervals
```typescript
// Add to frontend/src/services/smartSyncService.ts
interface SyncConfig {
  dataType: string;
  interval: number;
  priority: 'high' | 'medium' | 'low';
  conditions: string[];
}

class SmartSyncService {
  private syncConfigs: SyncConfig[] = [
    {
      dataType: 'gauntlets',
      interval: 1 * 60 * 1000, // 1 minute
      priority: 'high',
      conditions: ['user_created', 'user_participating']
    },
    {
      dataType: 'attendance',
      interval: 2 * 60 * 1000, // 2 minutes
      priority: 'high',
      conditions: ['user_team', 'user_participating']
    },
    {
      dataType: 'athletes',
      interval: 5 * 60 * 1000, // 5 minutes
      priority: 'medium',
      conditions: ['user_team']
    },
    {
      dataType: 'practice_sessions',
      interval: 10 * 60 * 1000, // 10 minutes
      priority: 'low',
      conditions: ['user_team']
    }
  ];

  private lastSyncTimes: Record<string, number> = {};
  private userContext: any = {};

  async shouldSync(dataType: string): Promise<boolean> {
    const config = this.syncConfigs.find(c => c.dataType === dataType);
    if (!config) return false;

    const now = Date.now();
    const lastSync = this.lastSyncTimes[dataType] || 0;
    const timeSinceLastSync = now - lastSync;

    // Check if enough time has passed
    if (timeSinceLastSync < config.interval) {
      return false;
    }

    // Check if conditions are met
    return this.checkSyncConditions(config.conditions);
  }

  private checkSyncConditions(conditions: string[]): boolean {
    // Implementation depends on user context and business logic
    return conditions.some(condition => {
      switch (condition) {
        case 'user_created':
          return this.userContext.isCreator;
        case 'user_participating':
          return this.userContext.isParticipant;
        case 'user_team':
          return this.userContext.isTeamMember;
        default:
          return false;
      }
    });
  }
}
```

## Implementation Roadmap

### **Phase 1: Server-Sent Events (Immediate - 1-2 weeks)**

**Backend Tasks:**
- [ ] Add SSE endpoint to boathouse-etl
- [ ] Implement connection management
- [ ] Create change notification service
- [ ] Integrate with existing CRUD routes
- [ ] Add authentication to SSE endpoint

**Frontend Tasks:**
- [ ] Add EventSource to simplifiedGauntletService
- [ ] Implement change detection logic
- [ ] Add reconnection and error handling
- [ ] Update sync triggers based on SSE events
- [ ] Add connection status indicators

**Testing:**
- [ ] Test SSE connection establishment
- [ ] Test change notifications
- [ ] Test reconnection logic
- [ ] Test with multiple concurrent users

### **Phase 2: Database Triggers (Medium term - 2-3 weeks)**

**Database Tasks:**
- [ ] Create data_change_log table
- [ ] Implement trigger functions
- [ ] Add triggers to relevant tables
- [ ] Create indexes for performance
- [ ] Add cleanup procedures for old logs

**Backend Tasks:**
- [ ] Add change polling endpoint
- [ ] Implement change processing logic
- [ ] Add change log cleanup service
- [ ] Integrate with SSE notifications

**Testing:**
- [ ] Test database triggers
- [ ] Test change log accuracy
- [ ] Test performance with high change volume
- [ ] Test cleanup procedures

### **Phase 3: Advanced Features (Long term - 1-2 months)**

**Conflict Resolution:**
- [ ] Implement optimistic locking
- [ ] Add merge strategies for concurrent edits
- [ ] Create conflict resolution UI
- [ ] Add version tracking

**Performance Optimization:**
- [ ] Implement delta sync (only changed data)
- [ ] Add compression for large datasets
- [ ] Create smart caching strategies
- [ ] Add sync performance monitoring

**Advanced Features:**
- [ ] Offline queue management
- [ ] Multi-device synchronization
- [ ] Real-time collaboration features
- [ ] Advanced analytics and reporting

## Configuration and Environment

### Environment Variables
```bash
# Backend (boathouse-etl)
SSE_ENABLED=true
SSE_HEARTBEAT_INTERVAL=30000
CHANGE_LOG_RETENTION_DAYS=30
MAX_SSE_CONNECTIONS=1000

# Frontend (rowcalibur)
VITE_SSE_ENABLED=true
VITE_SSE_RECONNECT_ATTEMPTS=5
VITE_SSE_RECONNECT_DELAY=1000
VITE_SYNC_DEBUG=false
```

### Monitoring and Metrics
```typescript
// Add to both frontend and backend
interface SyncMetrics {
  connectionCount: number;
  messagesSent: number;
  messagesReceived: number;
  reconnectionCount: number;
  errorCount: number;
  averageLatency: number;
  lastSyncTime: Date;
}

// Track metrics for monitoring and optimization
class SyncMetricsCollector {
  private metrics: SyncMetrics = {
    connectionCount: 0,
    messagesSent: 0,
    messagesReceived: 0,
    reconnectionCount: 0,
    errorCount: 0,
    averageLatency: 0,
    lastSyncTime: new Date()
  };

  recordConnection(): void {
    this.metrics.connectionCount++;
  }

  recordMessage(type: 'sent' | 'received'): void {
    if (type === 'sent') {
      this.metrics.messagesSent++;
    } else {
      this.metrics.messagesReceived++;
    }
  }

  recordReconnection(): void {
    this.metrics.reconnectionCount++;
  }

  recordError(): void {
    this.metrics.errorCount++;
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }
}
```

## Security Considerations

### Authentication and Authorization
- SSE connections must be authenticated
- Change notifications should respect user permissions
- Sensitive data should not be broadcast to unauthorized users
- Rate limiting on SSE connections

### Data Privacy
- Only broadcast changes to affected users
- Implement data filtering based on user roles
- Log all sync activities for audit purposes
- Encrypt sensitive data in transit

## Performance Considerations

### Scalability
- Connection pooling for SSE
- Horizontal scaling with Redis for connection state
- Database connection optimization
- Caching strategies for frequently accessed data

### Resource Management
- Automatic cleanup of stale connections
- Memory management for large datasets
- CPU optimization for change detection
- Network bandwidth optimization

## Testing Strategy

### Unit Tests
- SSE connection management
- Change notification logic
- Sync trigger conditions
- Error handling and reconnection

### Integration Tests
- End-to-end sync workflows
- Multi-user scenarios
- Network failure recovery
- Data consistency validation

### Performance Tests
- Concurrent user load testing
- Large dataset sync performance
- Memory usage under load
- Network bandwidth utilization

## Success Metrics

### Performance Metrics
- Sync latency < 1 second for real-time updates
- Connection stability > 99%
- Reconnection success rate > 95%
- API response time < 200ms

### User Experience Metrics
- Time to see changes from other users < 2 seconds
- Sync failure rate < 1%
- User satisfaction with real-time updates
- Reduced manual refresh usage

### Technical Metrics
- SSE connection count and stability
- Change notification delivery rate
- Database trigger performance
- Memory and CPU usage optimization

## Conclusion

This multi-user sync strategy transforms the current single-user optimized system into a robust, real-time collaborative platform. The phased approach ensures minimal disruption while delivering immediate benefits through Server-Sent Events, with future enhancements for advanced conflict resolution and performance optimization.

The implementation will provide:
- ✅ **Real-time collaboration** between multiple users
- ✅ **Intelligent sync** based on data relevance
- ✅ **Robust error handling** with automatic recovery
- ✅ **Scalable architecture** for future growth
- ✅ **Performance optimization** with minimal resource usage

This foundation will support advanced features like real-time collaboration, conflict resolution, and multi-device synchronization as the application evolves.
