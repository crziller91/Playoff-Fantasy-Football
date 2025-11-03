# Playoff Fantasy Football

A fantasy football draft board application for the NFL playoffs.

**Live Application:** [https://playoff-fantasy-football.vercel.app/](https://playoff-fantasy-football.vercel.app/)

## How It Works

Playoff Fantasy Football is a unique fantasy football experience focused exclusively on the NFL playoffs. Here's how the application works:

### Draft Phase
- **Team Setup**: Multiple teams compete in a draft with a budget of $200 each
- **Snake Draft**: Teams take turns drafting NFL players in a snake draft format
- **Budget Management**: Each pick costs money, and teams must manage their budget wisely
- **Player Selection**: Draft from active NFL playoff teams across all positions (QB, RB, WR, TE, K)
- **Real-time Updates**: Live draft board updates using WebSocket connections so all participants see picks as they happen

### Scoring Phase
- **Playoff Rounds**: Scores are tracked across all playoff rounds (Wild Card, Divisional, Conference Championship, Super Bowl)
- **Automatic Scoring**: Integration with ESPN API to automatically fetch player statistics and calculate scores
- **Scoring Rules**: Customizable scoring rules based on position and stat categories (passing yards, touchdowns, etc.)
- **Player Status Tracking**: Players are automatically disabled when their teams are eliminated from the playoffs
- **Manual Overrides**: Admins can manually edit scores and player statuses when needed

### Features
- **Authentication**: Secure user authentication with NextAuth.js
- **Role-based Permissions**: Admin users can manage scores and permissions
- **Live Draft Board**: Visual representation of all team picks and remaining budget
- **Player Search**: Search for players using ESPN's database
- **Score Management**: Track and update player scores throughout the playoffs
- **Responsive Design**: Works on desktop and mobile devices

## Database Setup

This application uses PostgreSQL (configured for Neon). Update your `.env` with a `DATABASE_URL` for your Postgres database. Example values are included in `.env.example`.

Quick setup steps:

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate the Prisma client (this will also run automatically during build/postinstall):

   ```bash
   npm run prisma:generate
   ```

3. Apply migrations (for local dev):

   ```bash
   npx prisma migrate dev --name init
   ```

4. Seed the database:

   ```bash
   npm run prisma:seed
   ```

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

For development with WebSocket support (for live draft updates):

```bash
npm run dev:all
```

This runs both the Next.js dev server and the WebSocket server concurrently.

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

```bash
npm run build
npm start
```

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Real-time Communication**: Socket.io
- **UI Components**: [Flowbite React](https://flowbite-react.com/)
- **Styling**: Tailwind CSS
- **State Management**: MobX
- **External API**: ESPN API for player data and statistics
- **Deployment**: Vercel

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# WebSocket (optional, for development)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

See `.env.example` for reference.

## Contributing

This is a personal project, but feel free to fork and adapt it for your own playoff fantasy football league!
