
# Knowledge Base Platform

A collaborative document editing platform built with React, TypeScript, and Supabase. This platform allows users to create, edit, and share documents with real-time collaboration features.

## Features

- **User Authentication**: Secure login and registration system
- **Document Management**: Create, edit, and organize documents
- **Real-time Collaboration**: Multiple users can edit documents simultaneously
- **Version History**: Track changes and restore previous versions
- **Document Sharing**: Share documents with other users with different permission levels
- **Profile Management**: User profiles with customizable information
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Bundler**: Vite
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with custom design tokens

## Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── ProfileSettings.tsx
│   ├── ProtectedRoute.tsx
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state management
├── hooks/              # Custom React hooks
│   └── useDocument.ts  # Document management logic
├── pages/              # Page components
│   ├── Auth.tsx        # Authentication page
│   ├── Dashboard.tsx   # User dashboard
│   ├── DocumentEditor.tsx # Document editing interface
│   └── ...
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client and types
└── lib/                # Utility functions
```

### Backend Architecture (Supabase)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Built-in Supabase Auth
- **Real-time**: Supabase Realtime for live collaboration
- **Storage**: File storage for avatars and attachments

### Key Database Tables
- `profiles`: User profile information
- `documents`: Document metadata and content
- `document_shares`: Document sharing permissions
- `document_versions`: Version history tracking

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Supabase account (for backend services)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   The project is pre-configured to work with the included Supabase instance. No additional environment variables are needed for basic functionality.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

### Database Setup (Already Configured)
The Supabase database is already set up with the following tables:
- User profiles and authentication
- Document management system
- Sharing and permissions
- Version history tracking

## Demo Accounts

For testing purposes, you can use these demo accounts:

### Demo User 1
- **Email**: demo1@gmail.com
- **Password**: demo123
- **Role**: Document Editor


### Admin
- **Email**: admin@gmail.com
- **Password**: admin123
- **Role**: Document Creator


*Note: These are demo accounts for testing purposes. In a production environment, use proper authentication and secure passwords.*

## Key Features Guide

### Document Creation
1. Login to your account
2. Click "New Document" on the dashboard
3. Start typing to create content

### Sharing Documents
1. Open any document you own
2. Click the "Share" button
3. Add collaborators by email
4. Set permissions (read/write)

### Version History
1. Open any document
2. Click "Version History"
3. Browse previous versions
4. Restore any version if needed

### Profile Management
1. Click on your profile avatar
2. Select "Settings"
3. Update your profile information
4. Change avatar and bio

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
