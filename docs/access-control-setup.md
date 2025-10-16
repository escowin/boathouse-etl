# System-Wide Access Control Setup Guide

## Overview

This guide outlines the implementation of system-wide access control for the Boathouse ETL system, focusing on the management of banned athletes and competitive status enforcement across all applications and services.

## Table of Contents

1. [Database Schema Updates](#database-schema-updates)
2. [Backend Access Control Implementation](#backend-access-control-implementation)
3. [Frontend Access Control Implementation](#frontend-access-control-implementation)
4. [Automated Cleanup Systems](#automated-cleanup-systems)
5. [Admin Interface Implementation](#admin-interface-implementation)
6. [Testing and Validation](#testing-and-validation)
7. [Deployment Checklist](#deployment-checklist)

## Database Schema Updates

### 1. Athlete Status Fields

The `athletes` table has been enhanced with the following fields:

```sql
-- Competitive status management
competitive_status TEXT DEFAULT 'active' CHECK (competitive_status IN ('active', 'inactive', 'retired', 'banned'))
retirement_reason TEXT CHECK (retirement_reason IN ('deceased', 'transferred', 'graduated', 'personal', 'unknown'))
retirement_date DATE
ban_reason TEXT CHECK (ban_reason IN ('misconduct', 'safety_violation', 'harassment', 'other'))
ban_date DATE
ban_notes TEXT
```

### 2. Status Definitions

#### Competitive Status Values
- **`active`**: Currently competing and eligible for all activities
- **`inactive`**: Temporarily not competing (injury, break, etc.)
- **`retired`**: No longer competing (covers deceased, transferred, graduated)
- **`banned`**: Banned from all club activities due to misconduct

#### Retirement Reasons
- **`deceased`**: Athlete has passed away
- **`transferred`**: Moved to another club
- **`graduated`**: Graduated from junior program
- **`personal`**: Personal reasons, injury, etc.
- **`unknown`**: For existing data migration

#### Ban Reasons
- **`misconduct`**: General misconduct
- **`safety_violation`**: Safety-related violations
- **`harassment`**: Harassment or inappropriate behavior
- **`other`**: Other reasons requiring ban

## Backend Access Control Implementation

### 1. Base Service Class

Create a base service class that automatically excludes banned athletes:

```typescript
// src/services/BaseAthleteService.ts
import { Op } from 'sequelize';
import Athlete from '../models/Athlete';

export abstract class BaseAthleteService {
  protected excludeBanned<T extends { athlete_id: string }>(query: any): any {
    return {
      ...query,
      include: [
        ...(query.include || []),
        {
          model: Athlete,
          where: { competitive_status: { [Op.ne]: 'banned' } },
          required: true
        }
      ]
    };
  }

  // Get only non-banned athletes
  async getActiveAthletes(): Promise<Athlete[]> {
    return Athlete.findAll({
      where: { competitive_status: { [Op.ne]: 'banned' } }
    });
  }

  // Get athletes by competitive status
  async getAthletesByStatus(status: string): Promise<Athlete[]> {
    return Athlete.findAll({
      where: { competitive_status: status }
    });
  }
}
```

### 2. Team Service Implementation

```typescript
// src/services/TeamService.ts
import { BaseAthleteService } from './BaseAthleteService';
import TeamMembership from '../models/TeamMembership';
import Athlete from '../models/Athlete';

export class TeamService extends BaseAthleteService {
  async getTeamMembers(teamId: number): Promise<Athlete[]> {
    return TeamMembership.findAll({
      where: { team_id: teamId },
      include: [{
        model: Athlete,
        where: { competitive_status: { [Op.ne]: 'banned' } },
        required: true
      }]
    });
  }

  // Remove banned athletes from teams
  async removeBannedAthletesFromTeams(): Promise<void> {
    const bannedAthletes = await Athlete.findAll({
      where: { competitive_status: 'banned' }
    });

    for (const athlete of bannedAthletes) {
      await TeamMembership.destroy({
        where: { athlete_id: athlete.athlete_id }
      });
    }
  }
}
```

### 3. Authentication Middleware

```typescript
// src/middleware/athleteAccess.ts
import { Request, Response, NextFunction } from 'express';
import Athlete from '../models/Athlete';

export const checkAthleteAccess = async (req: Request, res: Response, next: NextFunction) => {
  const athleteId = req.user?.athlete_id;
  
  if (athleteId) {
    const athlete = await Athlete.findByPk(athleteId);
    
    if (athlete?.competitive_status === 'banned') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your account has been suspended'
      });
    }
  }
  
  next();
};

// Admin-only middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
```

### 4. API Route Protection

```typescript
// src/routes/athletes.ts
import { Router } from 'express';
import { checkAthleteAccess, requireAdmin } from '../middleware/athleteAccess';
import { TeamService } from '../services/TeamService';

const router = Router();
const teamService = new TeamService();

// All athlete routes require access check
router.use(checkAthleteAccess);

// Get active athletes (excludes banned)
router.get('/active', async (req, res) => {
  const athletes = await teamService.getActiveAthletes();
  res.json(athletes);
});

// Admin-only: Get banned athletes
router.get('/banned', requireAdmin, async (req, res) => {
  const athletes = await teamService.getAthletesByStatus('banned');
  res.json(athletes);
});

// Admin-only: Ban athlete
router.post('/:id/ban', requireAdmin, async (req, res) => {
  const { reason, notes } = req.body;
  // Implementation for banning athlete
});

export default router;
```

## Frontend Access Control Implementation

### 1. React Hook for Athlete Access

```typescript
// frontend/src/hooks/useAthleteAccess.ts
import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Athlete {
  athlete_id: string;
  name: string;
  competitive_status: string;
}

export const useAthleteAccess = () => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await api.get('/athletes/me');
        const athleteData = response.data;
        
        if (athleteData.competitive_status === 'banned') {
          setHasAccess(false);
          // Redirect to access denied page
          window.location.href = '/access-denied';
        } else {
          setHasAccess(true);
          setAthlete(athleteData);
        }
      } catch (error) {
        setHasAccess(false);
      }
    };

    checkAccess();
  }, []);

  return { hasAccess, athlete };
};
```

### 2. Protected Route Component

```typescript
// frontend/src/components/ProtectedAthleteRoute.tsx
import React from 'react';
import { useAthleteAccess } from '../hooks/useAthleteAccess';
import LoadingSpinner from './LoadingSpinner';
import AccessDeniedPage from './AccessDeniedPage';

interface ProtectedAthleteRouteProps {
  children: React.ReactNode;
}

export const ProtectedAthleteRoute: React.FC<ProtectedAthleteRouteProps> = ({ children }) => {
  const { hasAccess } = useAthleteAccess();

  if (hasAccess === null) {
    return <LoadingSpinner />;
  }

  if (hasAccess === false) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
};
```

### 3. Access Denied Page

```typescript
// frontend/src/components/AccessDeniedPage.tsx
import React from 'react';

export const AccessDeniedPage: React.FC = () => {
  return (
    <div className="access-denied-page">
      <div className="access-denied-content">
        <h1>Access Denied</h1>
        <p>Your account has been suspended.</p>
        <p>Please contact the club administration for more information.</p>
        <button onClick={() => window.location.href = '/contact'}>
          Contact Support
        </button>
      </div>
    </div>
  );
};
```

## Automated Cleanup Systems

### 1. Banned Athlete Cleanup Script

```typescript
// src/scripts/cleanup-banned-athletes.ts
import Athlete from '../models/Athlete';
import TeamMembership from '../models/TeamMembership';
import SeatAssignment from '../models/SeatAssignment';
import GauntletSeatAssignment from '../models/GauntletSeatAssignment';
import LadderPosition from '../models/LadderPosition';
import RegattaRegistration from '../models/RegattaRegistration';

export class BannedAthleteCleanup {
  async cleanupBannedAthletes(): Promise<void> {
    console.log('🧹 Starting banned athlete cleanup...');
    
    const bannedAthletes = await Athlete.findAll({
      where: { competitive_status: 'banned' }
    });

    for (const athlete of bannedAthletes) {
      console.log(`🚫 Cleaning up banned athlete: ${athlete.name}`);
      
      // Remove from all teams
      await TeamMembership.destroy({
        where: { athlete_id: athlete.athlete_id }
      });

      // Remove from all lineups (set to null)
      await SeatAssignment.update(
        { athlete_id: null },
        { where: { athlete_id: athlete.athlete_id } }
      );

      // Remove from gauntlet seat assignments
      await GauntletSeatAssignment.destroy({
        where: { athlete_id: athlete.athlete_id }
      });

      // Remove from ladder positions
      await LadderPosition.destroy({
        where: { athlete_id: athlete.athlete_id }
      });

      // Cancel future regatta registrations
      await RegattaRegistration.update(
        { status: 'cancelled' },
        { 
          where: { 
            athlete_id: athlete.athlete_id,
            status: { [Op.in]: ['interested', 'committed'] }
          }
        }
      );
    }

    console.log(`✅ Cleanup completed for ${bannedAthletes.length} banned athletes`);
  }
}
```

### 2. Scheduled Cleanup

```typescript
// src/scheduler/cleanup-scheduler.ts
import cron from 'node-cron';
import { BannedAthleteCleanup } from '../scripts/cleanup-banned-athletes';

// Run cleanup daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🕐 Running scheduled banned athlete cleanup...');
  const cleanup = new BannedAthleteCleanup();
  await cleanup.cleanupBannedAthletes();
});
```

## Admin Interface Implementation

### 1. Admin Service

```typescript
// src/services/AdminService.ts
import Athlete from '../models/Athlete';
import { BannedAthleteCleanup } from '../scripts/cleanup-banned-athletes';

export class AdminService {
  async banAthlete(
    athleteId: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    const athlete = await Athlete.findByPk(athleteId);
    if (!athlete) {
      throw new Error('Athlete not found');
    }

    // Update athlete status
    await athlete.update({
      competitive_status: 'banned',
      ban_reason: reason,
      ban_date: new Date(),
      ban_notes: notes
    });

    // Trigger immediate cleanup
    const cleanup = new BannedAthleteCleanup();
    await cleanup.cleanupBannedAthletes();

    // Log the action
    console.log(`🚫 Athlete ${athlete.name} banned for: ${reason}`);
  }

  async unbanAthlete(athleteId: string): Promise<void> {
    const athlete = await Athlete.findByPk(athleteId);
    if (!athlete) {
      throw new Error('Athlete not found');
    }

    await athlete.update({
      competitive_status: 'active',
      ban_reason: null,
      ban_date: null,
      ban_notes: null
    });

    console.log(`✅ Athlete ${athlete.name} unbanned`);
  }

  async getBannedAthletes(): Promise<Athlete[]> {
    return Athlete.findAll({
      where: { competitive_status: 'banned' },
      order: [['ban_date', 'DESC']]
    });
  }
}
```

### 2. Admin API Routes

```typescript
// src/routes/admin.ts
import { Router } from 'express';
import { requireAdmin } from '../middleware/athleteAccess';
import { AdminService } from '../services/AdminService';

const router = Router();
const adminService = new AdminService();

// All admin routes require admin access
router.use(requireAdmin);

// Get banned athletes
router.get('/banned-athletes', async (req, res) => {
  const athletes = await adminService.getBannedAthletes();
  res.json(athletes);
});

// Ban athlete
router.post('/ban-athlete', async (req, res) => {
  const { athleteId, reason, notes } = req.body;
  await adminService.banAthlete(athleteId, reason, notes);
  res.json({ message: 'Athlete banned successfully' });
});

// Unban athlete
router.post('/unban-athlete', async (req, res) => {
  const { athleteId } = req.body;
  await adminService.unbanAthlete(athleteId);
  res.json({ message: 'Athlete unbanned successfully' });
});

export default router;
```

## Testing and Validation

### 1. Unit Tests

```typescript
// tests/services/TeamService.test.ts
import { TeamService } from '../../src/services/TeamService';
import Athlete from '../../src/models/Athlete';

describe('TeamService', () => {
  let teamService: TeamService;

  beforeEach(() => {
    teamService = new TeamService();
  });

  test('should exclude banned athletes from team members', async () => {
    // Mock banned athlete
    const bannedAthlete = {
      athlete_id: 'banned-uuid',
      name: 'Banned Athlete',
      competitive_status: 'banned'
    };

    // Test that banned athlete is excluded
    const teamMembers = await teamService.getTeamMembers(1);
    expect(teamMembers).not.toContainEqual(bannedAthlete);
  });
});
```

### 2. Integration Tests

```typescript
// tests/integration/access-control.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Access Control Integration', () => {
  test('should deny access to banned athlete', async () => {
    const response = await request(app)
      .get('/api/athletes/active')
      .set('Authorization', 'Bearer banned-athlete-token');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access denied');
  });
});
```

## Deployment Checklist

### 1. Database Migration

- [ ] Run migration: `npm run migrate`
- [ ] Verify new columns exist in `athletes` table
- [ ] Confirm indexes are created
- [ ] Test data migration for existing inactive athletes

### 2. Backend Deployment

- [ ] Deploy updated models and services
- [ ] Update API routes with access control middleware
- [ ] Deploy admin interface
- [ ] Set up scheduled cleanup jobs
- [ ] Test banned athlete cleanup functionality

### 3. Frontend Deployment

- [ ] Deploy updated components with access control
- [ ] Test protected routes
- [ ] Verify access denied page functionality
- [ ] Test athlete access hooks

### 4. Monitoring and Logging

- [ ] Set up logging for ban/unban actions
- [ ] Monitor cleanup job execution
- [ ] Track access denied events
- [ ] Set up alerts for failed cleanup jobs

### 5. Security Validation

- [ ] Test that banned athletes cannot access any endpoints
- [ ] Verify admin-only routes are properly protected
- [ ] Test that banned athletes are removed from all teams
- [ ] Confirm banned athletes cannot access frontend applications

## Maintenance Procedures

### 1. Regular Monitoring

- Monitor banned athlete cleanup logs
- Review access denied events
- Check for any failed cleanup operations
- Verify admin actions are properly logged

### 2. Data Integrity Checks

- Regular verification that banned athletes are excluded from active queries
- Check that team memberships are properly cleaned up
- Validate that historical data is preserved

### 3. Performance Monitoring

- Monitor query performance with new indexes
- Check for any performance impact from access control checks
- Optimize cleanup operations if needed

## Troubleshooting

### Common Issues

1. **Banned athlete still appears in team lists**
   - Check if cleanup job is running
   - Verify team membership removal
   - Check for cached data

2. **Access denied for non-banned athletes**
   - Verify competitive_status field values
   - Check authentication middleware
   - Review athlete data integrity

3. **Cleanup job failures**
   - Check database connections
   - Verify model relationships
   - Review error logs

### Support Contacts

- **Database Issues**: Database administrator
- **Application Issues**: Development team
- **Security Concerns**: Club administration

---

**Document Version**: 1.0  
**Last Updated**: October 16, 2025  
**Next Review**: January 2026
