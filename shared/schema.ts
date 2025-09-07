import mongoose from 'mongoose';
import { z } from 'zod';

// Session schema for session storage
const sessionSchema = new mongoose.Schema({
  sid: { type: String, required: true, unique: true },
  sess: { type: mongoose.Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true }
}, {
  timestamps: false
});

sessionSchema.index({ expire: 1 });

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  firstName: String,
  lastName: String,
  profileImageUrl: String,
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastLoginDate: Date,
}, {
  timestamps: true
});

// Course schema
const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true 
  },
  order: { type: Number, required: true },
  totalModules: { type: Number, default: 0 },
  xpReward: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Module schema
const moduleSchema = new mongoose.Schema({
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  content: String, // HTML content or markdown
  order: { type: Number, required: true },
  xpReward: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Task schema
const taskSchema = new mongoose.Schema({
  moduleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module', 
    required: true 
  },
  title: { type: String, required: true },
  description: String,
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true 
  },
  starterCode: String,
  solution: String,
  xpReward: { type: Number, default: 0 },
  timeLimit: { type: Number, default: 30 }, // seconds
  memoryLimit: { type: Number, default: 256 }, // MB
  order: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// Test case schema
const testCaseSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  input: String,
  expectedOutput: String,
  isHidden: { type: Boolean, default: false },
  order: { type: Number, required: true },
}, {
  timestamps: true
});

// User progress schema
const userProgressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  moduleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Module' 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task' 
  },
  isCompleted: { type: Boolean, default: false },
  completedAt: Date,
}, {
  timestamps: true
});

// Submission schema
const submissionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    required: true 
  },
  code: { type: String, required: true },
  language: { type: String, default: 'java' },
  status: String, // accepted, wrong_answer, time_limit_exceeded, etc.
  executionTime: { type: mongoose.Schema.Types.Decimal128 },
  memoryUsed: Number,
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  judge0Token: String,
}, {
  timestamps: true
});

// Achievement schema
const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  icon: String, // Font Awesome icon class
  xpReward: { type: Number, default: 0 },
  condition: String, // JSON string describing unlock condition
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true
});

// User achievement schema
const userAchievementSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  achievementId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Achievement', 
    required: true 
  },
  unlockedAt: { type: Date, default: Date.now },
});

// Certificate schema
const certificateSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  certificateNumber: { type: String, unique: true, required: true },
  issuedAt: { type: Date, default: Date.now },
  verificationUrl: String,
});

// Create models
export const Session = mongoose.model('Session', sessionSchema);
export const User = mongoose.model('User', userSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Module = mongoose.model('Module', moduleSchema);
export const Task = mongoose.model('Task', taskSchema);
export const TestCase = mongoose.model('TestCase', testCaseSchema);
export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
export const Submission = mongoose.model('Submission', submissionSchema);
export const Achievement = mongoose.model('Achievement', achievementSchema);
export const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
export const Certificate = mongoose.model('Certificate', certificateSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
  xp: z.number().min(0).optional(),
  streak: z.number().min(0).optional(),
  lastLoginDate: z.date().optional(),
});

export const insertCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  order: z.number().min(0),
  totalModules: z.number().min(0).optional(),
  xpReward: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const insertModuleSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number().min(0),
  xpReward: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const insertTaskSchema = z.object({
  moduleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  title: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  starterCode: z.string().optional(),
  solution: z.string().optional(),
  xpReward: z.number().min(0).optional(),
  timeLimit: z.number().min(1).optional(),
  memoryLimit: z.number().min(1).optional(),
  order: z.number().min(0),
  isActive: z.boolean().optional(),
});

export const insertSubmissionSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  code: z.string().min(1),
  language: z.string().optional(),
  status: z.string().optional(),
  executionTime: z.number().optional(),
  memoryUsed: z.number().optional(),
  testCasesPassed: z.number().min(0).optional(),
  totalTestCases: z.number().min(0).optional(),
  judge0Token: z.string().optional(),
});

export const insertTestCaseSchema = z.object({
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  input: z.string().optional(),
  expectedOutput: z.string().optional(),
  isHidden: z.boolean().optional(),
  order: z.number().min(0),
});

export const insertAchievementSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  xpReward: z.number().min(0).optional(),
  condition: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertUserAchievementSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  achievementId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  unlockedAt: z.date().optional(),
});

export const insertCertificateSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  certificateNumber: z.string().min(1),
  issuedAt: z.date().optional(),
  verificationUrl: z.string().url().optional(),
});

export const insertUserProgressSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  moduleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional(),
  taskId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional(),
  isCompleted: z.boolean().optional(),
  completedAt: z.date().optional(),
});

// TypeScript types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;

// Document types (for retrieved documents)
export type UserDocument = mongoose.Document & {
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  xp: number;
  streak: number;
  lastLoginDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseDocument = mongoose.Document & {
  title: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  totalModules: number;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ModuleDocument = mongoose.Document & {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  order: number;
  xpReward: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskDocument = mongoose.Document & {
  moduleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode?: string;
  solution?: string;
  xpReward: number;
  timeLimit: number;
  memoryLimit: number;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmissionDocument = mongoose.Document & {
  userId: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  code: string;
  language: string;
  status?: string;
  executionTime?: mongoose.Types.Decimal128;
  memoryUsed?: number;
  testCasesPassed: number;
  totalTestCases: number;
  judge0Token?: string;
  createdAt: Date;
  updatedAt: Date;
};