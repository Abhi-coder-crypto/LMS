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
import AdminPanel from '@/pages/AdminPanel';
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
      // User will be automatically redirected to auth by the main App component
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

  // Route admins to admin panel
  if (user?.role === 'admin') {
    return <AdminPanel />;
  }

  const dashboardInfo = dashboardData || {};
  const courses = (dashboardInfo as any)?.courses || [];
  const currentCourse = (dashboardInfo as any)?.currentCourse || null;
  const achievements = (dashboardInfo as any)?.achievements || [];
  const certificates = (dashboardInfo as any)?.certificates || [];

  // Calculate course progress
  const getCourseProgress = (course: any) => {
    const userProgress = (dashboardInfo as any)?.userProgress || [];
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
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 overflow-hidden" data-testid="welcome-banner">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                Welcome back, {user?.firstName || 'Student'}! 🚀
              </h2>
              <p className="text-blue-100 text-lg">
                Ready to master Java programming? Let's build something amazing today!
              </p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-300" />
                  <span className="text-blue-100">Streak: {user?.streak || 0} days</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <span className="text-blue-100">{user?.xp || 0} XP earned</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <Code className="w-16 h-16 text-white" />
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
                  {(leaderboard || [])?.slice?.(0, 3)?.map((leader: any, index: number) => (
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
                            {leader?.id === user?.id ? 'You' : `${leader?.firstName} ${leader?.lastName}`}
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
            <div className="relative bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-2xl p-6 text-white overflow-hidden" data-testid="upgrade-card">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2">Unlock Premium</h4>
                <p className="text-white/90 text-sm mb-6">
                  Access advanced courses, live sessions & personalized mentorship
                </p>
                
                <div className="space-y-3 mb-6 text-left">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span>Live doubt clearing sessions</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span>Industry-recognized certificates</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span>1-on-1 expert mentorship</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                    <span>Advanced coding challenges</span>
                  </div>
                </div>
                
                <Button className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold py-3 rounded-xl" data-testid="button-upgrade">
                  Start Free Trial - ₹2,999/month
                </Button>
                
                <div className="text-xs text-white/70 mt-3">
                  7-day free trial • Cancel anytime • No hidden fees
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
            className="w-14 h-14 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            data-testid="button-community"
            onClick={() => window.location.href = '/community'}
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
          <Button 
            size="icon"
            variant="secondary"
            className="w-14 h-14 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 bg-white hover:bg-gray-50 border-2 border-gray-200"
            data-testid="button-help"
          >
            <HelpCircle className="w-6 h-6 text-gray-600" />
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
