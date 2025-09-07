import { pgTable, text, integer, boolean, timestamp, varchar, decimal, uuid, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  profileImageUrl: text('profile_image_url'),
  role: varchar('role', { length: 20 }).notNull().default('student'), // 'student' | 'admin'
  xp: integer('xp').notNull().default(0),
  streak: integer('streak').notNull().default(0),
  lastLoginDate: timestamp('last_login_date'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  level: varchar('level', { length: 20 }).notNull(), // 'beginner' | 'intermediate' | 'advanced'
  order: integer('order').notNull(),
  totalModules: integer('total_modules').notNull().default(0),
  xpReward: integer('xp_reward').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orderIdx: index('courses_order_idx').on(table.order),
}));

// Modules table
export const modules = pgTable('modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content'), // HTML content or markdown
  order: integer('order').notNull(),
  xpReward: integer('xp_reward').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  courseOrderIdx: index('modules_course_order_idx').on(table.courseId, table.order),
}));

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => modules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // 'easy' | 'medium' | 'hard'
  starterCode: text('starter_code'),
  solution: text('solution'),
  xpReward: integer('xp_reward').notNull().default(0),
  timeLimit: integer('time_limit').notNull().default(30), // seconds
  memoryLimit: integer('memory_limit').notNull().default(256), // MB
  order: integer('order').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  moduleOrderIdx: index('tasks_module_order_idx').on(table.moduleId, table.order),
}));

// Test cases table
export const testCases = pgTable('test_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  input: text('input'),
  expectedOutput: text('expected_output'),
  isHidden: boolean('is_hidden').notNull().default(false),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  taskOrderIdx: index('test_cases_task_order_idx').on(table.taskId, table.order),
}));

// User progress table
export const userProgress = pgTable('user_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').references(() => modules.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userCourseIdx: index('user_progress_user_course_idx').on(table.userId, table.courseId),
  userTaskIdx: index('user_progress_user_task_idx').on(table.userId, table.taskId),
}));

// Submissions table
export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  language: varchar('language', { length: 50 }).notNull().default('java'),
  status: varchar('status', { length: 50 }), // accepted, wrong_answer, time_limit_exceeded, etc.
  executionTime: decimal('execution_time', { precision: 10, scale: 4 }),
  memoryUsed: integer('memory_used'),
  testCasesPassed: integer('test_cases_passed').notNull().default(0),
  totalTestCases: integer('total_test_cases').notNull().default(0),
  judge0Token: varchar('judge0_token', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userTaskIdx: index('submissions_user_task_idx').on(table.userId, table.taskId),
  createdAtIdx: index('submissions_created_at_idx').on(table.createdAt),
}));

// Achievements table
export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }), // Font Awesome icon class
  xpReward: integer('xp_reward').notNull().default(0),
  condition: text('condition'), // JSON string describing unlock condition
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// User achievements table
export const userAchievements = pgTable('user_achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: uuid('achievement_id').notNull().references(() => achievements.id, { onDelete: 'cascade' }),
  unlockedAt: timestamp('unlocked_at').notNull().defaultNow(),
}, (table) => ({
  userAchievementUniqueIdx: index('user_achievements_unique_idx').on(table.userId, table.achievementId),
}));

// Certificates table
export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  certificateNumber: varchar('certificate_number', { length: 255 }).notNull().unique(),
  issuedAt: timestamp('issued_at').notNull().defaultNow(),
  verificationUrl: text('verification_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  certificateNumberIdx: index('certificates_number_idx').on(table.certificateNumber),
}));

// Sessions table for express-session
export const sessions = pgTable('sessions', {
  sid: varchar('sid', { length: 255 }).primaryKey(),
  sess: text('sess').notNull(),
  expire: timestamp('expire').notNull(),
}, (table) => ({
  expireIdx: index('sessions_expire_idx').on(table.expire),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['student', 'admin']).optional(),
});

export const selectUserSchema = createSelectSchema(users);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['student', 'admin']).optional(),
});

export const insertCourseSchema = createInsertSchema(courses, {
  title: z.string().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  order: z.number().min(0),
});

export const insertModuleSchema = createInsertSchema(modules, {
  title: z.string().min(1),
  order: z.number().min(0),
});

export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  order: z.number().min(0),
});

export const insertSubmissionSchema = createInsertSchema(submissions, {
  code: z.string().min(1),
});

export const insertTestCaseSchema = createInsertSchema(testCases, {
  order: z.number().min(0),
});

export const insertAchievementSchema = createInsertSchema(achievements, {
  name: z.string().min(1),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertCertificateSchema = createInsertSchema(certificates);
export const insertUserProgressSchema = createInsertSchema(userProgress);

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TestCase = typeof testCases.$inferSelect;
export type NewTestCase = typeof testCases.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

// Export validation schemas for API use
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertTestCase = z.infer<typeof insertTestCaseSchema>;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;