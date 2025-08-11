import Database from '../db/database';
import { User, FamilyGroup } from '../types/api';

export class UserService {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Get all users with family group information
   */
  async getAllUsers(): Promise<User[]> {
    const users = await this.db.all(`
      SELECT 
        u.*,
        fg.name as family_group_name
      FROM users u
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      ORDER BY fg.name, u.name
    `);

    return users;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    const user = await this.db.get(`
      SELECT 
        u.*,
        fg.name as family_group_name
      FROM users u
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      WHERE u.id = ?
    `, [id]);

    return user || null;
  }

  /**
   * Get user by name
   */
  async getUserByName(name: string): Promise<User | null> {
    const user = await this.db.get(`
      SELECT 
        u.*,
        fg.name as family_group_name
      FROM users u
      LEFT JOIN family_groups fg ON u.family_group_id = fg.id
      WHERE u.name = ?
    `, [name]);

    return user || null;
  }

  /**
   * Get all family groups with member counts
   */
  async getAllFamilyGroups(): Promise<FamilyGroup[]> {
    const groups = await this.db.all(`
      SELECT 
        fg.*,
        COUNT(u.id) as member_count
      FROM family_groups fg
      LEFT JOIN users u ON fg.id = u.family_group_id
      GROUP BY fg.id
      ORDER BY fg.name
    `);

    return groups;
  }

  /**
   * Get family group by ID with members
   */
  async getFamilyGroupById(id: number): Promise<FamilyGroup | null> {
    const group = await this.db.get(`
      SELECT fg.* FROM family_groups fg WHERE fg.id = ?
    `, [id]);

    if (!group) return null;

    const members = await this.db.all(`
      SELECT u.* FROM users u WHERE u.family_group_id = ?
      ORDER BY u.name
    `, [id]);

    return {
      ...group,
      members,
      member_count: members.length
    };
  }

  /**
   * Get users that a specific user can tip for
   * - Users can tip for themselves and their family group members
   * - Admins can tip for anyone
   */
  async getUsersCanTipFor(userId: number): Promise<User[]> {
    const user = await this.getUserById(userId);
    if (!user) return [];

    if (user.role === 'admin') {
      // Admins can tip for anyone
      return await this.getAllUsers();
    } else {
      // Regular users can tip for their family group
      return await this.db.all(`
        SELECT 
          u.*,
          fg.name as family_group_name
        FROM users u
        LEFT JOIN family_groups fg ON u.family_group_id = fg.id
        WHERE u.family_group_id = ?
        ORDER BY u.name
      `, [user.family_group_id]);
    }
  }

  /**
   * Check if user can tip for another user
   */
  async canUserTipFor(userId: number, targetUserId: number): Promise<boolean> {
    if (userId === targetUserId) return true; // Can always tip for self

    const user = await this.getUserById(userId);
    const targetUser = await this.getUserById(targetUserId);

    if (!user || !targetUser) return false;

    // Admins can tip for anyone
    if (user.role === 'admin') return true;

    // Users can tip for family group members
    return user.family_group_id === targetUser.family_group_id;
  }

  /**
   * Create a new user
   */
  async createUser(name: string, familyGroupId: number, email?: string, role: 'user' | 'admin' = 'user'): Promise<User> {
    const result = await this.db.run(`
      INSERT INTO users (name, email, family_group_id, role)
      VALUES (?, ?, ?, ?)
    `, [name, email, familyGroupId, role]);

    if (!result.lastID) {
      throw new Error('Failed to create user');
    }

    const newUser = await this.getUserById(result.lastID);
    if (!newUser) {
      throw new Error('Failed to retrieve created user');
    }

    return newUser;
  }

  /**
   * Update user
   */
  async updateUser(id: number, updates: Partial<Pick<User, 'name' | 'email' | 'family_group_id' | 'role'>>): Promise<User> {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.family_group_id !== undefined) {
      fields.push('family_group_id = ?');
      values.push(updates.family_group_id);
    }
    if (updates.role !== undefined) {
      fields.push('role = ?');
      values.push(updates.role);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    await this.db.run(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `, values);

    const updatedUser = await this.getUserById(id);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }

    return updatedUser;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: number, year?: number): Promise<any> {
    const whereClause = year ? 'WHERE year = ?' : '';
    const params = year ? [userId, year] : [userId];

    const stats = await this.db.get(`
      SELECT 
        COUNT(t.id) as total_tips,
        COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) as correct_tips,
        ROUND(
          CAST(COUNT(CASE WHEN t.is_correct = 1 THEN 1 END) AS FLOAT) / 
          NULLIF(COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END), 0) * 100, 2
        ) as percentage,
        COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) as completed_tips
      FROM tips t
      LEFT JOIN rounds r ON t.round_id = r.id
      WHERE t.user_id = ? ${year ? 'AND r.year = ?' : ''}
    `, params);

    return stats;
  }
}

export default UserService;