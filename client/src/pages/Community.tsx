import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import { useAuth } from "@/hooks/useAuth";
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Users,
  Code,
  Trophy,
  HelpCircle,
  Search,
  Plus,
  Flame,
  Clock,
  User,
  Star
} from 'lucide-react';

interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  replies: number;
  likes: number;
  timeAgo: string;
  isHot: boolean;
  solved?: boolean;
}

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample discussion data
  const discussions: DiscussionPost[] = [
    {
      id: '1',
      title: 'Help with Java loops - stuck on for loop logic',
      content: 'I\'m having trouble understanding how for loops work in Java. Can someone explain the syntax?',
      author: 'Priya Sharma',
      category: 'Beginner Help',
      replies: 12,
      likes: 25,
      timeAgo: '2 hours ago',
      isHot: true,
      solved: false
    },
    {
      id: '2',
      title: 'Best practices for Object-Oriented Programming',
      content: 'What are some best practices when working with classes and objects in Java?',
      author: 'Raj Patel',
      category: 'Best Practices',
      replies: 8,
      likes: 34,
      timeAgo: '4 hours ago',
      isHot: true,
      solved: true
    },
    {
      id: '3',
      title: 'Spring Boot project ideas for portfolio',
      content: 'Looking for some intermediate level Spring Boot project ideas to showcase in my portfolio.',
      author: 'Sneha Gupta',
      category: 'Project Ideas',
      replies: 15,
      likes: 42,
      timeAgo: '1 day ago',
      isHot: false,
      solved: false
    },
    {
      id: '4',
      title: 'Error handling in Java - Exception types',
      content: 'Can someone explain the difference between checked and unchecked exceptions?',
      author: 'Arjun Singh',
      category: 'Intermediate',
      replies: 6,
      likes: 18,
      timeAgo: '2 days ago',
      isHot: false,
      solved: true
    }
  ];

  const mentors = [
    { name: 'Dr. Vikash Kumar', expertise: 'Java Enterprise', students: 250, rating: 4.9 },
    { name: 'Rahul Mehta', expertise: 'Spring Boot', students: 180, rating: 4.8 },
    { name: 'Anjali Desai', expertise: 'Data Structures', students: 320, rating: 4.9 },
    { name: 'Kiran Joshi', expertise: 'Full Stack', students: 200, rating: 4.7 }
  ];

  const studyGroups = [
    { name: 'Java Beginners Circle', members: 45, topic: 'Core Java Concepts', nextSession: 'Today 7 PM' },
    { name: 'OOP Masters', members: 32, topic: 'Advanced OOP', nextSession: 'Tomorrow 6 PM' },
    { name: 'Spring Boot Squad', members: 28, topic: 'Spring Framework', nextSession: 'Wed 8 PM' },
    { name: 'Interview Prep Group', members: 67, topic: 'Coding Interviews', nextSession: 'Fri 5 PM' }
  ];

  const filteredDiscussions = discussions.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">DigitioHub Community</h1>
              <p className="text-blue-100">
                Connect, learn, and grow with fellow Java enthusiasts
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10" />
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discussions">
              <MessageCircle className="w-4 h-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="mentors">
              <User className="w-4 h-4 mr-2" />
              Mentors
            </TabsTrigger>
            <TabsTrigger value="study-groups">
              <Users className="w-4 h-4 mr-2" />
              Study Groups
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Code className="w-4 h-4 mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-6">
            {/* Search and Create */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Discussion
              </Button>
            </div>

            {/* Discussion Categories */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">All</Badge>
              <Badge variant="outline">Beginner Help</Badge>
              <Badge variant="outline">Best Practices</Badge>
              <Badge variant="outline">Project Ideas</Badge>
              <Badge variant="outline">Intermediate</Badge>
              <Badge variant="outline">Advanced</Badge>
            </div>

            {/* Discussion Posts */}
            <div className="space-y-4">
              {filteredDiscussions.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{post.title}</CardTitle>
                          {post.isHot && (
                            <Badge variant="destructive" className="text-xs">
                              <Flame className="w-3 h-3 mr-1" />
                              Hot
                            </Badge>
                          )}
                          {post.solved && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              ✓ Solved
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author}
                          </span>
                          <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {post.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 mr-1" />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Reply className="w-4 h-4 mr-1" />
                          {post.replies} replies
                        </Button>
                      </div>
                      <Button variant="outline" size="sm">
                        Join Discussion
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mentors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {mentors.map((mentor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{mentor.name}</CardTitle>
                        <p className="text-muted-foreground">{mentor.expertise}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm text-muted-foreground">
                        {mentor.students} students mentored
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{mentor.rating}</span>
                      </div>
                    </div>
                    <Button className="w-full">Connect with Mentor</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="study-groups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studyGroups.map((group, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      {group.name}
                    </CardTitle>
                    <p className="text-muted-foreground">{group.topic}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Members</span>
                        <span className="font-medium">{group.members}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next Session</span>
                        <span className="font-medium">{group.nextSession}</span>
                      </div>
                      <Button className="w-full" variant="outline">Join Group</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code Snippets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Collection of useful Java code snippets and templates
                  </p>
                  <Button variant="outline" className="w-full">Browse Snippets</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    FAQ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Frequently asked questions about Java programming
                  </p>
                  <Button variant="outline" className="w-full">View FAQ</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Challenges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Weekly coding challenges for extra practice
                  </p>
                  <Button variant="outline" className="w-full">Take Challenge</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}