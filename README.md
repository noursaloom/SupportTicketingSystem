# Simple Support Ticketing System - MVP

A full-stack support ticketing system built with Angular and .NET 8, featuring JWT authentication and role-based access control.

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
- View all users with their roles
- Create new users with role assignment
- Edit user information and roles
- Delete users (with validation for users who have created tickets)
- Three role types:
  - **Ticket Applier**: Can create and manage their own tickets
  - **Ticket Receiver**: Can view all tickets and assign them to users
  - **Admin**: Full system access including user management

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

- PostgreSQL support (connection string change)
- Email notifications
- File attachments
- Real-time updates
- Advanced filtering and search
- Audit logging

## Troubleshooting

1. **CORS Issues**: Ensure the backend CORS policy includes the frontend URL
2. **Database Issues**: Delete the SQLite file and run migrations again
3. **JWT Issues**: Check that the secret key is properly configured

## License

MIT License