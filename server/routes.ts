import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth"; // DISABLED
import { judge0Service } from "./services/judge0";
import { certificateService } from "./services/certificate";
import { 
  insertSubmissionSchema,
  insertCourseSchema,
  insertModuleSchema,
  insertTaskSchema,
  loginSchema,
  registerSchema
} from "@shared/schema";
import { z } from "zod";
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

// Extend session data type
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  req.userId = req.session.userId;
  next();
};

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.userId = req.session.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // PostgreSQL session store
  const PgSession = pgSession(session);
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pgPool,
      tableName: 'sessions',
      createTableIfMissing: true
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Create session
      req.session.userId = user.id;
      
      res.status(201).json({ 
        message: 'Registration successful', 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          xp: user.xp
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: 'Registration failed' });
      }
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const loginData = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(loginData);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      // Create session
      req.session.userId = user.id;
      
      res.json({ 
        message: 'Login successful', 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          xp: user.xp
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/user', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        xp: user.xp,
        streak: user.streak
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Admin registration route (for creating admin accounts)
  app.post('/api/auth/admin/register', requireAdmin, async (req, res) => {
    try {
      const userData = registerSchema.parse({ ...req.body, role: 'admin' });
      const user = await storage.createUser(userData);
      
      res.status(201).json({ 
        message: 'Admin registration successful', 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Admin registration error:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: 'Admin registration failed' });
      }
    }
  });

  // Route to create first admin (only if no admins exist)
  app.post('/api/auth/setup-admin', async (req, res) => {
    try {
      // Check if any admin users exist
      const existingAdmin = await storage.getUserByEmail('admin@digitiohub.com');
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin setup already completed' });
      }

      const adminData = registerSchema.parse({
        email: 'admin@digitiohub.com',
        password: 'admin123456', // Should be changed after first login
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      });
      
      const admin = await storage.createUser(adminData);
      
      res.status(201).json({ 
        message: 'Admin setup successful. Please change the default password.', 
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('Admin setup error:', error);
      res.status(400).json({ message: 'Admin setup failed' });
    }
  });

  // Dashboard data
  app.get('/api/dashboard', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      const [user, courses, userProgress, userAchievements, certificates] = await Promise.all([
        storage.getUser(userId),
        storage.getCourses(),
        storage.getUserProgress(userId),
        storage.getUserAchievements(userId),
        storage.getUserCertificates(userId)
      ]);

      // Get current course progress
      const currentCourse = courses.find((course) => {
        const courseProgress = userProgress.filter((p) => p.courseId === course.id);
        return courseProgress.length > 0 && courseProgress.length < (course.totalModules || 0);
      });

      res.json({
        user,
        courses,
        currentCourse,
        userProgress,
        achievements: userAchievements,
        certificates
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Course routes
  app.get('/api/courses', async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/courses/:id', async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      const modules = await storage.getModulesByCourse(course.id);
      res.json({ ...course, modules });
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/courses', requireAdmin, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      res.status(400).json({ message: "Failed to create course" });
    }
  });

  // Module routes
  app.get('/api/courses/:courseId/modules', async (req, res) => {
    try {
      const modules = await storage.getModulesByCourse(req.params.courseId);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get('/api/modules/:id', async (req, res) => {
    try {
      const module = await storage.getModule(req.params.id);
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      const tasks = await storage.getTasksByModule(module.id);
      res.json({ ...module, tasks });
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.post('/api/modules', requireAdmin, async (req, res) => {
    try {
      const moduleData = insertModuleSchema.parse(req.body);
      const module = await storage.createModule(moduleData);
      res.status(201).json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(400).json({ message: "Failed to create module" });
    }
  });

  // Task routes
  app.get('/api/modules/:moduleId/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const tasks = await storage.getTasksByModule(req.params.moduleId);
      
      // Check which tasks are unlocked for the user
      const tasksWithStatus = await Promise.all(
        tasks.map(async (task) => {
          const isUnlocked = await storage.isTaskUnlocked(userId, task.id);
          const latestSubmission = await storage.getLatestSubmission(userId, task.id);
          
          return {
            ...task,
            isUnlocked,
            isCompleted: latestSubmission?.status === 'accepted',
            bestSubmission: latestSubmission
          };
        })
      );
      
      res.json(tasksWithStatus);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const task = await storage.getTask(req.params.id);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Check if task is unlocked
      const isUnlocked = await storage.isTaskUnlocked(userId, task.id);
      if (!isUnlocked) {
        return res.status(403).json({ message: "Task is locked" });
      }

      const testCases = await storage.getPublicTestCases(task.id);
      const userSubmissions = await storage.getSubmissionsByUser(userId, task.id);
      
      res.json({
        ...task,
        testCases,
        submissions: userSubmissions
      });
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', requireAdmin, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  // Submission routes
  app.post('/api/tasks/:taskId/submit', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const taskId = req.params.taskId;
      
      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        userId,
        taskId
      });

      // Check if task is unlocked
      const isUnlocked = await storage.isTaskUnlocked(userId, taskId);
      if (!isUnlocked) {
        return res.status(403).json({ message: "Task is locked" });
      }

      // Get task and test cases
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const testCases = await storage.getTestCasesByTask(taskId);
      
      // Create initial submission
      const submission = await storage.createSubmission(submissionData);

      // Execute code with Judge0
      try {
        const testCaseData = testCases.map(tc => ({
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || ''
        }));

        const result = await judge0Service.executeWithTestCases(
          submissionData.code,
          submissionData.language || 'java',
          testCaseData,
          task.timeLimit || 30,
          task.memoryLimit || 256
        );

        // Update submission with results
        const status = result.totalPassed === result.totalTests ? 'accepted' : 'wrong_answer';
        
        await storage.updateSubmission(submission.id, {
          status,
          testCasesPassed: result.totalPassed,
          totalTestCases: result.totalTests,
        });

        // If accepted, update progress and award XP
        if (status === 'accepted') {
          await storage.updateProgress(userId, task.moduleId.toString(), task.moduleId.toString(), taskId);
          await storage.updateUserXP(userId, task.xpReward || 50);
          
          // Check for achievements
          await checkTaskCompletionAchievements(userId);
        }

        res.json({
          submission: { ...submission, status, testCasesPassed: result.totalPassed },
          results: result.results,
          totalPassed: result.totalPassed,
          totalTests: result.totalTests
        });

      } catch (judgeError) {
        console.error("Judge0 execution error:", judgeError);
        
        await storage.updateSubmission(submission.id, {
          status: 'compilation_error'
        });

        res.status(400).json({
          message: "Code execution failed",
          error: (judgeError as Error).message
        });
      }

    } catch (error) {
      console.error("Error submitting code:", error);
      res.status(400).json({ message: "Failed to submit code" });
    }
  });

  // Progress routes
  app.get('/api/progress', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Achievement routes
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  app.get('/api/achievements/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const userAchievements = await storage.getUserAchievements(userId);
      res.json(userAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Certificate routes
  app.post('/api/certificates/generate/:courseId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const courseId = req.params.courseId;
      
      const certificateNumber = await certificateService.generateCertificate(userId, courseId);
      res.json({ certificateNumber });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get('/api/certificates/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const certificates = await storage.getUserCertificates(userId);
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.get('/verify/:certificateNumber', async (req, res) => {
    try {
      const certificate = await certificateService.verifyCertificate(req.params.certificateNumber);
      
      if (!certificate) {
        return res.status(404).send('Certificate not found');
      }

      const html = certificateService.generateCertificateHTML(certificate);
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error verifying certificate:", error);
      res.status(500).send('Error verifying certificate');
    }
  });

  // Helper function to check task completion achievements
  async function checkTaskCompletionAchievements(userId: string) {
    const userProgress = await storage.getUserProgress(userId);
    const completedTasks = userProgress.filter(p => p.taskId && p.isCompleted).length;
    
    const achievements = await storage.getAchievements();
    
    // Check for milestone achievements
    const milestones = [1, 5, 10, 25, 50, 100];
    for (const milestone of milestones) {
      if (completedTasks >= milestone) {
        const achievement = achievements.find(a => 
          a.name.toLowerCase().includes('task') && 
          a.name.includes(milestone.toString())
        );
        
        if (achievement) {
          try {
            await storage.unlockAchievement(userId, achievement.id);
            if (achievement.xpReward) {
              await storage.updateUserXP(userId, achievement.xpReward);
            }
          } catch (error) {
            // Achievement might already be unlocked
          }
        }
      }
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}