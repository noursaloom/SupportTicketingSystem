namespace SupportTicketingSystem.Api.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TicketId { get; set; }
    public int? ProjectId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TicketTitle { get; set; } = string.Empty;
    public string? ProjectName { get; set; } = string.Empty;
    public string? CreatorName { get; set; } = string.Empty;
    public string? DescriptionSummary { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Ticket Ticket { get; set; } = null!;
    public virtual Project? Project { get; set; }
}

public enum NotificationType
{
    TicketCreated = 0,
    TicketAssigned = 1,
    TicketStatusChanged = 2,
    TicketUpdated = 3
}