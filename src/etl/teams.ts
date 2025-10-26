/**
 * Teams ETL Process
 * Creates the default team for the boathouse
 */

import { BaseETLProcess } from './base-etl';
import { ETLProcessConfig, DataTransformationResult, ETLValidationResult } from './types';
import { getModels } from '../shared';
const { Team } = getModels();

export class TeamsETL extends BaseETLProcess {
  constructor(config: Partial<ETLProcessConfig> = {}) {
    const defaultConfig: ETLProcessConfig = {
      sheetName: 'Teams',
      batchSize: 10,
      retryAttempts: 3,
      retryDelayMs: 1000,
      dryRun: false,
      primaryKey: 'team_id'
    };

    super({ ...defaultConfig, ...config });
  }

  protected getJobType(): 'full_etl' | 'incremental_etl' | 'athletes_sync' | 'boats_sync' | 'attendance_sync' {
    return 'full_etl';
  }

  /**
   * Extract Teams data (hardcoded for now)
   */
  protected async extract(): Promise<any[]> {
    console.log(`📊 Extracting teams data`);
    
    // For now, we'll create a single team for Mens Masters
    // In the future, this could be extracted from a Teams sheet
    const teamsData = [
      {
        name: 'Mens Masters',
        team_type: 'Masters',
        description: 'Advanced Mens Masters',
      },
      {
        name: "Babs",
        team_type: "Masters",
        description: "Advanced Womens Masters",
      },
      {
        name: "New Crew",
        team_type: "Masters",
        description: "Beginner Crew",
      },
      {
        name: "Intermediate Crew",
        team_type: "Masters",
        description: "Intermediate Crew",
      },
      {
        name: "Boys Varsity",
        team_type: "Youth",
        description: "Boys Varsity Crew",
      },
      {
        name: "Girls Varsity",
        team_type: "Youth",
        description: "Girls Varsity Crew",
      }
    ];

    console.log(`✅ Extracted ${teamsData.length} team records`);
    return teamsData;
  }

  /**
   * Transform Teams data
   */
  protected async transform(data: any[]): Promise<DataTransformationResult<any>> {
    console.log(`🔄 Transforming ${data.length} team records`);
    
    const transformedData: any[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const team of data) {
      try {
        const transformedTeam = {
          name: team.name,
          team_type: team.team_type,
          description: team.description,
          head_coach_id: team.head_coach_id,
          assistant_coaches: team.assistant_coaches
        };

        transformedData.push(transformedTeam);
      } catch (error) {
        const errorMsg = `Failed to transform team ${team.name}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.warn(`⚠️  ${errorMsg}`);
      }
    }

    console.log(`✅ Transformed ${transformedData.length} team records`);
    return {
      data: transformedData,
      errors,
      warnings
    };
  }

  /**
   * Validate Teams data
   */
  protected async validate(data: any[]): Promise<ETLValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const team = data[i];

      // Validate required fields
      if (!team.name || typeof team.name !== 'string') {
        errors.push(`Team ${i + 1}: Invalid name`);
      }

      // Optional fields validation
      if (team.team_type && typeof team.team_type !== 'string') {
        errors.push(`Team ${i + 1}: Invalid team_type`);
      }

      if (team.description && typeof team.description !== 'string') {
        errors.push(`Team ${i + 1}: Invalid description`);
      }

      if (team.head_coach_id && typeof team.head_coach_id !== 'string') {
        errors.push(`Team ${i + 1}: Invalid head_coach_id`);
      }

      if (team.assistant_coaches && !Array.isArray(team.assistant_coaches)) {
        errors.push(`Team ${i + 1}: Invalid assistant_coaches - must be array`);
      }

      // Validate name format (should be lowercase with hyphens)
      if (team.name && !/^[a-z0-9-]+$/.test(team.name)) {
        warnings.push(`Team ${i + 1}: Name should be lowercase with hyphens: ${team.name}`);
      }

      // Check for duplicate names
      const duplicateTeams = data.filter(t => t.name === team.name);
      if (duplicateTeams.length > 1) {
        warnings.push(`Team ${i + 1}: Duplicate team name found: ${team.name}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Load Teams data to database
   */
  protected async load(data: any[]): Promise<{ recordsCreated: number; recordsUpdated: number; recordsFailed: number }> {
    if (this.config.dryRun) {
      console.log('🔍 DRY RUN: Would load teams data');
      return { recordsCreated: data.length, recordsUpdated: 0, recordsFailed: 0 };
    }

    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    await this.processBatch(data, this.config.batchSize, async (batch: any[]) => {
      for (const teamData of batch) {
        try {
          // Check if team already exists (by name)
          const [team, created] = await Team.findOrCreate({
            where: { name: teamData.name },
            defaults: teamData
          });

          if (!created) {
            // Update existing team if needed
            const needsUpdate = 
              team.team_type !== teamData.team_type ||
              team.description !== teamData.description ||
              team.head_coach_id !== teamData.head_coach_id ||
              JSON.stringify(team.assistant_coaches) !== JSON.stringify(teamData.assistant_coaches);

            if (needsUpdate) {
              await team.update({
                team_type: teamData.team_type,
                description: teamData.description,
                head_coach_id: teamData.head_coach_id,
                assistant_coaches: teamData.assistant_coaches
              });
              recordsUpdated++;
            }
          } else {
            recordsCreated++;
          }
        } catch (error) {
          recordsFailed++;
          console.error(`❌ Failed to load team ${teamData.name}:`, error);
        }
      }
    });

    return { recordsCreated, recordsUpdated, recordsFailed };
  }
}
