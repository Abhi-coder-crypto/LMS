# DigitioHub Academy

## Overview

DigitioHub Academy is a gamified online coding education platform focused on Java programming. The application provides an interactive learning experience with task-based curriculum, online code compilation, achievement systems, and certificate generation. Built as a full-stack web application, it combines structured learning paths with community features to create an engaging educational environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Authentication State**: Custom hook-based authentication management

The frontend follows a component-based architecture with clear separation between pages, reusable components, and utility functions. The application uses a mobile-first responsive design approach.

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express session with PostgreSQL store
- **Authentication**: OpenID Connect (OIDC) with Passport.js strategy for Replit authentication
- **API Design**: RESTful endpoints with JSON responses
- **Error Handling**: Centralized error middleware with status code management

The backend follows a service-oriented architecture with clear separation between routes, database operations, and business logic services.

### Database Design

**Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle migrations with version control
- **Key Entities**: Users, Courses, Modules, Tasks, Submissions, Achievements, Certificates
- **Relationships**: Properly normalized schema with foreign key constraints
- **Session Storage**: Dedicated sessions table for authentication persistence

The database schema supports a hierarchical learning structure (Courses → Modules → Tasks) with comprehensive progress tracking and gamification elements.

### Authentication & Authorization

**Strategy**: OpenID Connect integration with Replit's identity provider
- **Session Handling**: Server-side sessions with PostgreSQL persistence
- **Middleware**: Route-level authentication guards
- **User Management**: Automatic user creation/update on login
- **Security**: HTTP-only cookies with secure flags in production

### Code Execution Engine

**Integration**: Judge0 API for secure code compilation and execution
- **Language Support**: Multiple programming languages with configurable language IDs
- **Test Case Validation**: Automated testing against predefined expected outputs
- **Resource Limits**: CPU time and memory constraints for safe execution
- **Result Processing**: Comprehensive feedback including stdout, stderr, and compilation errors

### Gamification System

**XP System**: Points awarded for task completion and achievements
- **Achievement Engine**: Unlockable badges based on learning milestones
- **Progress Tracking**: Module and course completion percentages
- **Leaderboards**: User ranking based on XP accumulation
- **Streak Tracking**: Daily login and activity streaks

### Certificate System

**Generation**: Automated certificate creation upon course completion
- **Verification**: Unique certificate numbers for authenticity
- **Requirements**: All modules must be completed before certificate issuance
- **Storage**: PDF generation and secure storage with download capabilities

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connection Pooling**: @neondatabase/serverless for optimal connection management

### Authentication Services
- **Replit OIDC**: Primary authentication provider
- **OpenID Client**: Standard OIDC implementation for secure authentication flows

### Code Execution
- **Judge0 API**: Third-party service for secure code compilation and execution
- **RapidAPI Integration**: API key authentication for Judge0 access

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library for consistent visual elements
- **Google Fonts**: Web fonts including Inter, DM Sans, Architects Daughter, Fira Code, and Geist Mono

### Development Tools
- **Vite**: Build tool and development server
- **Replit Plugins**: Development environment integration for runtime error handling and code mapping
- **TypeScript**: Static type checking across the entire application

### Utility Libraries
- **Date-fns**: Date manipulation and formatting
- **Zod**: Runtime type validation and schema definition
- **Memoizee**: Function memoization for performance optimization
- **Nanoid**: Unique ID generation for various entities