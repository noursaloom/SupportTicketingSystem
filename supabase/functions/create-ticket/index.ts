import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CreateTicketRequest {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId: string;
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

    if (currentUser.role !== 'applier' && currentUser.role !== 'manager') {
      return new Response(
        JSON.stringify({ error: 'Only appliers and managers can create tickets' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: CreateTicketRequest = await req.json();

    if (!requestData.title || !requestData.description || !requestData.priority || !requestData.projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, description, priority, projectId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (currentUser.role === 'applier') {
      const { data: userProject, error: projectError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('project_id', requestData.projectId)
        .maybeSingle();

      if (projectError || !userProject) {
        return new Response(
          JSON.stringify({ error: 'You can only create tickets for projects you are assigned to' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { data: project, error: projectCheckError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', requestData.projectId)
      .maybeSingle();

    if (projectCheckError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title: requestData.title,
        description: requestData.description,
        priority: requestData.priority,
        project_id: requestData.projectId,
        created_by: user.id,
        status: 'open'
      })
      .select(`
        *,
        projects(name),
        creator:created_by(full_name)
      `)
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return new Response(
        JSON.stringify({ error: ticketError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket: {
          id: ticket.id,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          projectId: ticket.project_id,
          projectName: ticket.projects?.name,
          createdBy: ticket.created_by,
          createdByName: ticket.creator?.full_name,
          assignedTo: ticket.assigned_to,
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at
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