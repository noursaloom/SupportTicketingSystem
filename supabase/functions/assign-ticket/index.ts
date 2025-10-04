import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AssignTicketRequest {
  ticketId: string;
  assignedTo: string;
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

    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!currentUser || currentUser.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Only managers can assign tickets' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ticketId, assignedTo }: AssignTicketRequest = await req.json();

    if (!ticketId || !assignedTo) {
      return new Response(
        JSON.stringify({ error: 'ticketId and assignedTo are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: receiver } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', assignedTo)
      .maybeSingle();

    if (!receiver || receiver.role !== 'receiver') {
      return new Response(
        JSON.stringify({ error: 'Can only assign to users with receiver role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ticket } = await supabase
      .from('tickets')
      .select('*, projects(name)')
      .eq('id', ticketId)
      .maybeSingle();

    if (!ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        assigned_to: assignedTo,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: assignedTo,
        ticket_id: ticketId,
        type: 'ticket_assigned',
        message: `Ticket "${ticket.title}" has been assigned to you`,
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Ticket assigned successfully' }),
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