# LocaList

LocaList is a Next.js application that helps users find local events in their area. Users can browse events, register their interest, and even create new events.

## Features

- Browse events by category
- Search for events by title, description, or location
- Register interest in events with the number of people attending
- Create and manage events
- Admin dashboard for approving events
- User authentication
- Responsive design

## Tech Stack

- Next.js 15.x
- React 19.x
- SQLite database (no ORM)
- NextAuth.js for authentication
- TailwindCSS for styling
- React Hook Form for form handling
- Zod for validation

## Getting Started

### Prerequisites

- Node.js 18.x or newer
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/localist.git
   cd localist
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Set up your environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

4. Initialize the database:
   ```bash
   npm run reset-db
   # or
   yarn reset-db
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Management

- **Reset Database**: Drops all tables and recreates them, then seeds with sample data
  ```bash
  npm run reset-db
  ```

- **Seed Database**: Only adds sample data without dropping tables
  ```bash
  npm run seed
  ```

- **Validate Database**: Checks database integrity and displays table information
  ```bash
  npm run validate-db
  ```

## Login Credentials

After seeding the database, you can use the following credentials to log in:

- **Admin User**:
  - Email: admin@localist.com
  - Password: admin123

- **Regular User**:
  - Email: john@example.com
  - Password: password123
  - This user is a verified organizer and can create events

- **Regular User**:
  - Email: jane@example.com
  - Password: password123

## API Endpoints

- `GET /api/events`: Get all approved events
- `GET /api/events/[id]`: Get a specific event by ID
- `POST /api/events`: Create a new event
- `GET /api/events/[eventId]/interest`: Check if current user is interested in an event
- `POST /api/events/[eventId]/interest`: Register interest in an event
- `PATCH /api/events/[eventId]/interest`: Update interest in an event
- `DELETE /api/events/[eventId]/interest`: Cancel interest in an event
- `GET /api/seed`: Seed the database with sample data
- `GET /api/test`: Test database connections and get counts


Video - https://drive.google.com/file/d/1QD10BZdmL2klfCuEDNLgeF8Eq63_FnWt/view?usp=sharing
