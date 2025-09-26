using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Include(n => n.Ticket)
            .ThenInclude(t => t.CreatedByUser)
            .Include(n => n.Ticket)
            .ThenInclude(t => t.AssignedToUser)
            .Include(n => n.Ticket)
            .ThenInclude(t => t.Project)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapToNotificationDto);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<NotificationDto> MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .Include(n => n.Ticket)
            .ThenInclude(t => t.CreatedByUser)
            .Include(n => n.Ticket)
            .ThenInclude(t => t.AssignedToUser)
            .Include(n => n.Ticket)
            .ThenInclude(t => t.Project)
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            throw new InvalidOperationException("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return MapToNotificationDto(notification);
    }

    public async Task CreateTicketCreatedNotificationAsync(Ticket ticket)
    {
        // Notify all ticket receivers and admins about new tickets
        var receiversAndAdmins = await _context.Users
            .Where(u => u.Role == UserRole.TicketReceiver || u.Role == UserRole.Admin)
            .Where(u => u.Id != ticket.CreatedByUserId) // Don't notify the creator
            .ToListAsync();

        var notifications = receiversAndAdmins.Select(user => new Notification
        {
            UserId = user.Id,
            TicketId = ticket.Id,
            Type = NotificationType.TicketCreated,
            Message = $"New ticket created: {ticket.Title}",
            CreatedAt = DateTime.UtcNow
        });

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task CreateTicketStatusChangedNotificationAsync(Ticket ticket, TicketStatus oldStatus)
    {
        // Notify the ticket creator about status changes
        if (ticket.CreatedByUserId != null)
        {
            var notification = new Notification
            {
                UserId = ticket.CreatedByUserId,
                TicketId = ticket.Id,
                Type = NotificationType.TicketStatusChanged,
                Message = $"Ticket status changed from {GetStatusLabel(oldStatus)} to {GetStatusLabel(ticket.Status)}: {ticket.Title}",
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }

    public async Task CreateTicketAssignedNotificationAsync(Ticket ticket, int? oldAssigneeId)
    {
        // Notify the newly assigned user
        if (ticket.AssignedToUserId.HasValue && ticket.AssignedToUserId != oldAssigneeId)
        {
            var notification = new Notification
            {
                UserId = ticket.AssignedToUserId.Value,
                TicketId = ticket.Id,
                Type = NotificationType.TicketAssigned,
                Message = $"You have been assigned to ticket: {ticket.Title}",
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();
        }
    }

    private static NotificationDto MapToNotificationDto(Notification notification)
    {
        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            TicketId = notification.TicketId,
            Type = notification.Type,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            Ticket = new TicketDto
            {
                Id = notification.Ticket.Id,
                Title = notification.Ticket.Title,
                Description = notification.Ticket.Description,
                Priority = notification.Ticket.Priority,
                Status = notification.Ticket.Status,
                CreatedAt = notification.Ticket.CreatedAt,
                CreatedByUser = new UserDto
                {
                    Id = notification.Ticket.CreatedByUser.Id,
                    Name = notification.Ticket.CreatedByUser.Name,
                    Email = notification.Ticket.CreatedByUser.Email,
                    Role = notification.Ticket.CreatedByUser.Role,
                    CreatedAt = notification.Ticket.CreatedByUser.CreatedAt
                },
                AssignedToUser = notification.Ticket.AssignedToUser != null ? new UserDto
                {
                    Id = notification.Ticket.AssignedToUser.Id,
                    Name = notification.Ticket.AssignedToUser.Name,
                    Email = notification.Ticket.AssignedToUser.Email,
                    Role = notification.Ticket.AssignedToUser.Role,
                    CreatedAt = notification.Ticket.AssignedToUser.CreatedAt
                } : null
            }
        };
    }

    private static string GetStatusLabel(TicketStatus status)
    {
        return status switch
        {
            TicketStatus.Open => "Open",
            TicketStatus.Pending => "Pending",
            TicketStatus.Resolved => "Resolved",
            TicketStatus.Closed => "Closed",
            _ => "Unknown"
        };
    }
}