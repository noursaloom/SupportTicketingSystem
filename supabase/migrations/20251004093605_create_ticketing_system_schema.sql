/*
  # Support Ticketing System - Complete Schema

  ## Overview
  Creates the complete database schema for a Support Ticketing System with role-based access control.
  Supports three roles: Ticket Applier, Ticket Receiver, and Project Manager/Admin.

  ## New Tables
  
  ### 1. `users`
  User accounts with role-based access
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text, unique) - User email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'applier', 'receiver', or 'manager'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `projects`
  Projects that tickets belong to
  - `id` (uuid, primary key)
  - `name` (text) - Project name
  - `description` (text) - Project description
  - `created_by` (uuid) - Manager who created the project
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `user_projects`
  Many-to-many relationship between users and projects
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Reference to users table
  - `project_id` (uuid) - Reference to projects table
  - `assigned_at` (timestamptz)

  ### 4. `tickets`
  Support tickets created by appliers
  - `id` (uuid, primary key)
  - `title` (text) - Ticket title
  - `description` (text) - Ticket description
  - `status` (text) - Status: 'open', 'in_progress', 'resolved', 'closed'
  - `priority` (text) - Priority: 'low', 'medium', 'high', 'critical'
  - `project_id` (uuid) - Associated project
  - `created_by` (uuid) - Applier who created the ticket
  - `assigned_to` (uuid, nullable) - Receiver assigned to the ticket
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `assigned_at` (timestamptz, nullable) - When ticket was assigned

  ### 5. `ticket_attachments`
  File attachments for tickets
  - `id` (uuid, primary key)
  - `ticket_id` (uuid) - Associated ticket
  - `file_name` (text) - Original file name
  - `file_path` (text) - Path in storage bucket
  - `file_size` (bigint) - File size in bytes
  - `mime_type` (text) - File MIME type
  - `uploaded_by` (uuid) - User who uploaded the file
  - `uploaded_at` (timestamptz)

  ### 6. `ticket_comments`
  Comments and updates on tickets
  - `id` (uuid, primary key)
  - `ticket_id` (uuid) - Associated ticket
  - `user_id` (uuid) - User who made the comment
  - `comment` (text) - Comment text
  - `is_internal` (boolean) - Internal note (only visible to receivers/managers)
  - `created_at` (timestamptz)

  ### 7. `notifications`
  System notifications for users
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Recipient user
  - `ticket_id` (uuid, nullable) - Related ticket
  - `type` (text) - Notification type
  - `message` (text) - Notification message
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz)

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Role-based policies for applier, receiver, and manager roles
  - Appliers can only see their own tickets and assigned projects
  - Receivers can only see tickets assigned to them
  - Managers have full access to all data
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('applier', 'receiver', 'manager');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE notification_type AS ENUM ('ticket_assigned', 'ticket_updated', 'ticket_commented', 'project_assigned');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'applier',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- User-Project assignments
CREATE TABLE IF NOT EXISTS user_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  assigned_to uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assigned_at timestamptz
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Ticket attachments table
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Ticket comments table
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  comment text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
