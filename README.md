# DF Pulse - Feedback Management System

A modern feedback management application built with Next.js 14, designed to facilitate structured feedback collection and review within organizations. DF Pulse enables admins to create question sets, request feedback from team members, and manage the entire feedback lifecycle.

## Features

- **Structured Feedback System** - Create and manage question sets by category (Company, Project, Coworkers, Self Reflection)
- **Multi-Recipient Requests** - Send feedback requests to multiple team members simultaneously
- **Version Control** - Track changes to question sets with full version history
- **Admin Controls** - Archive/restore question sets and manage feedback submissions
- **Anonymous Feedback** - Support for anonymous feedback submissions
- **Google OAuth Authentication** - Secure login with company Google accounts
- **Modern UI** - Beautiful interface built with shadcn/ui and Tailwind CSS
- **Responsive Design** - Works perfectly on desktop and mobile devices

## Core Functionality

### For Administrators
- **Question Set Management**: Create, edit, archive, and restore feedback question sets
- **Version History**: View and restore previous versions of question sets
- **Feedback Requests**: Create requests targeting specific users or project teams
- **Submission Review**: Review and approve/deny feedback submissions
- **User Management**: View all users for recipient selection

### For Team Members
- **Pending Requests**: View and respond to feedback requests
- **Submission History**: Track feedback you've provided to others
- **Received Feedback**: View feedback others have provided to you
- **Anonymous Options**: Submit feedback anonymously when requested

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Authentication**: NextAuth.js v4 with Google OAuth
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form with Zod validation

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Google OAuth credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd df-pulse
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string_here

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Optional: Restrict to company domain (e.g., @yourcompany.com)
# ALLOWED_EMAIL_DOMAIN=yourcompany.com

# Optional: Set to 'mock' for development without Google OAuth
# APP_MODE=mock
```

### 3. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
6. Copy the Client ID and Client Secret to your `.env.local` file

### 4. MongoDB Setup

1. Create a MongoDB Atlas account or use a local MongoDB instance
2. Create a new database
3. Get your connection string and add it to `MONGODB_URI` in your `.env.local` file

### 5. Generate NextAuth Secret

Generate a secure random string for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication
- Users sign in with their Google account
- Optionally restrict access to specific email domains
- Automatic redirect to profile page after login

### Admin Workflow
1. **Create Question Sets**: Go to Feedback Administration → Question Sets
2. **Organize by Category**: Create sets for Company, Project, Coworkers, or Self Reflection
3. **Request Feedback**: Use the Requests tab to send feedback requests to team members
4. **Review Submissions**: Monitor and approve feedback submissions in the Submissions tab

### Team Member Workflow
1. **View Pending Requests**: Check your profile page for pending feedback requests
2. **Submit Feedback**: Answer questions and optionally request anonymity
3. **Track History**: View feedback you've provided and received

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   ├── feedback/      # Feedback management APIs
│   │   ├── question-sets/ # Question set management APIs
│   │   ├── users/         # User management API
│   │   └── projects/      # Project management API
│   ├── admin/             # Admin pages
│   │   └── feedback/      # Feedback administration
│   ├── profile/           # User profile page
│   ├── projects/          # Projects pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Layout.tsx        # Main layout with navigation
│   ├── Providers.tsx     # NextAuth provider
│   └── feedback/         # Feedback-specific components
├── lib/                  # Utility functions
│   ├── mongodb.ts        # MongoDB connection
│   └── utils.ts          # shadcn/ui utilities
├── models/               # Mongoose models
│   ├── User.ts           # User schema
│   ├── Project.ts        # Project schema
│   ├── FeedbackQuestion.ts # Question set schema
│   ├── FeedbackRequest.ts # Feedback request schema
│   ├── FeedbackSubmission.ts # Feedback submission schema
│   └── QuestionSetVersion.ts # Version history schema
└── types/                # TypeScript type definitions
    └── next-auth.d.ts    # NextAuth type extensions
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Feedback Management
- `GET /api/feedback/questions` - Get question sets (admin only)
- `POST /api/feedback/questions` - Create question set (admin only)
- `GET /api/feedback/requests` - Get feedback requests
- `POST /api/feedback/requests` - Create feedback request (admin only)
- `GET /api/feedback/submissions` - Get feedback submissions
- `POST /api/feedback/submissions` - Submit feedback
- `PUT /api/feedback/submissions/[id]` - Approve/deny submission (admin only)

### Question Set Management
- `PATCH /api/question-sets/[id]` - Edit question set (admin only)
- `DELETE /api/question-sets/[id]` - Archive question set (admin only)
- `GET /api/question-sets/versions/[id]` - Get version history (admin only)
- `POST /api/question-sets/versions/[id]` - Restore version (admin only)

### Users & Projects
- `GET /api/users` - Get all users (for recipient selection)
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user profile
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project

## Database Models

### User Model
```typescript
{
  name: string,
  email: string,
  image?: string,
  bio: string,
  interests: string[],
  avatar: string,
  role: 'user' | 'admin',
  isAdmin: boolean,
  timestamps: true
}
```

### FeedbackQuestion Model
```typescript
{
  name: string,
  category: 'company' | 'project' | 'coworkers' | 'self',
  questions: string[],
  createdBy: ObjectId,
  isArchived: boolean,
  timestamps: true
}
```

### FeedbackRequest Model
```typescript
{
  category: string,
  questionSet: ObjectId,
  recipients: ObjectId[],
  deadline?: Date,
  createdBy: ObjectId,
  timestamps: true
}
```

### FeedbackSubmission Model
```typescript
{
  request: ObjectId,
  provider: ObjectId,
  responses: Array<{ question: string, answer: string }>,
  anonymousRequested: boolean,
  anonymous: boolean,
  approved: boolean,
  timestamp: Date
}
```

## Customization

### Adding New UI Components
The project uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Styling
- Global styles are in `src/app/globals.css`
- Component-specific styles use Tailwind CSS classes
- Custom CSS variables for theming are defined in the global CSS

### Authentication
- Modify `src/app/api/auth/[...nextauth]/route.ts` to add more providers
- Update the sign-in callback to change redirect behavior

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
- Update `NEXTAUTH_URL` to your production domain
- Ensure MongoDB connection string is accessible
- Set up proper environment variables

## Security Considerations

- All API routes are protected with NextAuth session validation
- Admin-only routes check for proper authorization
- User can only update their own profile
- MongoDB connection uses environment variables
- Google OAuth provides secure authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.


