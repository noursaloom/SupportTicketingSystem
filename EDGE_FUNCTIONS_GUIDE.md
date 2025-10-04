# Edge Functions Documentation

## Overview

This project includes 5 Supabase Edge Functions that enforce business logic and role-based permissions for the Support Ticketing System. All functions use JWT authentication and validate user roles before performing operations.

## Deployed Edge Functions

### 1. **assign-ticket**
Assigns a ticket to a receiver and creates a notification.

**URL:** `{SUPABASE_URL}/functions/v1/assign-ticket`

**Method:** POST

**Authentication:** Required (Bearer token)

**Role Requirements:** Manager only

**Request Body:**
```json
{
  "ticketId": "uuid",
  "assignedTo": "uuid"
}
```

**Business Rules:**
- ✅ Only managers can assign tickets
- ✅ Can only assign to users with 'receiver' role
- ✅ Automatically creates notification for the receiver
- ✅ Sets `assigned_at` timestamp
- ❌ Receivers do NOT get notified when ticket is created (only when assigned)

**Response:**
```json
{
  "success": true,
  "message": "Ticket assigned successfully"
}
```

**Error Responses:**
- 401: Invalid or missing token
- 403: Not a manager, or trying to assign to non-receiver
- 404: Ticket not found

---

### 2. **create-ticket**
Creates a new ticket with role-based validation.

**URL:** `{SUPABASE_URL}/functions/v1/create-ticket`

**Method:** POST

**Authentication:** Required (Bearer token)

**Role Requirements:** Applier or Manager

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "priority": "low" | "medium" | "high" | "critical",
  "projectId": "uuid"
}
```

**Business Rules:**
- ✅ Only appliers and managers can create tickets
- ✅ Appliers can ONLY create tickets for projects they're assigned to
- ✅ Managers can create tickets for any project
- ✅ Ticket status automatically set to 'open'
- ✅ Validates project exists before creating ticket

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "status": "open",
    "priority": "medium",
    "projectId": "uuid",
    "projectName": "string",
    "createdBy": "uuid",
    "createdByName": "string",
    "assignedTo": null,
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**
- 400: Missing required fields
- 401: Invalid or missing token
- 403: Receiver trying to create, or applier creating for unassigned project
- 404: Project not found

---

### 3. **update-ticket**
Updates ticket fields based on role permissions.

**URL:** `{SUPABASE_URL}/functions/v1/update-ticket`

**Method:** POST

**Authentication:** Required (Bearer token)

**Role Requirements:** Varies by field

**Request Body:**
```json
{
  "ticketId": "uuid",
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "open|in_progress|resolved|closed (optional)",
  "priority": "low|medium|high|critical (optional)"
}
```

**Business Rules by Role:**

**Manager:**
- ✅ Can update ALL fields: title, description, status, priority
- ✅ Can update any ticket

**Applier:**
- ✅ Can update title, description, priority
- ✅ ONLY on own tickets
- ✅ ONLY if ticket is NOT yet assigned
- ❌ Cannot update status
- ❌ Cannot update after assignment

**Receiver:**
- ✅ Can update status ONLY
- ✅ ONLY on tickets assigned to them
- ❌ Cannot update title, description, priority

**Additional Features:**
- ✅ Notifies ticket creator when status changes (if not the one making change)
- ✅ Returns full ticket object with updated values

**Response:**
```json
{
  "success": true,
  "ticket": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "status": "in_progress",
    "priority": "high",
    "projectId": "uuid",
    "projectName": "string",
    "createdBy": "uuid",
    "createdByName": "string",
    "assignedTo": "uuid",
    "assignedToName": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "assignedAt": "timestamp"
  }
}
```

**Error Responses:**
- 400: No valid fields to update, or missing ticketId
- 401: Invalid or missing token
- 403: Insufficient permissions for requested update
- 404: Ticket not found

---

### 4. **upload-attachment**
Uploads file attachments to tickets with validation.

**URL:** `{SUPABASE_URL}/functions/v1/upload-attachment`

**Method:** POST

**Authentication:** Required (Bearer token)

**Content-Type:** multipart/form-data

**Role Requirements:** Any authenticated user with access to the ticket

**Form Data:**
```
ticketId: uuid
file: File
```

**Business Rules:**
- ✅ Managers can upload to any ticket
- ✅ Appliers can upload to tickets they created
- ✅ Receivers can upload to tickets assigned to them
- ✅ Maximum file size: 10MB
- ✅ Allowed file types:
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, Word (DOC/DOCX), Excel (XLS/XLSX)
  - Text: TXT, CSV

**File Storage:**
- Path: `{ticketId}/{timestamp}_{sanitized_filename}`
- Bucket: `ticket-attachments` (private)
- Automatic cleanup if database insert fails

**Response:**
```json
{
  "success": true,
  "attachment": {
    "id": "uuid",
    "ticketId": "uuid",
    "fileName": "document.pdf",
    "filePath": "uuid/123456_document.pdf",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "uploadedBy": "uuid",
    "uploadedAt": "timestamp"
  }
}
```

**Error Responses:**
- 400: Missing file/ticketId, file too large, or unsupported file type
- 401: Invalid or missing token
- 403: No permission to upload to this ticket
- 404: Ticket not found
- 500: Upload or database error

---

### 5. **add-comment**
Adds comments or internal notes to tickets with notifications.

**URL:** `{SUPABASE_URL}/functions/v1/add-comment`

**Method:** POST

**Authentication:** Required (Bearer token)

**Role Requirements:** Any user with access to the ticket

**Request Body:**
```json
{
  "ticketId": "uuid",
  "comment": "string",
  "isInternal": boolean
}
```

**Business Rules:**

**Comment Permissions:**
- ✅ Managers can comment on any ticket
- ✅ Appliers can comment on tickets they created
- ✅ Receivers can comment on tickets assigned to them

**Internal Notes:**
- ✅ Only receivers and managers can create internal notes (isInternal: true)
- ✅ Internal notes NOT visible to appliers
- ✅ Used for receiver-to-manager communication

**Notifications:**
- ✅ Regular comments notify ticket creator (if not the commenter)
- ✅ Regular comments notify assigned receiver (if not the commenter)
- ❌ Internal notes do NOT trigger notifications

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "ticketId": "uuid",
    "userId": "uuid",
    "userName": "John Doe",
    "comment": "Comment text",
    "isInternal": false,
    "createdAt": "timestamp"
  }
}
```

**Error Responses:**
- 400: Missing ticketId or comment
- 401: Invalid or missing token
- 403: No permission to comment, or non-receiver trying internal note
- 404: Ticket not found

---

## Usage Examples

### Frontend Integration

#### Create Ticket
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-ticket`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Bug in login page',
      description: 'Users cannot log in with valid credentials',
      priority: 'high',
      projectId: 'project-uuid-here'
    })
  }
);
const result = await response.json();
```

#### Upload Attachment
```typescript
const formData = new FormData();
formData.append('ticketId', ticketId);
formData.append('file', fileInput.files[0]);

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-attachment`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: formData
  }
);
const result = await response.json();
```

#### Assign Ticket (Manager Only)
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-ticket`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticketId: 'ticket-uuid',
      assignedTo: 'receiver-uuid'
    })
  }
);
```

#### Update Ticket
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-ticket`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticketId: 'ticket-uuid',
      status: 'in_progress'
    })
  }
);
```

#### Add Comment
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-comment`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ticketId: 'ticket-uuid',
      comment: 'Working on this issue now',
      isInternal: false
    })
  }
);
```

---

## Security Features

### Authentication
- All functions require valid JWT token
- Token validated using Supabase auth
- User identity extracted from token

### Authorization
- Role checked from users table
- Permissions enforced before operations
- Clear error messages for permission denials

### Data Validation
- Required fields checked
- File types and sizes validated
- SQL injection prevented (using Supabase client)
- XSS prevention (file name sanitization)

### Error Handling
- Comprehensive try-catch blocks
- Detailed error logging (server-side)
- User-friendly error messages (client-side)
- Rollback on failures (e.g., file upload)

---

## Testing Checklist

### As Applier:
- [ ] Can create ticket for assigned project
- [ ] Cannot create ticket for unassigned project
- [ ] Can update own unassigned ticket
- [ ] Cannot update assigned ticket
- [ ] Can upload attachment to own ticket
- [ ] Can add regular comment
- [ ] Cannot add internal note

### As Receiver:
- [ ] Cannot create ticket
- [ ] Can update status of assigned ticket
- [ ] Cannot update title/description
- [ ] Can upload attachment to assigned ticket
- [ ] Can add regular comment
- [ ] Can add internal note
- [ ] Receives notification only when assigned (not on creation)

### As Manager:
- [ ] Can create ticket for any project
- [ ] Can assign ticket to receiver
- [ ] Assignment creates notification
- [ ] Can update all fields of any ticket
- [ ] Can upload attachment to any ticket
- [ ] Can add internal note
- [ ] Can add regular comment

---

## Environment Variables

All functions automatically access:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)

These are pre-configured and require no manual setup.
