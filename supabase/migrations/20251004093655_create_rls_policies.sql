/*
  # Row Level Security Policies

  ## Overview
  Implements comprehensive RLS policies for the Support Ticketing System.
  Enforces role-based access control for three roles:
  - Ticket Applier: Can create tickets, view own tickets and assigned projects
  - Ticket Receiver: Can view assigned tickets, update status, cannot create tickets
  - Project Manager: Full access to all data

  ## Security Rules

  ### Users Table
  - All authenticated users can view other users
  - Only managers can insert/update/delete users
  - Users can view their own profile

  ### Projects Table
  - Managers can do everything
  - Appliers and Receivers can view projects they're assigned to

  ### User Projects Table
  - Managers can assign users to projects
  - Users can view their own project assignments

  ### Tickets Table
  - Appliers can create tickets for their assigned projects
  - Appliers can view tickets they created or tickets in their projects
  - Appliers can update their own tickets only if not yet assigned
  - Receivers can view tickets assigned to them
  - Receivers can update tickets assigned to them
  - Managers can view and update all tickets

  ### Ticket Attachments Table
  - Users can upload attachments to tickets they have access to
  - Users can view attachments for tickets they can view

  ### Ticket Comments Table
  - Users can add comments to tickets they have access to
  - Users can view comments on tickets they can view
  - Internal comments only visible to receivers and managers

  ### Notifications Table
  - Users can view their own notifications
  - Users can update their own notifications (mark as read)
*/

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Users can view all users (needed for dropdowns and assignments)
CREATE POLICY "Users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Only managers can insert users
CREATE POLICY "Managers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update users
CREATE POLICY "Managers can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete users
CREATE POLICY "Managers can delete users"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- PROJECTS TABLE POLICIES
-- =============================================

-- Managers can view all projects
CREATE POLICY "Managers can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Users can view projects they're assigned to
CREATE POLICY "Users can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE user_projects.project_id = projects.id
      AND user_projects.user_id = auth.uid()
    )
  );

-- Only managers can insert projects
CREATE POLICY "Managers can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can update projects
CREATE POLICY "Managers can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete projects
CREATE POLICY "Managers can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- USER_PROJECTS TABLE POLICIES
-- =============================================

-- Managers can view all user-project assignments
CREATE POLICY "Managers can view all user projects"
  ON user_projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Users can view their own project assignments
CREATE POLICY "Users can view own project assignments"
  ON user_projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only managers can assign users to projects
CREATE POLICY "Managers can insert user projects"
  ON user_projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can remove user-project assignments
CREATE POLICY "Managers can delete user projects"
  ON user_projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- TICKETS TABLE POLICIES
-- =============================================

-- Appliers can view tickets they created
CREATE POLICY "Appliers can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'applier'
    )
  );

-- Appliers can view tickets in their assigned projects
CREATE POLICY "Appliers can view project tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_projects
      WHERE user_projects.project_id = tickets.project_id
      AND user_projects.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'applier'
    )
  );

-- Receivers can view tickets assigned to them
CREATE POLICY "Receivers can view assigned tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'receiver'
    )
  );

-- Managers can view all tickets
CREATE POLICY "Managers can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Appliers can create tickets for their assigned projects
CREATE POLICY "Appliers can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'applier'
    )
    AND EXISTS (
      SELECT 1 FROM user_projects
      WHERE user_projects.project_id = tickets.project_id
      AND user_projects.user_id = auth.uid()
    )
  );

-- Managers can create tickets
CREATE POLICY "Managers can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Appliers can update their own tickets only if not assigned
CREATE POLICY "Appliers can update own unassigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND assigned_to IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'applier'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND assigned_to IS NULL
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'applier'
    )
  );

-- Receivers can update tickets assigned to them
CREATE POLICY "Receivers can update assigned tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'receiver'
    )
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'receiver'
    )
  );

-- Managers can update all tickets
CREATE POLICY "Managers can update all tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Only managers can delete tickets
CREATE POLICY "Managers can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- TICKET_ATTACHMENTS TABLE POLICIES
-- =============================================

-- Users can view attachments for tickets they can access
CREATE POLICY "Users can view ticket attachments"
  ON ticket_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'manager'
        )
        OR EXISTS (
          SELECT 1 FROM user_projects
          WHERE user_projects.project_id = tickets.project_id
          AND user_projects.user_id = auth.uid()
        )
      )
    )
  );

-- Users can upload attachments to tickets they can access
CREATE POLICY "Users can upload ticket attachments"
  ON ticket_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_attachments.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'manager'
        )
      )
    )
  );

-- Only managers can delete attachments
CREATE POLICY "Managers can delete attachments"
  ON ticket_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- TICKET_COMMENTS TABLE POLICIES
-- =============================================

-- Users can view comments on tickets they can access (excluding internal notes if not receiver/manager)
CREATE POLICY "Users can view ticket comments"
  ON ticket_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'manager'
        )
        OR EXISTS (
          SELECT 1 FROM user_projects
          WHERE user_projects.project_id = tickets.project_id
          AND user_projects.user_id = auth.uid()
        )
      )
    )
    AND (
      NOT ticket_comments.is_internal
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role IN ('receiver', 'manager')
      )
    )
  );

-- Users can add comments to tickets they can access
CREATE POLICY "Users can add ticket comments"
  ON ticket_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (
        tickets.created_by = auth.uid()
        OR tickets.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'manager'
        )
      )
    )
  );

-- Only managers can delete comments
CREATE POLICY "Managers can delete comments"
  ON ticket_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications (via edge functions)
CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
