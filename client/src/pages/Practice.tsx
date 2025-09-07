import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import CodeEditor from '@/components/CodeEditor';
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Code, 
  Trophy, 
  Clock, 
  Target,
  Filter,
  ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  starterCode: string;
  xpReward: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  testCases?: any[];
  submissions?: any[];
}

export default function Practice() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'completed'>('unlocked');

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

  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
    enabled: isAuthenticated,
    retry: false,
  });

  const [allTasks, setAllTasks] = useState<Task[]>([]);

  // Fetch tasks from all modules
  useEffect(() => {
    if (!courses || !Array.isArray(courses)) return;

    const fetchAllTasks = async () => {
      const tasks: Task[] = [];
      
      for (const course of courses) {
        try {
          const modulesResponse = await fetch(`/api/courses/${course.id}/modules`, {
            credentials: 'include',
          });
          
          if (modulesResponse.ok) {
            const modules = await modulesResponse.json();
            
            for (const module of modules) {
              try {
                const tasksResponse = await fetch(`/api/modules/${module.id}/tasks`, {
                  credentials: 'include',
                });
                
                if (tasksResponse.ok) {
                  const moduleTasks = await tasksResponse.json();
                  tasks.push(...moduleTasks);
                }
              } catch (error) {
                console.error('Error fetching tasks for module:', module.id, error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching modules for course:', course.id, error);
        }
      }
      
      setAllTasks(tasks);
    };

    fetchAllTasks();
  }, [courses]);

  const submitCodeMutation = useMutation({
    mutationFn: async ({ taskId, code, language }: { taskId: string; code: string; language: string }) => {
      const response = await apiRequest('POST', `/api/tasks/${taskId}/submit`, {
        code,
        language,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Code Submitted!",
        description: `${data.totalPassed}/${data.totalTests} test cases passed`,
        variant: data.totalPassed === data.totalTests ? "default" : "destructive",
      });
      
      if (data.totalPassed === data.totalTests) {
        // Refresh tasks to update completion status
        queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
        setAllTasks(prev => prev.map(task => 
          task.id === selectedTask?.id 
            ? { ...task, isCompleted: true }
            : task
        ));
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTaskSubmit = async (code: string, language: string) => {
    if (!selectedTask) return;
    
    return submitCodeMutation.mutateAsync({
      taskId: selectedTask.id,
      code,
      language,
    });
  };

  const filteredTasks = allTasks.filter(task => {
    switch (activeTab) {
      case 'unlocked':
        return task.isUnlocked && !task.isCompleted;
      case 'completed':
        return task.isCompleted;
      default:
        return true;
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTaskStats = () => {
    const total = allTasks.length;
    const unlocked = allTasks.filter(t => t.isUnlocked).length;
    const completed = allTasks.filter(t => t.isCompleted).length;
    
    return { total, unlocked, completed };
  };

  const stats = getTaskStats();

  if (authLoading) {
    return <PracticeSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="practice-page">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold" data-testid="practice-title">Practice Arena</h1>
              <p className="text-muted-foreground mt-2">
                Sharpen your Java skills with hands-on coding challenges
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary" data-testid="stats-completed">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary" data-testid="stats-unlocked">{stats.unlocked}</div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground" data-testid="stats-total">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task List */}
          <div className="lg:col-span-1 space-y-6">
            <Card data-testid="task-list">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Coding Challenges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="unlocked" data-testid="tab-unlocked">Available</TabsTrigger>
                    <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
                    <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value={activeTab} className="mt-4">
                    <div className="space-y-3">
                      {filteredTasks.length === 0 ? (
                        <div className="text-center py-8">
                          <Code className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">
                            {activeTab === 'unlocked' && 'No unlocked tasks available'}
                            {activeTab === 'completed' && 'No completed tasks yet'}
                            {activeTab === 'all' && 'No tasks found'}
                          </p>
                        </div>
                      ) : (
                        filteredTasks.map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                              selectedTask?.id === task.id && "ring-2 ring-primary bg-primary/5",
                              !task.isUnlocked && "opacity-60"
                            )}
                            onClick={() => task.isUnlocked && setSelectedTask(task)}
                            data-testid={`task-item-${task.id}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium text-sm" data-testid={`task-title-${task.id}`}>
                                {task.title}
                              </h4>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={cn("text-xs capitalize", getDifficultyColor(task.difficulty))}>
                                {task.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                +{task.xpReward} XP
                              </Badge>
                              {task.isCompleted && (
                                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  ✓
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <CodeEditor
                task={selectedTask}
                onSubmit={handleTaskSubmit}
                isSubmitting={submitCodeMutation.isPending}
              />
            ) : (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Code className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Select a Challenge</h3>
                    <p className="text-muted-foreground">
                      Choose a coding challenge from the list to start practicing
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="stat-practice-time">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">2.5h</div>
                  <div className="text-sm text-muted-foreground">Practice Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-success-rate">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-xp">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{user?.xp || 0}</div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PracticeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 bg-card border-b border-border"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
