import { db } from './db';
import { courses, modules, tasks, testCases, achievements } from '@shared/schema';

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Create sample courses
    const [beginnerCourse] = await db.insert(courses).values({
      title: 'Java Fundamentals',
      description: 'Learn the basics of Java programming including syntax, data types, and control structures.',
      level: 'beginner',
      order: 1,
      totalModules: 3,
      xpReward: 500,
      isActive: true,
    }).returning();

    const [intermediateCourse] = await db.insert(courses).values({
      title: 'Object-Oriented Programming',
      description: 'Master OOP concepts including classes, objects, inheritance, and polymorphism.',
      level: 'intermediate',
      order: 2,
      totalModules: 4,
      xpReward: 750,
      isActive: true,
    }).returning();

    // Create sample modules for beginner course
    const [module1] = await db.insert(modules).values({
      courseId: beginnerCourse.id,
      title: 'Introduction to Java',
      description: 'Your first steps into Java programming',
      content: '<h2>Welcome to Java!</h2><p>Java is a powerful programming language...</p>',
      order: 1,
      xpReward: 100,
      isActive: true,
    }).returning();

    const [module2] = await db.insert(modules).values({
      courseId: beginnerCourse.id,
      title: 'Variables and Data Types',
      description: 'Learn about different data types and variables in Java',
      content: '<h2>Variables and Data Types</h2><p>In Java, variables are containers...</p>',
      order: 2,
      xpReward: 150,
      isActive: true,
    }).returning();

    const [module3] = await db.insert(modules).values({
      courseId: beginnerCourse.id,
      title: 'Control Structures',
      description: 'Master if statements, loops, and control flow',
      content: '<h2>Control Structures</h2><p>Control structures allow you to...</p>',
      order: 3,
      xpReward: 200,
      isActive: true,
    }).returning();

    // Create sample tasks
    const [task1] = await db.insert(tasks).values({
      moduleId: module1.id,
      title: 'Hello World',
      description: 'Write your first Java program that prints "Hello, World!" to the console.',
      difficulty: 'easy',
      starterCode: `public class HelloWorld {
    public static void main(String[] args) {
        // Write your code here
        
    }
}`,
      solution: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      xpReward: 50,
      timeLimit: 30,
      memoryLimit: 256,
      order: 1,
      isActive: true,
    }).returning();

    const [task2] = await db.insert(tasks).values({
      moduleId: module2.id,
      title: 'Variable Declaration',
      description: 'Create variables of different data types and print their values.',
      difficulty: 'easy',
      starterCode: `public class Variables {
    public static void main(String[] args) {
        // Declare an integer variable called 'age' with value 25
        
        // Declare a string variable called 'name' with value "Java"
        
        // Print both variables
        
    }
}`,
      solution: `public class Variables {
    public static void main(String[] args) {
        int age = 25;
        String name = "Java";
        System.out.println("Age: " + age);
        System.out.println("Name: " + name);
    }
}`,
      xpReward: 75,
      timeLimit: 30,
      memoryLimit: 256,
      order: 1,
      isActive: true,
    }).returning();

    const [task3] = await db.insert(tasks).values({
      moduleId: module3.id,
      title: 'Simple Loop',
      description: 'Write a program that prints numbers from 1 to 5 using a for loop.',
      difficulty: 'medium',
      starterCode: `public class SimpleLoop {
    public static void main(String[] args) {
        // Write a for loop to print numbers 1 to 5
        
    }
}`,
      solution: `public class SimpleLoop {
    public static void main(String[] args) {
        for (int i = 1; i <= 5; i++) {
            System.out.println(i);
        }
    }
}`,
      xpReward: 100,
      timeLimit: 30,
      memoryLimit: 256,
      order: 1,
      isActive: true,
    }).returning();

    // Create test cases
    await db.insert(testCases).values([
      {
        taskId: task1.id,
        input: '',
        expectedOutput: 'Hello, World!',
        isHidden: false,
        order: 1,
      },
      {
        taskId: task2.id,
        input: '',
        expectedOutput: 'Age: 25\nName: Java',
        isHidden: false,
        order: 1,
      },
      {
        taskId: task3.id,
        input: '',
        expectedOutput: '1\n2\n3\n4\n5',
        isHidden: false,
        order: 1,
      },
    ]);

    // Create sample achievements
    await db.insert(achievements).values([
      {
        name: 'First Steps',
        description: 'Complete your first Java task',
        icon: 'fas fa-star',
        xpReward: 50,
        condition: JSON.stringify({ type: 'tasks_completed', count: 1 }),
        isActive: true,
      },
      {
        name: 'Java Apprentice',
        description: 'Complete 5 tasks',
        icon: 'fas fa-code',
        xpReward: 100,
        condition: JSON.stringify({ type: 'tasks_completed', count: 5 }),
        isActive: true,
      },
      {
        name: 'Course Conqueror',
        description: 'Complete your first course',
        icon: 'fas fa-graduation-cap',
        xpReward: 200,
        condition: JSON.stringify({ type: 'courses_completed', count: 1 }),
        isActive: true,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`Created ${beginnerCourse.title} course with ${module1.title}, ${module2.title}, ${module3.title} modules`);
    console.log(`Created ${task1.title}, ${task2.title}, ${task3.title} tasks`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

// Run the seed function
seedDatabase().then(() => process.exit(0));

export { seedDatabase };