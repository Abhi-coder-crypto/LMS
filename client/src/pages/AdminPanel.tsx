import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  BookOpen, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Lock,
  GraduationCap
} from 'lucide-react';
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'admin';
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [registerData, setRegisterData] = useState<RegisterData>({ 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '',
    role: 'student'
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const queryClient = useQueryClient();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Admin privileges required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const endpoint = data.role === 'admin' ? '/api/auth/admin/register' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setSuccess(`${registerData.role === 'admin' ? 'Admin' : 'User'} registered successfully!`);
      setError('');
      setRegisterData({ 
        email: '', 
        password: '', 
        firstName: '', 
        lastName: '',
        role: 'student'
      });
    },
    onError: (error: Error) => {
      setError(error.message);
      setSuccess('');
    }
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      // This would be a new admin endpoint to list users
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, courses, and system settings</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Registration Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Register New User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(error || success) && (
                    <Alert className={`mb-4 ${success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className={success ? 'text-green-700' : 'text-red-700'}>
                        {error || success}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <select 
                        id="role"
                        value={registerData.role}
                        onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as 'student' | 'admin' })}
                        className="w-full p-2 border border-input rounded-md bg-background"
                      >
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? 'Creating Account...' : 'Create User Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Users Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Users Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{users.filter((u: any) => u.role === 'student').length}</div>
                        <div className="text-sm text-blue-600">Students</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{users.filter((u: any) => u.role === 'admin').length}</div>
                        <div className="text-sm text-purple-600">Admins</div>
                      </div>
                    </div>
                    
                    {users.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Users</h4>
                        {users.slice(0, 5).map((user: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              <span className="text-sm">{user.firstName} {user.lastName}</span>
                            </div>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No users found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Course Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Course
                  </Button>
                  
                  {courses.length > 0 ? (
                    <div className="space-y-2">
                      {courses.map((course: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{course.title}</h4>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                            <Badge className="mt-1">{course.level}</Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No courses available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{users.length}</div>
                  <p className="text-sm text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{courses.length}</div>
                  <p className="text-sm text-muted-foreground">Available courses</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">0%</div>
                  <p className="text-sm text-muted-foreground">Average completion</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Platform Status</h4>
                      <p className="text-sm text-muted-foreground">System is operational</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Database Connection</h4>
                      <p className="text-sm text-muted-foreground">MongoDB connected</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}