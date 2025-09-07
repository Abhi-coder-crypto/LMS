import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, Play, Coffee } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Course } from '@shared/schema';

interface CourseCardProps {
  course: Course;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  isUnlocked?: boolean;
  onStart?: () => void;
  onContinue?: () => void;
}

export default function CourseCard({ 
  course, 
  progress, 
  isUnlocked = true, 
  onStart, 
  onContinue 
}: CourseCardProps) {
  const isCompleted = progress?.percentage === 100;
  const isInProgress = progress && progress.completed > 0 && progress.percentage < 100;
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'beginner': return <Coffee className="w-5 h-5" />;
      case 'intermediate': return <Play className="w-5 h-5" />;
      case 'advanced': return <CheckCircle className="w-5 h-5" />;
      default: return <Coffee className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadge = () => {
    if (!isUnlocked) {
      return <Badge variant="secondary">Locked</Badge>;
    }
    if (isCompleted) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
    }
    if (isInProgress) {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</Badge>;
    }
    return <Badge variant="outline">Not Started</Badge>;
  };

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        !isUnlocked && "opacity-75",
        isInProgress && "ring-2 ring-primary/20"
      )}
      data-testid={`course-card-${course.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              isUnlocked ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {isUnlocked ? getLevelIcon(course.level) : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <CardTitle className="text-lg" data-testid={`course-title-${course.id}`}>
                {course.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground capitalize">
                {course.level} Level
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground" data-testid={`course-description-${course.id}`}>
          {course.description}
        </p>

        {/* Progress */}
        {progress && isUnlocked && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Progress</span>
              <span data-testid={`course-progress-${course.id}`}>
                {progress.completed}/{progress.total} modules
              </span>
            </div>
            <Progress 
              value={progress.percentage} 
              className="h-2"
              data-testid={`progress-bar-${course.id}`}
            />
          </div>
        )}

        {/* Course Info */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Badge className={cn("capitalize", getLevelColor(course.level))}>
              {course.level}
            </Badge>
            <Badge variant="outline" data-testid={`course-modules-${course.id}`}>
              {course.totalModules} modules
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground" data-testid={`course-xp-${course.id}`}>
            {course.xpReward} XP
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {!isUnlocked ? (
            <Button disabled className="w-full" data-testid={`button-locked-${course.id}`}>
              <Lock className="w-4 h-4 mr-2" />
              Complete Previous Level
            </Button>
          ) : isCompleted ? (
            <Button variant="outline" className="w-full" data-testid={`button-review-${course.id}`}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Review Course
            </Button>
          ) : isInProgress ? (
            <Button 
              onClick={onContinue} 
              className="w-full"
              data-testid={`button-continue-${course.id}`}
            >
              Continue Learning
            </Button>
          ) : (
            <Button 
              onClick={onStart} 
              className="w-full"
              data-testid={`button-start-${course.id}`}
            >
              Start Course
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
