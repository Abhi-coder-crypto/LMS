import {
  User,
  Course,
  Module,
  Task,
  TestCase,
  Submission,
  UserProgress,
  Achievement,
  UserAchievement,
  Certificate,
  type UpsertUser,
  type InsertCourse,
  type InsertModule,
  type InsertTask,
  type InsertSubmission,
  type UserDocument,
  type CourseDocument,
  type ModuleDocument,
  type TaskDocument,
  type SubmissionDocument,
  type LoginData,
  type RegisterData,
} from "../shared/schema"
import mongoose from "./db";
import bcrypt from 'bcryptjs';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<UserDocument | null>;
  getUserByEmail(email: string): Promise<UserDocument | null>;
  createUser(userData: RegisterData): Promise<UserDocument>;
  authenticateUser(loginData: LoginData): Promise<UserDocument | null>;
  upsertUser(user: UpsertUser): Promise<UserDocument>;
  updateUserXP(userId: string, xp: number): Promise<void>;
  updateUserStreak(userId: string, streak: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<UserDocument[]>;

  // Course operations
  getCourses(): Promise<CourseDocument[]>;
  getCourse(id: string): Promise<CourseDocument | null>;
  createCourse(course: InsertCourse): Promise<CourseDocument>;

  // Module operations
  getModulesByCourse(courseId: string): Promise<ModuleDocument[]>;
  getModule(id: string): Promise<ModuleDocument | null>;
  createModule(module: InsertModule): Promise<ModuleDocument>;

  // Task operations
  getTasksByModule(moduleId: string): Promise<TaskDocument[]>;
  getTask(id: string): Promise<TaskDocument | null>;
  createTask(task: InsertTask): Promise<TaskDocument>;

  // Test case operations
  getTestCasesByTask(taskId: string): Promise<any[]>;
  getPublicTestCases(taskId: string): Promise<any[]>;

  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<SubmissionDocument>;
  updateSubmission(id: string, updates: Partial<any>): Promise<void>;
  getSubmissionsByUser(userId: string, taskId?: string): Promise<SubmissionDocument[]>;
  getLatestSubmission(userId: string, taskId: string): Promise<SubmissionDocument | null>;

  // Progress operations
  getUserProgress(userId: string): Promise<any[]>;
  getUserCourseProgress(userId: string, courseId: string): Promise<any[]>;
  updateProgress(userId: string, courseId: string, moduleId?: string, taskId?: string): Promise<void>;
  isTaskUnlocked(userId: string, taskId: string): Promise<boolean>;

  // Achievement operations
  getAchievements(): Promise<any[]>;
  getUserAchievements(userId: string): Promise<any[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;

  // Certificate operations
  createCertificate(userId: string, courseId: string): Promise<any>;
  getUserCertificates(userId: string): Promise<any[]>;
  verifyCertificate(certificateNumber: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<UserDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await User.findById(id).select('-password');
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return await User.findOne({ email });
  }

  async createUser(userData: RegisterData): Promise<UserDocument> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = new User({
      ...userData,
      password: hashedPassword,
      role: userData.role || 'student'
    });

    const savedUser = await user.save();
    
    // Return user without password
    const userObject = savedUser.toObject();
    delete userObject.password;
    return userObject as UserDocument;
  }

  async authenticateUser(loginData: LoginData): Promise<UserDocument | null> {
    // Find user by email
    const user = await this.getUserByEmail(loginData.email);
    if (!user) {
      return null;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    // Update last login date
    user.lastLoginDate = new Date();
    await user.save();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;
    return userObject as UserDocument;
  }

  async upsertUser(userData: UpsertUser): Promise<UserDocument> {
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      { ...userData, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return user!;
  }

  async updateUserXP(userId: string, xp: number): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    await User.findByIdAndUpdate(userId, {
      $inc: { xp },
      updatedAt: new Date()
    });
  }

  async updateUserStreak(userId: string, streak: number): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }
    await User.findByIdAndUpdate(userId, {
      streak,
      lastLoginDate: new Date(),
      updatedAt: new Date()
    });
  }

  async getLeaderboard(limit = 10): Promise<UserDocument[]> {
    return await User.find()
      .sort({ xp: -1 })
      .limit(limit);
  }

  // Course operations
  async getCourses(): Promise<CourseDocument[]> {
    return await Course.find({ isActive: true })
      .sort({ order: 1 });
  }

  async getCourse(id: string): Promise<CourseDocument | null> {
    return await Course.findById(id);
  }

  async createCourse(course: InsertCourse): Promise<CourseDocument> {
    const newCourse = new Course(course);
    return await newCourse.save();
  }

  // Module operations
  async getModulesByCourse(courseId: string): Promise<ModuleDocument[]> {
    return await Module.find({ 
      courseId: new mongoose.Types.ObjectId(courseId), 
      isActive: true 
    }).sort({ order: 1 });
  }

  async getModule(id: string): Promise<ModuleDocument | null> {
    return await Module.findById(id);
  }

  async createModule(module: InsertModule): Promise<ModuleDocument> {
    const newModule = new Module({
      ...module,
      courseId: new mongoose.Types.ObjectId(module.courseId)
    });
    return await newModule.save();
  }

  // Task operations
  async getTasksByModule(moduleId: string): Promise<TaskDocument[]> {
    return await Task.find({ 
      moduleId: new mongoose.Types.ObjectId(moduleId), 
      isActive: true 
    }).sort({ order: 1 });
  }

  async getTask(id: string): Promise<TaskDocument | null> {
    return await Task.findById(id);
  }

  async createTask(task: InsertTask): Promise<TaskDocument> {
    const newTask = new Task({
      ...task,
      moduleId: new mongoose.Types.ObjectId(task.moduleId)
    });
    return await newTask.save();
  }

  // Test case operations
  async getTestCasesByTask(taskId: string): Promise<any[]> {
    return await TestCase.find({ 
      taskId: new mongoose.Types.ObjectId(taskId) 
    }).sort({ order: 1 });
  }

  async getPublicTestCases(taskId: string): Promise<any[]> {
    return await TestCase.find({ 
      taskId: new mongoose.Types.ObjectId(taskId), 
      isHidden: false 
    }).sort({ order: 1 });
  }

  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<SubmissionDocument> {
    const newSubmission = new Submission({
      ...submission,
      userId: new mongoose.Types.ObjectId(submission.userId),
      taskId: new mongoose.Types.ObjectId(submission.taskId)
    });
    return await newSubmission.save();
  }

  async updateSubmission(id: string, updates: Partial<any>): Promise<void> {
    await Submission.findByIdAndUpdate(id, updates);
  }

  async getSubmissionsByUser(userId: string, taskId?: string): Promise<SubmissionDocument[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      filter.taskId = new mongoose.Types.ObjectId(taskId);
    }
    
    return await Submission.find(filter)
      .sort({ createdAt: -1 });
  }

  async getLatestSubmission(userId: string, taskId: string): Promise<SubmissionDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(taskId)) {
      return null;
    }
    return await Submission.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      taskId: new mongoose.Types.ObjectId(taskId)
    }).sort({ createdAt: -1 });
  }

  // Progress operations
  async getUserProgress(userId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    return await UserProgress.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    });
  }

  async getUserCourseProgress(userId: string, courseId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return [];
    }
    return await UserProgress.find({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId)
    });
  }

  async updateProgress(userId: string, courseId: string, moduleId?: string, taskId?: string): Promise<void> {
    const progressData: any = {
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      isCompleted: true,
      completedAt: new Date(),
    };

    if (moduleId) {
      progressData.moduleId = new mongoose.Types.ObjectId(moduleId);
    }
    if (taskId) {
      progressData.taskId = new mongoose.Types.ObjectId(taskId);
    }

    await UserProgress.findOneAndUpdate(
      {
        userId: progressData.userId,
        courseId: progressData.courseId,
        moduleId: progressData.moduleId || null,
        taskId: progressData.taskId || null,
      },
      progressData,
      { upsert: true }
    );
  }

  async isTaskUnlocked(userId: string, taskId: string): Promise<boolean> {
    // Get the task and its module
    const task = await this.getTask(taskId);
    if (!task) return false;

    const tasksInModule = await this.getTasksByModule(task.moduleId.toString());
    const taskIndex = tasksInModule.findIndex(t => t._id.toString() === taskId);
    
    // First task is always unlocked
    if (taskIndex === 0) return true;

    // Check if previous task is completed
    const previousTask = tasksInModule[taskIndex - 1];
    const progress = await UserProgress.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      taskId: previousTask._id,
      isCompleted: true
    });

    return !!progress;
  }

  // Achievement operations
  async getAchievements(): Promise<any[]> {
    return await Achievement.find({ isActive: true });
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    return await UserAchievement.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    })
    .populate('achievementId')
    .sort({ unlockedAt: -1 });
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    const existing = await UserAchievement.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      achievementId: new mongoose.Types.ObjectId(achievementId)
    });

    if (!existing) {
      const userAchievement = new UserAchievement({
        userId: new mongoose.Types.ObjectId(userId),
        achievementId: new mongoose.Types.ObjectId(achievementId)
      });
      await userAchievement.save();
    }
  }

  // Certificate operations
  async createCertificate(userId: string, courseId: string): Promise<any> {
    const certificateNumber = `DIGI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const verificationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/verify/${certificateNumber}`;

    const certificate = new Certificate({
      userId: new mongoose.Types.ObjectId(userId),
      courseId: new mongoose.Types.ObjectId(courseId),
      certificateNumber,
      verificationUrl,
    });

    return await certificate.save();
  }

  async getUserCertificates(userId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }
    return await Certificate.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    })
    .populate('courseId')
    .sort({ issuedAt: -1 });
  }

  async verifyCertificate(certificateNumber: string): Promise<any> {
    return await Certificate.findOne({ certificateNumber })
      .populate('userId')
      .populate('courseId');
  }
}

export const storage = new DatabaseStorage();