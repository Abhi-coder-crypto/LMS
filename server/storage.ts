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
  type UpsertUser,
  type Course,
  type Module,
  type Task,
  type TestCase,
  type Submission,
  type UserProgress,
  type Achievement,
  type UserAchievement,
  type Certificate,
  type InsertCourse,
  type InsertModule,
  type InsertTask,
  type InsertSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserXP(userId: string, xp: number): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<User[]>;

  // Course operations
  getCourses(): Promise<Course[]>;
  getCourse(id: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;

  // Module operations
  getModulesByCourse(courseId: string): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  createModule(module: InsertModule): Promise<Module>;

  // Task operations
  getTasksByModule(moduleId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;

  // Test case operations
  getTestCasesByTask(taskId: string): Promise<TestCase[]>;
  getPublicTestCases(taskId: string): Promise<TestCase[]>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Submission>): Promise<void>;
  getSubmissionsByUser(userId: string, taskId?: string): Promise<Submission[]>;
  getLatestSubmission(userId: string, taskId: string): Promise<Submission | undefined>;

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
  verifyCertificate(certificateNumber: string): Promise<Certificate | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserXP(userId: string, xp: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        xp: sql`${users.xp} + ${xp}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        streak,
        lastLoginDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  // Course operations
  async getCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.isActive, true))
      .orderBy(asc(courses.order));
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  // Module operations
  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return await db
      .select()
      .from(modules)
      .where(and(eq(modules.courseId, courseId), eq(modules.isActive, true)))
      .orderBy(asc(modules.order));
  }

  async getModule(id: string): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  async createModule(module: InsertModule): Promise<Module> {
    const [newModule] = await db.insert(modules).values(module).returning();
    return newModule;
  }

  // Task operations
  async getTasksByModule(moduleId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.moduleId, moduleId), eq(tasks.isActive, true)))
      .orderBy(asc(tasks.order));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  // Test case operations
  async getTestCasesByTask(taskId: string): Promise<TestCase[]> {
    return await db
      .select()
      .from(testCases)
      .where(eq(testCases.taskId, taskId))
      .orderBy(asc(testCases.order));
  }

  async getPublicTestCases(taskId: string): Promise<TestCase[]> {
    return await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.taskId, taskId), eq(testCases.isHidden, false)))
      .orderBy(asc(testCases.order));
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<Submission>): Promise<void> {
    await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id));
  }

  async getSubmissionsByUser(userId: string, taskId?: string): Promise<Submission[]> {
    const conditions = [eq(submissions.userId, userId)];
    if (taskId) {
      conditions.push(eq(submissions.taskId, taskId));
    }
    
    return await db
      .select()
      .from(submissions)
      .where(and(...conditions))
      .orderBy(desc(submissions.createdAt));
  }

  async getLatestSubmission(userId: string, taskId: string): Promise<Submission | undefined> {
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.userId, userId), eq(submissions.taskId, taskId)))
      .orderBy(desc(submissions.createdAt))
      .limit(1);
    return submission;
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.courseId, courseId)));
  }

  async updateProgress(userId: string, courseId: string, moduleId?: string, taskId?: string): Promise<void> {
    const progressData = {
      userId,
      courseId,
      moduleId,
      taskId,
      isCompleted: true,
      completedAt: new Date(),
    };

    await db
      .insert(userProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.courseId, userProgress.moduleId, userProgress.taskId],
        set: {
          isCompleted: true,
          completedAt: new Date(),
        },
      });
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
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.taskId, previousTask.id),
          eq(userProgress.isCompleted, true)
        )
      );

    return !!progress;
  }

  // Achievement operations
  async getAchievements(): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.isActive, true));
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        achievement: achievements,
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .onConflictDoNothing();
  }

  // Certificate operations
  async createCertificate(userId: string, courseId: string): Promise<Certificate> {
    const certificateNumber = `DIGI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const verificationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify/${certificateNumber}`;

    const [certificate] = await db
      .insert(certificates)
      .values({
        userId,
        courseId,
        certificateNumber,
        verificationUrl,
      })
      .returning();

    return certificate;
  }

  async getUserCertificates(userId: string): Promise<Certificate[]> {
    return await db
      .select({
        id: certificates.id,
        userId: certificates.userId,
        courseId: certificates.courseId,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        verificationUrl: certificates.verificationUrl,
        course: courses,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.userId, userId))
      .orderBy(desc(certificates.issuedAt));
  }

  async verifyCertificate(certificateNumber: string): Promise<Certificate | undefined> {
    const [certificate] = await db
      .select({
        id: certificates.id,
        userId: certificates.userId,
        courseId: certificates.courseId,
        certificateNumber: certificates.certificateNumber,
        issuedAt: certificates.issuedAt,
        verificationUrl: certificates.verificationUrl,
        user: users,
        course: courses,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.certificateNumber, certificateNumber));

    return certificate;
  }
}

export const storage = new DatabaseStorage();
