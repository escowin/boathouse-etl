import { Athlete, UsraCategory } from '../models';

export interface AthleteFilters {
  active?: boolean;
  competitive_status?: 'active' | 'inactive' | 'retired' | 'banned';
  team_id?: number;
}

export interface AthleteWithUsraData {
  athlete_id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  gender?: 'M' | 'F';
  birth_year?: number;
  age?: number;
  sweep_scull?: 'Sweep' | 'Scull' | 'Sweep & Scull';
  port_starboard?: 'Starboard' | 'Prefer Starboard' | 'Either' | 'Prefer Port' | 'Port';
  bow_in_dark?: boolean;
  weight_kg?: number;
  height_cm?: number;
  experience_years?: number;
  usra_age_category_id?: number;
  usra_category?: string;
  us_rowing_number?: string;
  emergency_contact?: string;
  emergency_contact_phone?: string;
  active: boolean;
  competitive_status: 'active' | 'inactive' | 'retired' | 'banned';
  retirement_reason?: 'deceased' | 'transferred' | 'graduated' | 'personal' | 'unknown';
  retirement_date?: Date;
  ban_reason?: 'misconduct' | 'safety_violation' | 'harassment' | 'other';
  ban_date?: Date;
  ban_notes?: string;
  created_at: Date;
  updated_at: Date;
  etl_source: string;
  etl_last_sync: Date;
}

export class AthleteService {
  /**
   * Get athletes with USRA category data joined from the database
   * This reduces complexity for user-facing apps by pre-joining the data
   */
  async getAthletesWithUsraCategories(filters?: AthleteFilters): Promise<AthleteWithUsraData[]> {
    try {
      const whereClause: any = {};
      
      if (filters?.active !== undefined) {
        whereClause.active = filters.active;
      }
      
      if (filters?.competitive_status) {
        whereClause.competitive_status = filters.competitive_status;
      }

      const athletes = await Athlete.findAll({
        where: whereClause,
        include: [{
          model: UsraCategory,
          as: 'usra_age_category',
          required: false, // LEFT JOIN to include athletes without USRA categories
          attributes: ['category']
        }],
        attributes: [
          'athlete_id',
          'name',
          'email',
          'phone',
          'type',
          'gender',
          'birth_year',
          'sweep_scull',
          'port_starboard',
          'bow_in_dark',
          'weight_kg',
          'height_cm',
          'experience_years',
          'usra_age_category_id',
          'us_rowing_number',
          'emergency_contact',
          'emergency_contact_phone',
          'active',
          'competitive_status',
          'retirement_reason',
          'retirement_date',
          'ban_reason',
          'ban_date',
          'ban_notes',
          'created_at',
          'updated_at',
          'etl_source',
          'etl_last_sync'
        ],
        order: [['name', 'ASC']],
        raw: false // Keep as instances to access included data
      });

      // Transform the data to include calculated age and USRA category
      const currentYear = new Date().getFullYear();
      
      return athletes.map(athlete => {
        const athleteData = athlete.toJSON() as any;
        
        return {
          ...athleteData,
          age: athleteData.birth_year ? currentYear - athleteData.birth_year : undefined,
          usra_category: athleteData.usra_age_category?.category || undefined
        };
      });

    } catch (error) {
      console.error('Error fetching athletes with USRA categories:', error);
      throw new Error('Failed to fetch athletes with USRA categories');
    }
  }

  /**
   * Get a single athlete with USRA category data
   */
  async getAthleteWithUsraCategory(athleteId: string): Promise<AthleteWithUsraData | null> {
    try {
      const athlete = await Athlete.findByPk(athleteId, {
        include: [{
          model: UsraCategory,
          as: 'usra_age_category',
          required: false, // LEFT JOIN
          attributes: ['category']
        }],
        attributes: [
          'athlete_id',
          'name',
          'email',
          'phone',
          'type',
          'gender',
          'birth_year',
          'sweep_scull',
          'port_starboard',
          'bow_in_dark',
          'weight_kg',
          'height_cm',
          'experience_years',
          'usra_age_category_id',
          'us_rowing_number',
          'emergency_contact',
          'emergency_contact_phone',
          'active',
          'competitive_status',
          'retirement_reason',
          'retirement_date',
          'ban_reason',
          'ban_date',
          'ban_notes',
          'created_at',
          'updated_at',
          'etl_source',
          'etl_last_sync'
        ],
        raw: false
      });

      if (!athlete) {
        return null;
      }

      const athleteData = athlete.toJSON() as any;
      const currentYear = new Date().getFullYear();

      return {
        ...athleteData,
        age: athleteData.birth_year ? currentYear - athleteData.birth_year : undefined,
        usra_category: athleteData.usra_age_category?.category || undefined
      };

    } catch (error) {
      console.error('Error fetching athlete with USRA category:', error);
      throw new Error('Failed to fetch athlete with USRA category');
    }
  }

  /**
   * Get athletes for IndexedDB storage (limited data for team management)
   * This is optimized for the frontend's IndexedDB storage needs
   */
  async getAthletesForIndexedDB(): Promise<AthleteWithUsraData[]> {
    return this.getAthletesWithUsraCategories({
      active: true,
      competitive_status: 'active'
    });
  }

  /**
   * Get complete profile data for a logged-in user
   * Returns full profile with contact details for local storage
   */
  async getCompleteAthleteProfile(athleteId: string): Promise<AthleteWithUsraData | null> {
    return this.getAthleteWithUsraCategory(athleteId);
  }
}

export const athleteService = new AthleteService();
