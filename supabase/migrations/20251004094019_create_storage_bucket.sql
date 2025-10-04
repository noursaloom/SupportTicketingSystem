/*
  # Storage Bucket for Ticket Attachments

  ## Overview
  Creates a storage bucket for ticket attachments with proper security policies.

  ## Storage Bucket
  - `ticket-attachments` - Bucket for storing ticket attachment files

  ## Security Policies
  - Users can upload files to tickets they have access to
  - Users can view files from tickets they have access to
  - Only managers can delete files
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload ticket attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id::text = (storage.foldername(name))[1]
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

CREATE POLICY "Users can view ticket attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id::text = (storage.foldername(name))[1]
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

CREATE POLICY "Managers can delete ticket attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'manager'
  )
);
