# DF Spaces - Company Intranet

A modern company intranet application built with Next.js 14, featuring employee profiles and project management capabilities. Think of it as a modern MySpace for your company!

## Features

- **Google OAuth Authentication** - Secure login with company Google accounts
- **User Profiles** - Customizable profiles with bio, interests, and avatar
- **Project Management** - Create and manage company projects
- **Modern UI** - Beautiful interface built with shadcn/ui and Tailwind CSS
- **Responsive Design** - Works perfectly on desktop and mobile devices

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
cd df-spaces
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

### User Profiles
- Navigate to `/profile` to edit your profile
- Add a bio, interests, and avatar URL
- Profile information is stored in MongoDB

### Project Management
- View all projects at `/projects`
- Create new projects with name, description, and timeline
- View detailed project information including members
- Projects are displayed in a responsive card layout

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth configuration
│   │   ├── users/         # User profile API
│   │   └── projects/      # Project management API
│   ├── profile/           # User profile page
│   ├── projects/          # Projects pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Layout.tsx        # Main layout with navigation
│   └── Providers.tsx     # NextAuth provider
├── lib/                  # Utility functions
│   ├── mongodb.ts        # MongoDB connection
│   └── utils.ts          # shadcn/ui utilities
├── models/               # Mongoose models
│   ├── User.ts           # User schema
│   └── Project.ts        # Project schema
└── types/                # TypeScript type definitions
    └── next-auth.d.ts    # NextAuth type extensions
```

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Users
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user profile

### Projects
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
  timestamps: true
}
```

### Project Model
```typescript
{
  name: string,
  description: string,
  timeline: string,
  members: ObjectId[],
  createdBy: ObjectId,
  timestamps: true
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