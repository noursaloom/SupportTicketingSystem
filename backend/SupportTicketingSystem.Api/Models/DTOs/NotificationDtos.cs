namespace SupportTicketingSystem.Api.Models.DTOs;

public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TicketId { get; set; }
    public NotificationType Type { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TicketTitle { get; set; }
    public string? ProjectName { get; set; }
    public string? CreatorName { get; set; }
    public string? DescriptionSummary { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public TicketDto Ticket { get; set; } = null!;
    
    public string TypeDisplayName => Type switch
    {
        NotificationType.TicketCreated => "Ticket Created",
        NotificationType.TicketAssigned => "Ticket Assigned",
        NotificationType.TicketStatusChanged => "Status Changed",
        NotificationType.TicketUpdated => "Ticket Updated",
        _ => "Unknown"
    };
}

public class MarkNotificationReadDto
{
    public bool IsRead { get; set; } = true;
}