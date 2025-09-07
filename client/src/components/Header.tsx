import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { GraduationCap, Star, ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from '@shared/schema';

interface HeaderProps {
  user?: UserType;
}

export default function Header({ user }: HeaderProps) {
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      window.location.href = '/';
    }
  });

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logoutMutation.mutate();
  };
  
  const navItems = [
    { href: '/', label: 'Dashboard', active: location === '/' },
    { href: '/courses', label: 'Courses', active: location.startsWith('/courses') },
    { href: '/practice', label: 'Practice', active: location.startsWith('/practice') },
    { href: '/community', label: 'Community', active: location.startsWith('/community') },
  ];

  const getUserInitials = (user?: UserType) => {
    if (!user) return 'U';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getUserDisplayName = (user?: UserType) => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50" data-testid="header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex-shrink-0 cursor-pointer" data-testid="logo">
                <h1 className="text-2xl font-bold text-primary">
                  <GraduationCap className="inline mr-2" />
                  DigitioHub Academy
                </h1>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a 
                    className={`pb-4 transition-colors ${
                      item.active 
                        ? 'text-primary font-medium border-b-2 border-primary' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* XP Display */}
            <div className="flex items-center space-x-2 bg-accent/20 px-3 py-1 rounded-full" data-testid="xp-display">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{user?.xp || 0} XP</span>
            </div>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-3 bg-muted/50 hover:bg-muted transition-colors px-3 py-2 rounded-lg"
                  data-testid="user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">
                    {getUserDisplayName(user)}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} data-testid="logout-link">
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Log Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
