using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task<NotificationDto> MarkAsReadAsync(int notificationId, int userId);
    Task CreateTicketCreatedNotificationAsync(Ticket ticket);
    Task CreateTicketStatusChangedNotificationAsync(Ticket ticket, TicketStatus oldStatus);
    Task CreateTicketAssignedNotificationAsync(Ticket ticket, int? oldAssigneeId);
}