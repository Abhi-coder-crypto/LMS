import { eq, and, desc, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from './db';
import {
  users,
  courses,
  modules,
  tasks,
  testCases,
  submissions,
  userProgress,
  achievements,
  userAchievements,
  certificates,
  type User,
  type NewUser,
  type Course,
  type NewCourse,
  type Module,
  type NewModule,
  type Task,
  type NewTask,
  type TestCase,
  type NewTestCase,
  type Submission,
  type NewSubmission,
  type UserProgress,
  type NewUserProgress,
  type Achievement,
  type UserAchievement,
  type Certificate,
  type LoginData,
  type RegisterData,
  type InsertCourse,
  type InsertModule,
  type InsertTask,
  type InsertSubmission,
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: RegisterData): Promise<User>;
  authenticateUser(loginData: LoginData): Promise<User | null>;
  updateUserXP(userId: string, xp: number): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<User[]>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | null>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Module operations
  getModulesByCourse(courseId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | null>;
  createModule(module: InsertModule): Promise<Module>;

  // Task operations
  getTasksByModule(moduleId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(task: InsertTask): Promise<Task>;

  // Test case operations
  getTestCasesByTask(taskId: string): Promise<TestCase[]>;
  getPublicTestCases(taskId: string): Promise<TestCase[]>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<void>;
  getSubmissionsByUser(userId: string, taskId?: string): Promise<Submission[]>;
  getLatestSubmission(userId: string, taskId: string): Promise<Submission | null>;

  // Progress operations
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<UserProgress[]>;
  updateProgress(userId: string, courseId: string, moduleId?: string, taskId?: string): Promise<void>;
  isTaskUnlocked(userId: string, taskId: string): Promise<boolean>;

  // Achievement operations
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;

  // Certificate operations
  createCertificate(userId: string, courseId: string): Promise<Certificate>;
  getUserCertificates(userId: string): Promise<Certificate[]>;
  verifyCertificate(certificateNumber: string): Promise<Certificate | null>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: RegisterData): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const newUser: NewUser = {
      ...userData,
      password: hashedPassword,
      role: userData.role || 'student',
    };

    const result = await db.insert(users).values(newUser).returning();
    return result[0];
  }

  async authenticateUser(loginData: LoginData): Promise<User | null> {
    // Find user by email (include password for verification)
    const result = await db.select().from(users).where(eq(users.email, loginData.email)).limit(1);
    const user = result[0];
    
    if (!user) {
      return null;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Update last login date
    await db.update(users)
      .set({ lastLoginDate: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return user;
  }

  async updateUserXP(userId: string, xp: number): Promise<void> {
    // Get current user XP first
    const currentUser = await this.getUser(userId);
    if (currentUser) {
      await db.update(users)
        .set({ 
          xp: (currentUser.xp || 0) + xp,
          updatedAt: new Date() 
        })
        .where(eq(users.id, userId));
    }
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db.update(users)
      .set({ 
        streak,
        lastLoginDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return await db.select()
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db.select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.order));
  }

  async getCourse(id: string): Promise<Course | null> {
    const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    return result[0] || null;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values(course).returning();
    return result[0];
  }

  // Module operations
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return await db.select()
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.isActive, true)))
      .orderBy(asc(modules.order));
  }

  async getModule(id: string): Promise<Module | null> {
    const result = await db.select().from(modules).where(eq(modules.id, id)).limit(1);
    return result[0] || null;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const result = await db.insert(modules).values(module).returning();
    return result[0];
  }

  // Task operations
  async getTasksByModule(moduleId: string): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(and(eq(tasks.moduleId, moduleId), eq(tasks.isActive, true)))
      .orderBy(asc(tasks.order));
  }

  async getTask(id: string): Promise<Task | null> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0] || null;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  // Test case operations
  async getTestCasesByTask(taskId: string): Promise<TestCase[]> {
    return await db.select()
      .from(testCases)
      .where(eq(testCases.taskId, taskId))
      .orderBy(asc(testCases.order));
  }

  async getPublicTestCases(taskId: string): Promise<TestCase[]> {
    return await db.select()
      .from(testCases)
      .where(and(eq(testCases.taskId, taskId), eq(testCases.isHidden, false)))
      .orderBy(asc(testCases.order));
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const result = await db.insert(submissions).values(submission).returning();
    return result[0];
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<void> {
    await db.update(submissions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(submissions.id, id));
  }

  async getSubmissionsByUser(userId: string, taskId?: string): Promise<Submission[]> {
    const conditions = [eq(submissions.userId, userId)];
    if (taskId) {
      conditions.push(eq(submissions.taskId, taskId));
    }
    
    return await db.select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.createdAt));
  }

  async getLatestSubmission(userId: string, taskId: string): Promise<Submission | null> {
    const result = await db.select()
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.taskId, taskId)))
      .orderBy(desc(submissions.createdAt))
      .limit(1);
    
    return result[0] || null;
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    return await db.select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
  }

  async updateProgress(userId: string, courseId: string, moduleId?: string, taskId?: string): Promise<void> {
    const progressData: NewUserProgress = {
      userId,
      courseId,
      moduleId: moduleId || null,
      taskId: taskId || null,
      isCompleted: true,
      completedAt: new Date(),
    };

    // Check if progress already exists
    const conditions = [
      eq(userProgress.userId, userId),
      eq(userProgress.courseId, courseId),
    ];
    
    if (moduleId) {
      conditions.push(eq(userProgress.moduleId, moduleId));
    }
    if (taskId) {
      conditions.push(eq(userProgress.taskId, taskId));
    }

    const existing = await db.select()
      .from(userProgress)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      await db.update(userProgress)
        .set({ isCompleted: true, completedAt: new Date(), updatedAt: new Date() })
        .where(eq(userProgress.id, existing[0].id));
    } else {
      await db.insert(userProgress).values(progressData);
    }
  }

  async isTaskUnlocked(userId: string, taskId: string): Promise<boolean> {
    // Get the task and its module
    const task = await this.getTask(taskId);
    if (!task) return false;

    const tasksInModule = await this.getTasksByModule(task.moduleId);
    const taskIndex = tasksInModule.findIndex(t => t.id === taskId);
    
    // First task is always unlocked
    if (taskIndex === 0) return true;

    // Check if previous task is completed
    const previousTask = tasksInModule[taskIndex - 1];
    const progress = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId),
        eq(userProgress.taskId, previousTask.id),
        eq(userProgress.isCompleted, true)
      ))
      .limit(1);

    return progress.length > 0;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db.select()
      .from(achievements)
      .where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    // Check if achievement already unlocked
    const existing = await db.select()
      .from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userAchievements).values({
        userId,
        achievementId,
      });
    }
  }

  // Certificate operations
  async createCertificate(userId: string, courseId: string): Promise<Certificate> {
    const certificateNumber = `DIGI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const verificationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify/${certificateNumber}`;

    const newCertificate = {
      userId,
      courseId,
      certificateNumber,
      verificationUrl,
    };

    const result = await db.insert(certificates).values(newCertificate).returning();
    return result[0];
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db.select()
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }

  async verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
    const result = await db.select()
      .from(certificates)
      .where(eq(certificates.certificateNumber, certificateNumber))
      .limit(1);
    
    return result[0] || null;
  }
}

export const storage = new DatabaseStorage();