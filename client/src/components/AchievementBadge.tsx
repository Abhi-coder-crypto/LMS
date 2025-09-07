import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Flame, Code, GraduationCap, Target } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Achievement, UserAchievement } from '@shared/schema';

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked?: boolean;
  unlockedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function AchievementBadge({ 
  achievement, 
  isUnlocked = false, 
  unlockedAt,
  size = 'md',
  showDetails = true 
}: AchievementBadgeProps) {
  
  const getIcon = (iconName?: string) => {
    const iconMap = {
      'fas fa-trophy': Trophy,
      'fas fa-star': Star,
      'fas fa-fire': Flame,
      'fas fa-code': Code,
      'fas fa-graduation-cap': GraduationCap,
      'fas fa-target': Target,
    };
    
    const IconComponent = iconName ? iconMap[iconName as keyof typeof iconMap] : Trophy;
    return IconComponent || Trophy;
  };

  const sizeClasses = {
    sm: {
      container: 'w-12 h-12',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-16 h-16',
      icon: 'w-6 h-6',
      text: 'text-sm'
    },
    lg: {
      container: 'w-20 h-20',
      icon: 'w-8 h-8',
      text: 'text-base'
    }
  };

  const IconComponent = getIcon(achievement.icon || undefined);

  if (!showDetails) {
    return (
      <div 
        className={cn(
          "rounded-full flex items-center justify-center transition-all",
          sizeClasses[size].container,
          isUnlocked 
            ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400" 
            : "bg-muted text-muted-foreground opacity-60"
        )}
        data-testid={`achievement-badge-${achievement.id}`}
        title={achievement.name}
      >
        <IconComponent className={sizeClasses[size].icon} />
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        "transition-all hover:shadow-md",
        !isUnlocked && "opacity-60"
      )}
      data-testid={`achievement-card-${achievement.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div 
            className={cn(
              "rounded-full flex items-center justify-center",
              sizeClasses[size].container,
              isUnlocked 
                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400" 
                : "bg-muted text-muted-foreground"
            )}
          >
            <IconComponent className={sizeClasses[size].icon} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={cn("font-medium truncate", sizeClasses[size].text)} data-testid={`achievement-name-${achievement.id}`}>
                {achievement.name}
              </h4>
              {isUnlocked && (
                <Badge variant="secondary" className="ml-2">
                  Unlocked
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mt-1" data-testid={`achievement-description-${achievement.id}`}>
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-between mt-2">
              {achievement.xpReward && (
                <Badge variant="outline" className="text-xs" data-testid={`achievement-xp-${achievement.id}`}>
                  +{achievement.xpReward} XP
                </Badge>
              )}
              
              {isUnlocked && unlockedAt && (
                <span className="text-xs text-muted-foreground" data-testid={`achievement-date-${achievement.id}`}>
                  {new Date(unlockedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
