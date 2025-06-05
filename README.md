# LocaList

A location-aware community platform that brings neighbors together through local events and community issue reporting. Built with Next.js 15, TypeScript, and SQLite.

## 🌟 Overview

LocaList combines event discovery with community issue reporting in a single, user-friendly platform. The application uses GPS-based filtering to show only relevant content within a 3-5km radius, ensuring users see what matters in their immediate neighborhood.

## ✨ Key Features

### 🎉 Event Management
- **Event Categories**: Garage Sales, Sports Matches, Community Classes, Volunteer Opportunities, Exhibitions, Small Festivals, Lost & Found
- **Smart Priority**: Lost & Found events are marked as urgent and highlighted for 24 hours
- **Paid Events**: Support for ticket tiers (Platinum, Gold, Standard) with payment tracking
- **Photo Albums**: Up to 3-5 photos per event with gallery display
- **Event Voting**: Community upvoting system to highlight popular events
- **Event Following**: Users can follow events for updates
- **Live Countdowns**: Real-time countdown badges for upcoming events
- **Auto-Approval**: Verified organizers get automatic event approval
- **Post-Event Feedback**: Rating and review system for completed events

### 🚨 Issue Reporting
- **Issue Categories**: Roads, Lighting, Water Supply, Cleanliness, Public Safety, Obstructions
- **Status Tracking**: Reported → In Progress → Resolved with real-time updates
- **Anonymous Reporting**: Option to report issues without revealing identity
- **Photo Evidence**: Support for up to 5 photos per issue report
- **Community Voting**: Upvote system to prioritize important issues
- **Issue Following**: Track status updates on reported issues
- **Map Integration**: Location-based reporting with GPS coordinates

### 👥 User Features
- **Role Management**: Regular users, verified organizers, and administrators
- **Location-Aware**: GPS-based filtering within 3-5km radius
- **Smart Notifications**: Event reminders and issue status updates
- **User Profiles**: Manage personal information and view activity history
- **Community Guidelines**: Content moderation and violation reporting
- **Safety First**: User banning system and content flagging

### 🛡️ Safety & Moderation
- **Content Moderation**: Admin review system for events and issues
- **Community Guidelines**: Clear rules and enforcement mechanisms
- **User Verification**: Verified organizer system for trusted event creators
- **Violation Reporting**: Easy reporting of inappropriate content
- **Automatic Flagging**: System-level content monitoring

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: Custom component library with React Hook Form
- **Icons**: React Icons (Feather Icons)
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation

### Backend
- **Database**: SQLite with custom repository pattern
- **Authentication**: NextAuth.js with credentials provider
- **API**: RESTful APIs with proper error handling
- **File Uploads**: Prepared for integration with file storage services
- **Location Services**: Haversine formula for distance calculations
- **Password Security**: bcrypt for password hashing

### Database Schema
The application uses 15+ interconnected tables:

**Core Tables:**
- `users` - User accounts and profiles
- `events` - Event information and metadata
- `issues` - Community issue reports
- `interests` - Event registrations

**Relationship Tables:**
- `event_votes` / `issue_votes` - Voting systems
- `event_followers` / `issue_followers` - Following functionality
- `event_photos` / `issue_photos` - Photo storage
- `issue_status_updates` - Issue tracking
- `event_feedback` - Post-event reviews
- `notifications` - User notifications
- `violation_reports` - Content moderation

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LocaList
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXTAUTH_SECRET=your-nextauth-secret-key
   NEXTAUTH_URL=http://localhost:3000
   DATABASE_URL=./data/community-pulse.db
   ```

4. **Initialize the database**
   ```bash
   npm run reset-db
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage Guide

### For Community Members

1. **Getting Started**
   - Register for an account or sign in
   - Allow location access for personalized content
   - Explore events and issues in your area

2. **Finding Events**
   - Browse events by category
   - Use search and filters
   - View event details and photos
   - Register for events you're interested in

3. **Reporting Issues**
   - Navigate to the Issues page
   - Click "Report Issue" 
   - Fill out the form with details and photos
   - Track the status of your reports

4. **Community Engagement**
   - Vote on events and issues
   - Follow events for updates
   - Leave feedback after attending events
   - Help prioritize community needs

### For Event Organizers

1. **Creating Events**
   - Apply for verified organizer status
   - Create detailed event listings
   - Upload photos and set categories
   - Manage registration and tickets

2. **Managing Events**
   - Track registrations and attendees
   - Communicate with participants
   - Update event details as needed
   - Collect feedback post-event

### For Administrators

1. **Content Moderation**
   - Review flagged content
   - Approve/reject events
   - Manage user accounts
   - Monitor community guidelines

2. **Platform Management**
   - Track platform usage
   - Manage violation reports
   - Verify organizers
   - Maintain community standards

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data
- `npm run reset-db` - Reset database schema
- `npm run validate-db` - Validate database integrity

### Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── (routes)/       # Page routes
│   └── globals.css     # Global styles
├── components/         # Reusable React components
│   ├── ui/            # Basic UI components
│   ├── events/        # Event-specific components
│   ├── issues/        # Issue-specific components
│   └── layouts/       # Layout components
├── lib/               # Utility libraries
│   ├── db.ts          # Database operations
│   ├── auth.ts        # Authentication utilities
│   └── utils.ts       # Helper functions
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
└── providers/         # React context providers
```

### API Endpoints

**Authentication:**
- `POST /api/register` - User registration
- `POST /api/auth/[...nextauth]` - Authentication

**Events:**
- `GET /api/events` - List events with filters
- `POST /api/events` - Create new event
- `POST /api/events/[id]/vote` - Vote on event
- `POST /api/events/register` - Register for event

**Issues:**
- `GET /api/issues` - List issues with filters
- `POST /api/issues` - Create new issue
- `POST /api/issues/[id]/vote` - Vote on issue

## 🔒 Security Features

- **Authentication**: Secure user authentication with NextAuth.js
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive form validation with Zod
- **SQL Injection Protection**: Parameterized queries
- **Content Security**: Content moderation and flagging system
- **Privacy**: Anonymous reporting options
- **Data Protection**: Secure password hashing with bcrypt

## 🌍 Location Features

- **GPS Integration**: Automatic location detection
- **Distance Filtering**: 3-5km radius-based content
- **Manual Location**: Option to enter location manually
- **Privacy**: Location data stored securely
- **Accuracy**: High-precision coordinate tracking

## 📊 Community Guidelines

1. **Respectful Communication**: Be kind and constructive
2. **Accurate Information**: Provide truthful event and issue details
3. **Local Focus**: Keep content relevant to the community
4. **Safety First**: Report unsafe conditions promptly
5. **No Spam**: Avoid duplicate or promotional content
6. **Privacy**: Respect others' privacy and personal information

## 🤝 Contributing

We welcome contributions to improve Community Pulse! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please:
- Check the documentation
- Search existing issues
- Create a new issue if needed
- Contact the development team

## 🚧 Video

video 1 - https://drive.google.com/file/d/1GvLR5rwrUSN4yg6KM-kvoZaiasXfCZds/view?usp=sharing
video 2 - https://drive.google.com/file/d/1SIlpn6dnYdGeG6FHo4LYTwYMki0-Af3t/view?usp=sharing

---

**Community Pulse** - Connecting neighbors, building stronger communities. 🏘️✨
