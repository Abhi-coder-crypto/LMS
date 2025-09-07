import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete!');
  } catch (error) {
    console.log('No migrations folder found, creating tables manually...');
    
    // Create tables using raw SQL
    const createTablesSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        profile_image_url TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'student',
        xp INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        last_login_date TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Courses table
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        level VARCHAR(20) NOT NULL,
        "order" INTEGER NOT NULL,
        total_modules INTEGER NOT NULL DEFAULT 0,
        xp_reward INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Modules table
      CREATE TABLE IF NOT EXISTS modules (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        content TEXT,
        "order" INTEGER NOT NULL,
        xp_reward INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Tasks table
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        difficulty VARCHAR(20) NOT NULL,
        starter_code TEXT,
        solution TEXT,
        xp_reward INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 30,
        memory_limit INTEGER NOT NULL DEFAULT 256,
        "order" INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Test cases table
      CREATE TABLE IF NOT EXISTS test_cases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        input TEXT,
        expected_output TEXT,
        is_hidden BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- User progress table
      CREATE TABLE IF NOT EXISTS user_progress (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
        task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
        is_completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Submissions table
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL DEFAULT 'java',
        status VARCHAR(50),
        execution_time DECIMAL(10, 4),
        memory_used INTEGER,
        test_cases_passed INTEGER NOT NULL DEFAULT 0,
        total_test_cases INTEGER NOT NULL DEFAULT 0,
        judge0_token VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Achievements table
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        xp_reward INTEGER NOT NULL DEFAULT 0,
        condition TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- User achievements table
      CREATE TABLE IF NOT EXISTS user_achievements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
        unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, achievement_id)
      );

      -- Certificates table
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        certificate_number VARCHAR(255) UNIQUE NOT NULL,
        issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
        verification_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      -- Sessions table for express-session
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess TEXT NOT NULL,
        expire TIMESTAMP NOT NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS courses_order_idx ON courses("order");
      CREATE INDEX IF NOT EXISTS modules_course_order_idx ON modules(course_id, "order");
      CREATE INDEX IF NOT EXISTS tasks_module_order_idx ON tasks(module_id, "order");
      CREATE INDEX IF NOT EXISTS test_cases_task_order_idx ON test_cases(task_id, "order");
      CREATE INDEX IF NOT EXISTS user_progress_user_course_idx ON user_progress(user_id, course_id);
      CREATE INDEX IF NOT EXISTS user_progress_user_task_idx ON user_progress(user_id, task_id);
      CREATE INDEX IF NOT EXISTS submissions_user_task_idx ON submissions(user_id, task_id);
      CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions(created_at);
      CREATE INDEX IF NOT EXISTS user_achievements_unique_idx ON user_achievements(user_id, achievement_id);
      CREATE INDEX IF NOT EXISTS certificates_number_idx ON certificates(certificate_number);
      CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
    `;

    await pool.query(createTablesSQL);
    console.log('Tables created successfully!');
  }

  await pool.end();
  console.log('Database setup complete!');
}

main().catch(console.error);