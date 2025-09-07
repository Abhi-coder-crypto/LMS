import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from '@/components/Header';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  CheckCircle, 
  Lock, 
  Play, 
  Clock, 
  Trophy,
  BookOpen,
  Code
} from 'lucide-react';
import { cn } from "@/lib/utils";

export default function Course() {
  const [match, params] = useRoute('/courses/:id');
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['/api/courses', params?.id],
    enabled: isAuthenticated && !!params?.id,
    retry: false,
  });

  const { data: userProgress } = useQuery({
    queryKey: ['/api/progress'],
    enabled: isAuthenticated,
    retry: false,
  });

  if (authLoading || isLoading) {
    return <CourseSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={user} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="text-2xl font-bold text-red-500 mb-2">Course Not Found</h1>
              <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { modules = [] } = courseData || {};
  const courseProgress = userProgress?.filter((p: any) => p.courseId === params?.id) || [];
  const completedModules = courseProgress.filter((p: any) => p.moduleId && p.isCompleted).length;
  const progressPercentage = modules.length > 0 ? (completedModules / modules.length) * 100 : 0;

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    const prevModule = modules[moduleIndex - 1];
    return courseProgress.some((p: any) => p.moduleId === prevModule.id && p.isCompleted);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background" data-testid="course-page">
      <Header user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Course Header */}
        <Card className="mb-8" data-testid="course-header">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Badge className={cn("capitalize", getLevelColor(courseData?.level || 'beginner'))}>
                    {courseData?.level || 'beginner'}
                  </Badge>
                  <Badge variant="outline">
                    {modules.length} modules
                  </Badge>
                  <Badge variant="secondary">
                    +{courseData?.xpReward || 0} XP
                  </Badge>
                </div>
                <CardTitle className="text-3xl mb-2" data-testid="course-title">
                  {courseData?.title || 'Loading...'}
                </CardTitle>
                <p className="text-muted-foreground text-lg" data-testid="course-description">
                  {courseData?.description || 'Loading course description...'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary" data-testid="course-progress-percentage">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProgressBar 
              value={completedModules} 
              max={modules.length} 
              showText={true}
              size="lg"
              data-testid="course-progress-bar"
            />
          </CardContent>
        </Card>

        {/* Modules List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Course Modules</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {modules.map((module: any, index: number) => {
              const isUnlocked = isModuleUnlocked(index);
              const isCompleted = courseProgress.some((p: any) => p.moduleId === module.id && p.isCompleted);
              
              return (
                <Card 
                  key={module.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    !isUnlocked && "opacity-60",
                    isCompleted && "ring-2 ring-green-200 dark:ring-green-800"
                  )}
                  data-testid={`module-${index}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                          isCompleted 
                            ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                            : isUnlocked 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted text-muted-foreground"
                        )}>
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : isUnlocked ? (
                            index + 1
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg" data-testid={`module-title-${index}`}>
                            {module.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Module {index + 1}
                          </p>
                        </div>
                      </div>
                      
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground" data-testid={`module-description-${index}`}>
                      {module.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Lessons</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Code className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Practice</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                        <span>+{module.xpReward || 100} XP</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      {!isUnlocked ? (
                        <Button disabled className="w-full" data-testid={`button-locked-${index}`}>
                          <Lock className="w-4 h-4 mr-2" />
                          Complete Previous Module
                        </Button>
                      ) : isCompleted ? (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.location.href = `/modules/${module.id}`}
                          data-testid={`button-review-${index}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Review Module
                        </Button>
                      ) : (
                        <Button 
                          className="w-full"
                          onClick={() => window.location.href = `/modules/${module.id}`}
                          data-testid={`button-start-${index}`}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {index === 0 ? 'Start Module' : 'Continue Module'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Course Completion */}
        {progressPercentage === 100 && (
          <Card className="mt-8 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" data-testid="course-completion">
            <CardContent className="pt-6">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                  Congratulations! 🎉
                </h3>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  You have completed the {courseData?.title || 'course'}!
                </p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-generate-certificate"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Generate Certificate
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-card border-b border-border"></div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-48 w-full mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
