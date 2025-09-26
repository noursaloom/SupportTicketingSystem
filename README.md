# Simple Support Ticketing System - MVP

A full-stack support ticketing system built with Angular and .NET 8, featuring JWT authentication, role-based access control, project management, and real-time notifications.

## Tech Stack

- **Frontend**: Angular 18+ with Angular Material
- **Backend**: .NET 8 (C#) with Entity Framework Core
- **Database**: SQLite (development/MVP)
- **Authentication**: JWT token-based authentication

## Features

### Authentication
- User registration and login
- JWT token-based authentication
- Password hashing with BCrypt
- Role-based access control (Admin/User)

### Ticket Management
- Create, read, update, delete tickets
- Priority levels (Low, Medium, High)
- Status tracking (Open, Pending, Resolved, Closed)
- Admin can assign tickets to users
- Users can only manage their own tickets

### User Management (Admin only)
- Complete user management interface
- Create, edit, and delete users
- Role-based permissions (Ticket Applier, Ticket Receiver, Admin)
- User assignment to projects

### Project Management (Admin only)
- Create and manage projects
- Assign multiple users to projects
- Associate tickets with projects
- Project-based organization

### Notification System
- Real-time notifications for ticket activities
- Notification types: Created, Assigned, Status Changed
- Unread notification counter in header
- Mark notifications as read
- Auto-polling for new notifications

## Demo Accounts

- **Admin**: admin@demo.com / password (Full access to all features)
- **Ticket Applier**: applier@demo.com / password (Can create and manage own tickets)
- **Ticket Receiver**: receiver@demo.com / password (Can view all tickets and assign them)
- **Legacy User**: user@demo.com / password (Ticket Applier role for backward compatibility)

## Project Structure

```
/
├── backend/              # .NET 8 API
│   ├── Controllers/      # API controllers
│   ├── Data/            # Database context and migrations
│   ├── Models/          # Entity models
│   ├── Services/        # Business logic services
│   └── Tests/           # Unit tests
├── frontend/            # Angular application
│   ├── src/
│   │   ├── app/         # Angular components and services
│   │   └── environments/ # Environment configurations
└── README.md
```

## Getting Started

### Quick Start with Docker

1. Clone the repository
2. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Prerequisites

- .NET 8 SDK
- Node.js 18+ and npm
- Angular CLI (`npm install -g @angular/cli`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Apply database migrations and seed data:
   ```bash
   dotnet ef database update
   ```

4. Run the API:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7001` or `http://localhost:5001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   ng serve
   ```

The frontend will be available at `http://localhost:4200`

### Running Tests

#### Backend Tests
```bash
cd backend
dotnet test
```

## Deployment Options

### 1. Docker Deployment (Recommended)

The easiest way to deploy is using Docker:

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual containers
docker build -t ticketing-backend ./backend
docker build -t ticketing-frontend ./frontend
```

### 2. Cloud Deployment

#### Heroku
1. Create two Heroku apps (backend and frontend)
2. Set environment variables in Heroku dashboard
3. Deploy using Heroku CLI or GitHub integration

#### Netlify (Frontend) + Railway/Render (Backend)
1. Deploy frontend to Netlify
2. Deploy backend to Railway or Render
3. Update environment variables with production URLs

#### Azure/AWS
1. Use Azure App Service or AWS Elastic Beanstalk
2. Configure environment variables
3. Set up database (Azure SQL or RDS)

### 3. Environment Configuration

Update these files for production:
- `frontend/src/environments/environment.prod.ts` - Set production API URL
- `backend/appsettings.Production.json` - Configure production settings
- Update CORS origins in `Program.cs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Tickets
- `GET /api/tickets` - Get tickets (all for admin, own for user)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/{id}` - Get specific ticket
- `PUT /api/tickets/{id}` - Update ticket
- `DELETE /api/tickets/{id}` - Delete ticket
- `POST /api/tickets/{id}/assign` - Assign ticket to user (Admin only)

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Projects (Admin only)
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project
- `POST /api/projects/{id}/assign-users` - Assign users to project

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark as read

## Development Notes

### Database Migrations

To create a new migration:
```bash
cd backend
dotnet ef migrations add MigrationName
dotnet ef database update
```

### Environment Variables

The application uses the following configuration (in `appsettings.json`):
- JWT secret key
- Database connection string
- CORS origins

### Future Enhancements

- PostgreSQL/MySQL support
- Email notifications
- File attachments
- WebSocket real-time updates
- Advanced filtering and search
- Audit logging
- Mobile app
- API rate limiting
- Advanced reporting

## Troubleshooting

1. **CORS Issues**: Ensure the backend CORS policy includes the frontend URL
2. **Database Issues**: Delete the SQLite file and run migrations again
3. **JWT Issues**: Check that the secret key is properly configured

## License

MIT License