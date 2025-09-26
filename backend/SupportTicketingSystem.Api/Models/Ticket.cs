namespace SupportTicketingSystem.Api.Models;

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Low;
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Foreign keys
    public int CreatedByUserId { get; set; }
    public int? AssignedToUserId { get; set; }
    
    // Navigation properties
    public virtual User CreatedByUser { get; set; } = null!;
    public virtual User? AssignedToUser { get; set; }
}

public enum TicketPriority
{
    Low = 0,
    Medium = 1,
    High = 2
}

public enum TicketStatus
{
    Open = 0,
    Pending = 1,
    Resolved = 2,
    Closed = 3
}