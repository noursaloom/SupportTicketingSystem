import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface UpdateTicketRequest {
  ticketId: string;
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: UpdateTicketRequest = await req.json();

    if (!requestData.ticketId) {
      return new Response(
        JSON.stringify({ error: 'ticketId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', requestData.ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let canUpdate = false;
    let allowedFields: string[] = [];

    if (currentUser.role === 'manager') {
      canUpdate = true;
      allowedFields = ['title', 'description', 'status', 'priority'];
    } else if (currentUser.role === 'applier' && ticket.created_by === user.id && !ticket.assigned_to) {
      canUpdate = true;
      allowedFields = ['title', 'description', 'priority'];
    } else if (currentUser.role === 'receiver' && ticket.assigned_to === user.id) {
      canUpdate = true;
      allowedFields = ['status'];
    }

    if (!canUpdate) {
      return new Response(
        JSON.stringify({ 
          error: currentUser.role === 'applier' && ticket.assigned_to
            ? 'You cannot edit this ticket because it has been assigned'
            : 'You do not have permission to update this ticket'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateData: any = {};
    let hasValidUpdates = false;

    if (requestData.title && allowedFields.includes('title')) {
      updateData.title = requestData.title;
      hasValidUpdates = true;
    }
    if (requestData.description && allowedFields.includes('description')) {
      updateData.description = requestData.description;
      hasValidUpdates = true;
    }
    if (requestData.status && allowedFields.includes('status')) {
      updateData.status = requestData.status;
      hasValidUpdates = true;
    }
    if (requestData.priority && allowedFields.includes('priority')) {
      updateData.priority = requestData.priority;
      hasValidUpdates = true;
    }

    if (!hasValidUpdates) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update based on your permissions' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', requestData.ticketId)
      .select(`
        *,
        projects(name),
        creator:created_by(full_name),
        assignee:assigned_to(full_name)
      `)
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requestData.status && ticket.status !== requestData.status && ticket.created_by !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.created_by,
          ticket_id: ticket.id,
          type: 'ticket_updated',
          message: `Your ticket "${ticket.title}" status changed to ${requestData.status}`
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket: {
          id: updatedTicket.id,
          title: updatedTicket.title,
          description: updatedTicket.description,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          projectId: updatedTicket.project_id,
          projectName: updatedTicket.projects?.name,
          createdBy: updatedTicket.created_by,
          createdByName: updatedTicket.creator?.full_name,
          assignedTo: updatedTicket.assigned_to,
          assignedToName: updatedTicket.assignee?.full_name,
          createdAt: updatedTicket.created_at,
          updatedAt: updatedTicket.updated_at,
          assignedAt: updatedTicket.assigned_at
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});