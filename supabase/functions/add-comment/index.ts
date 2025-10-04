import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AddCommentRequest {
  ticketId: string;
  comment: string;
  isInternal: boolean;
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

    const requestData: AddCommentRequest = await req.json();

    if (!requestData.ticketId || !requestData.comment) {
      return new Response(
        JSON.stringify({ error: 'ticketId and comment are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title, created_by, assigned_to')
      .eq('id', requestData.ticketId)
      .maybeSingle();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canComment = 
      currentUser.role === 'manager' ||
      ticket.created_by === user.id ||
      ticket.assigned_to === user.id;

    if (!canComment) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to comment on this ticket' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requestData.isInternal && currentUser.role !== 'receiver' && currentUser.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Only receivers and managers can add internal notes' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: comment, error: commentError } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: requestData.ticketId,
        user_id: user.id,
        comment: requestData.comment,
        is_internal: requestData.isInternal || false
      })
      .select(`
        *,
        users(full_name)
      `)
      .single();

    if (commentError) {
      console.error('Comment creation error:', commentError);
      return new Response(
        JSON.stringify({ error: commentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!requestData.isInternal && ticket.created_by !== user.id && ticket.created_by) {
      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.created_by,
          ticket_id: ticket.id,
          type: 'ticket_commented',
          message: `${currentUser.full_name} commented on your ticket "${ticket.title}"`
        });
    }

    if (!requestData.isInternal && ticket.assigned_to && ticket.assigned_to !== user.id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: ticket.assigned_to,
          ticket_id: ticket.id,
          type: 'ticket_commented',
          message: `${currentUser.full_name} commented on ticket "${ticket.title}"`
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        comment: {
          id: comment.id,
          ticketId: comment.ticket_id,
          userId: comment.user_id,
          userName: comment.users?.full_name,
          comment: comment.comment,
          isInternal: comment.is_internal,
          createdAt: comment.created_at
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});