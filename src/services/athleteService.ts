import { Athlete, UsraCategory } from '../models';

export interface AthleteFilters {
  active?: boolean;
  competitive_status?: 'active' | 'inactive' | 'retired' | 'banned';
  team_id?: number;
}

export interface AthleteWithUsraData {
  // Essential fields for localStorage
  id: string;
  name: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  active: boolean;
  gender?: 'M' | 'F';
  age?: number | undefined;
  birthYear?: number;
  portStarboard?: 'Starboard' | 'Prefer Starboard' | 'Either' | 'Prefer Port' | 'Port';
  sweepScull?: 'Sweep' | 'Scull' | 'Sweep & Scull';
  usraAgeCategory?: string;
  weight?: number;
  height?: number; // Height in cm - athletes can update this in their profiles
  email?: string;
  phone?: string;
  bowInDark?: boolean;
  experience?: number;
  emergencyContact?: string;
  emergencyContactPhone?: string;
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
          // 'competitive_status',
          // 'retirement_reason',
          // 'retirement_date',
          // 'ban_reason',
          // 'ban_date',
          // 'ban_notes',
          'created_at',
          'updated_at',
          // 'etl_source',
          // 'etl_last_sync'
        ],
        order: [['name', 'ASC']],
        raw: false // Keep as instances to access included data
      });

      // Transform the data to include calculated age and USRA category
      // Also map database field names to frontend field names
      const currentYear = new Date().getFullYear();
      
      return athletes.map(athlete => {
        const athleteData = athlete.toJSON() as any;
        
        return {
          // Essential fields for localStorage (mapped from database)
          id: athleteData.athlete_id, // Map athlete_id to id for frontend compatibility
          name: athleteData.name,
          type: athleteData.type,
          active: athleteData.active,
          gender: athleteData.gender,
          age: athleteData.birth_year ? currentYear - athleteData.birth_year : undefined,
          birthYear: athleteData.birth_year,
          portStarboard: athleteData.port_starboard,
          sweepScull: athleteData.sweep_scull,
          usraAgeCategory: athleteData.usra_age_category?.category || undefined,
          weight: athleteData.weight_kg,
          height: athleteData.height_cm, // Height in cm - athletes can update this in their profiles
          email: athleteData.email,
          phone: athleteData.phone,
          bowInDark: athleteData.bow_in_dark,
          experience: athleteData.experience_years,
          emergencyContact: athleteData.emergency_contact,
          emergencyContactPhone: athleteData.emergency_contact_phone
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
          // Essential fields for localStorage (mapped from database)
          id: athleteData.athlete_id, // Map athlete_id to id for frontend compatibility
          name: athleteData.name,
          type: athleteData.type,
          active: athleteData.active,
          gender: athleteData.gender,
          age: athleteData.birth_year ? currentYear - athleteData.birth_year : undefined,
          birthYear: athleteData.birth_year,
          portStarboard: athleteData.port_starboard,
          sweepScull: athleteData.sweep_scull,
          usraAgeCategory: athleteData.usra_age_category?.category || undefined,
          weight: athleteData.weight_kg,
          height: athleteData.height_cm, // Height in cm - athletes can update this in their profiles
          email: athleteData.email,
          phone: athleteData.phone,
          bowInDark: athleteData.bow_in_dark,
          experience: athleteData.experience_years,
          emergencyContact: athleteData.emergency_contact,
          emergencyContactPhone: athleteData.emergency_contact_phone
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

  /**
   * Update athlete profile data
   * Allows athletes to update their own profile information
   */
  async updateAthleteProfile(athleteId: string, updateData: Partial<AthleteWithUsraData>): Promise<AthleteWithUsraData | null> {
    try {
      // Find the athlete first
      const athlete = await Athlete.findByPk(athleteId);
      if (!athlete) {
        return null;
      }

      // Map frontend field names to database field names
      const dbUpdateData: any = {};
      
      if (updateData.height !== undefined) {
        dbUpdateData.height_cm = updateData.height;
      }
      if (updateData.weight !== undefined) {
        dbUpdateData.weight_kg = updateData.weight;
      }
      if (updateData.email !== undefined) {
        dbUpdateData.email = updateData.email;
      }
      if (updateData.phone !== undefined) {
        dbUpdateData.phone = updateData.phone;
      }
      if (updateData.emergencyContact !== undefined) {
        dbUpdateData.emergency_contact = updateData.emergencyContact;
      }
      if (updateData.emergencyContactPhone !== undefined) {
        dbUpdateData.emergency_contact_phone = updateData.emergencyContactPhone;
      }
      if (updateData.portStarboard !== undefined) {
        dbUpdateData.port_starboard = updateData.portStarboard;
      }
      if (updateData.sweepScull !== undefined) {
        dbUpdateData.sweep_scull = updateData.sweepScull;
      }
      if (updateData.bowInDark !== undefined) {
        dbUpdateData.bow_in_dark = updateData.bowInDark;
      }
      if (updateData.experience !== undefined) {
        dbUpdateData.experience_years = updateData.experience;
      }

      // Update the athlete
      await athlete.update(dbUpdateData);

      // Return the updated athlete profile
      return this.getAthleteWithUsraCategory(athleteId);

    } catch (error) {
      console.error('Error updating athlete profile:', error);
      throw new Error('Failed to update athlete profile');
    }
  }
}

export const athleteService = new AthleteService();
