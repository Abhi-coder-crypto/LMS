import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Code, 
  Trophy, 
  Users, 
  CheckCircle, 
  Star,
  Zap,
  Award,
  BookOpen,
  Target
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Code,
      title: "Online Code Compiler",
      description: "Practice Java with our integrated compiler. Run and test your code instantly."
    },
    {
      icon: Target,
      title: "Task-Based Learning",
      description: "Progress through structured challenges that unlock as you complete each task."
    },
    {
      icon: Trophy,
      title: "Gamification",
      description: "Earn XP points, unlock badges, and compete on leaderboards."
    },
    {
      icon: Award,
      title: "Certificates",
      description: "Get verified certificates upon course completion with unique verification IDs."
    },
    {
      icon: Users,
      title: "Community Support",
      description: "Join our learning community for doubt clearing and peer support."
    },
    {
      icon: BookOpen,
      title: "Structured Curriculum",
      description: "Learn Java from basics to advanced with our carefully designed curriculum."
    }
  ];

  const courseLevels = [
    {
      level: "Beginner",
      description: "Java basics, syntax, data types, operators, control statements",
      modules: 8,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    },
    {
      level: "Intermediate", 
      description: "OOP concepts, Collections, Exception Handling",
      modules: 10,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    },
    {
      level: "Advanced",
      description: "Multi-threading, JDBC, Spring Boot, Design Patterns",
      modules: 12,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <GraduationCap className="w-16 h-16 mr-4" />
              <h1 className="text-5xl font-bold">DigitioHub Academy</h1>
            </div>
            <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
              Master Java programming with our interactive platform featuring online compiler, 
              task-based learning, and gamified progression system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-gray-100"
                onClick={() => window.location.href = '/auth'}
                data-testid="button-get-started"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose DigitioHub Academy?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience a modern approach to learning Java programming with interactive tools and gamified learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow" data-testid={`feature-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Course Levels Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Learning Path</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Progress through three carefully structured levels, from beginner to advanced Java developer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courseLevels.map((course, index) => (
              <Card key={index} className="relative overflow-hidden" data-testid={`course-level-${index}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge className={course.color}>{course.level}</Badge>
                    <span className="text-sm text-muted-foreground">{course.modules} modules</span>
                  </div>
                  <CardTitle className="text-2xl">{course.level} Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{course.description}</p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Interactive coding exercises
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    Earn XP and badges
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Java Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already learning Java with our interactive platform.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-gray-100"
            onClick={() => window.location.href = '/auth'}
            data-testid="button-start-learning"
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            Start Learning Today
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <GraduationCap className="w-8 h-8 mr-2 text-primary" />
              <span className="text-xl font-bold">DigitioHub Academy</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Empowering the next generation of Java developers
            </p>
            <p className="text-sm text-muted-foreground">
              © 2024 DigitioHub Academy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
