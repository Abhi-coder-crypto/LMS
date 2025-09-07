import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from '@/components/Header';
import CourseCard from '@/components/CourseCard';
import AchievementBadge from '@/components/AchievementBadge';
import ProgressBar from '@/components/ProgressBar';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Code, 
  Trophy, 
  Users, 
  Crown, 
  Tag, 
  Flame,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

export default function Dashboard() {
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

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/dashboard'],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['/api/leaderboard'],
    enabled: isAuthenticated,
    retry: false,
  });

  if (authLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const dashboardInfo = dashboardData || {};
  const courses = dashboardInfo.courses || [];
  const currentCourse = dashboardInfo.currentCourse || null;
  const achievements = dashboardInfo.achievements || [];
  const certificates = dashboardInfo.certificates || [];

  // Calculate course progress
  const getCourseProgress = (course: any) => {
    const userProgress = dashboardInfo.userProgress || [];
    const courseProgress = userProgress.filter((p: any) => p.courseId === course.id && p.isCompleted);
    return {
      completed: courseProgress.length,
      total: course.totalModules || 0,
      percentage: course.totalModules ? (courseProgress.length / course.totalModules) * 100 : 0
    };
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-primary-foreground mb-8" data-testid="welcome-banner">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h2>
              <p className="text-primary-foreground/90">
                Ready to continue your Java journey? You're doing great!
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Code className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Learning Section */}
            {currentCourse && (
              <section data-testid="current-learning">
                <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
                <CourseCard 
                  course={currentCourse}
                  progress={getCourseProgress(currentCourse)}
                  onContinue={() => window.location.href = `/courses/${currentCourse.id}`}
                />
              </section>
            )}

            {/* Practice Arena */}
            <section data-testid="practice-arena">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Practice Arena</h3>
                <Link href="/practice">
                  <Button variant="outline" data-testid="button-view-all-tasks">
                    View All Tasks
                  </Button>
                </Link>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="w-5 h-5" />
                    <span>Quick Practice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Sharpen your skills with quick coding challenges
                  </p>
                  <Link href="/practice">
                    <Button data-testid="button-start-practice">
                      Start Practicing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </section>

            {/* Learning Path */}
            <section data-testid="learning-path">
              <h3 className="text-2xl font-bold mb-6">Your Learning Path</h3>
              <div className="space-y-4">
                {courses.map((course: any, index: number) => {
                  const progress = getCourseProgress(course);
                  const isUnlocked = index === 0 || (index > 0 && getCourseProgress(courses[index - 1]).percentage === 100);
                  
                  return (
                    <CourseCard
                      key={course.id}
                      course={course}
                      progress={progress}
                      isUnlocked={isUnlocked}
                      onStart={() => window.location.href = `/courses/${course.id}`}
                      onContinue={() => window.location.href = `/courses/${course.id}`}
                    />
                  );
                })}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Recent Achievements */}
            <Card data-testid="achievements-sidebar">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.slice(0, 3).map((achievement: any) => (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement.achievement || achievement}
                      isUnlocked={true}
                      unlockedAt={achievement.unlockedAt}
                      size="sm"
                      showDetails={false}
                    />
                  ))}
                  
                  {achievements.length === 0 && (
                    <div className="text-center py-4">
                      <Trophy className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Complete tasks to earn achievements!
                      </p>
                    </div>
                  )}
                  
                  <Link href="/achievements">
                    <Button variant="ghost" className="w-full" data-testid="button-view-all-badges">
                      View All Badges
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card data-testid="leaderboard-sidebar">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Leaderboard</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(leaderboard || []).slice(0, 3).map((leader: any, index: number) => (
                    <div 
                      key={leader.id} 
                      className={`flex items-center justify-between ${
                        leader.id === user?.id ? 'bg-primary/10 p-2 rounded-lg' : ''
                      }`}
                      data-testid={`leaderboard-${index}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-muted'
                        }`}>
                          <span className="text-sm font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {leader.id === user?.id ? 'You' : `${leader.firstName} ${leader.lastName}`}
                          </div>
                          <div className="text-xs text-muted-foreground">{leader.xp} XP</div>
                        </div>
                      </div>
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    </div>
                  ))}
                  
                  <Link href="/leaderboard">
                    <Button variant="ghost" className="w-full" data-testid="button-view-full-leaderboard">
                      View Full Leaderboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade Card */}
            <div className="bg-gradient-to-br from-accent/20 to-orange-100 rounded-xl border border-accent/30 p-6" data-testid="upgrade-card">
              <div className="text-center">
                <Crown className="w-8 h-8 text-accent mx-auto mb-3" />
                <h4 className="text-lg font-semibold mb-2">Upgrade to Premium</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Unlock advanced courses, certificates, and 1-on-1 mentorship
                </p>
                
                <div className="space-y-2 mb-4 text-left">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Live doubt clearing sessions</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Verified certificates</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Advanced practice problems</span>
                  </div>
                </div>
                
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-upgrade">
                  Upgrade Now - ₹2999
                </Button>
                
                <div className="text-xs text-muted-foreground mt-2">
                  7-day free trial • Cancel anytime
                </div>
              </div>
            </div>

            {/* Certificates */}
            <Card data-testid="certificates-preview">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Your Certificates</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certificates.length > 0 ? (
                  <div className="space-y-2">
                    {certificates.slice(0, 2).map((cert: any) => (
                      <div key={cert.id} className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium text-sm">{cert.course?.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">
                      Complete your first course to earn your certificate
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Certificates are verified with unique ID
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Access Toolbar */}
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3" data-testid="quick-access">
          <Button 
            size="icon"
            className="w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all"
            data-testid="button-community"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button 
            size="icon"
            variant="secondary"
            className="w-12 h-12 rounded-full shadow-lg hover:scale-110 transition-all"
            data-testid="button-help"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-card border-b border-border"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
