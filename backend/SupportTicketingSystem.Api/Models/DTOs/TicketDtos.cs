namespace SupportTicketingSystem.Api.Models.DTOs;

public class CreateTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; } = 0;
}

public class UpdateTicketDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Priority { get; set; }
    public int Status { get; set; }
}

public class TicketDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public UserDto CreatedByUser { get; set; } = null!;
    public UserDto? AssignedToUser { get; set; }
}

public class AssignTicketDto
{
    public int UserId { get; set; }
}