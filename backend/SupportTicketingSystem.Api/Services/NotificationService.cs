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
            .Include(n => n.Project)
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
            .Include(n => n.Project)
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

        if (notification == null)
            throw new InvalidOperationException("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return MapToNotificationDto(notification);
    }

    public async Task CreateTicketCreatedNotificationAsync(Ticket ticket)
    {
        // Get ticket with all related data
        var fullTicket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.Project)
                .ThenInclude(p => p.UserProjects)
                .ThenInclude(up => up.User)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id);

        if (fullTicket == null) return;

        var notifications = new List<Notification>();

        // Notify ticket receivers and admins
        var receiversAndAdmins = await _context.Users
            .Where(u => u.Role == UserRole.TicketReceiver || u.Role == UserRole.Admin)
            .Where(u => u.Id != fullTicket.CreatedByUserId)
            .ToListAsync();

        // If ticket is assigned to a project, only notify users assigned to that project
        if (fullTicket.Project != null)
        {
            var projectUserIds = fullTicket.Project.UserProjects.Select(up => up.UserId).ToList();
            receiversAndAdmins = receiversAndAdmins.Where(u => projectUserIds.Contains(u.Id) || u.Role == UserRole.Admin).ToList();
        }

        foreach (var user in receiversAndAdmins)
        {
            var descriptionSummary = fullTicket.Description.Length > 100 
                ? fullTicket.Description.Substring(0, 100) + "..." 
                : fullTicket.Description;

            var message = fullTicket.Project != null
                ? $"New {GetPriorityLabel(fullTicket.Priority)} priority ticket created in project '{fullTicket.Project.Name}': {fullTicket.Title}"
                : $"New {GetPriorityLabel(fullTicket.Priority)} priority ticket created: {fullTicket.Title}";

            notifications.Add(new Notification
            {
                UserId = user.Id,
                TicketId = fullTicket.Id,
                ProjectId = fullTicket.ProjectId,
                Type = NotificationType.TicketCreated,
                Message = message,
                TicketTitle = fullTicket.Title,
                ProjectName = fullTicket.Project?.Name,
                CreatorName = fullTicket.CreatedByUser.Name,
                DescriptionSummary = descriptionSummary,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();
    }

    public async Task CreateTicketStatusChangedNotificationAsync(Ticket ticket, TicketStatus oldStatus)
    {
        // Get ticket with creator info
        var fullTicket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id);

        if (fullTicket == null) return;

        // Notify the ticket creator about status changes
        var message = $"Your ticket '{fullTicket.Title}' status changed from {GetStatusLabel(oldStatus)} to {GetStatusLabel(fullTicket.Status)}";
        
        if (fullTicket.AssignedToUser != null)
        {
            message += $" by {fullTicket.AssignedToUser.Name}";
        }

        var notification = new Notification
        {
            UserId = fullTicket.CreatedByUserId,
            TicketId = fullTicket.Id,
            ProjectId = fullTicket.ProjectId,
            Type = NotificationType.TicketStatusChanged,
            Message = message,
            TicketTitle = fullTicket.Title,
            ProjectName = fullTicket.Project?.Name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }

    public async Task CreateTicketAssignedNotificationAsync(Ticket ticket, int? oldAssigneeId)
    {
        // Get ticket with full details
        var fullTicket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id);

        if (fullTicket == null) return;

        // Notify the newly assigned user
        if (fullTicket.AssignedToUserId.HasValue && fullTicket.AssignedToUserId != oldAssigneeId)
        {
            var message = fullTicket.Project != null
                ? $"You have been assigned to ticket '{fullTicket.Title}' in project '{fullTicket.Project.Name}'"
                : $"You have been assigned to ticket '{fullTicket.Title}'";

            var notification = new Notification
            {
                UserId = fullTicket.AssignedToUserId.Value,
                TicketId = fullTicket.Id,
                ProjectId = fullTicket.ProjectId,
                Type = NotificationType.TicketAssigned,
                Message = message,
                TicketTitle = fullTicket.Title,
                ProjectName = fullTicket.Project?.Name,
                CreatorName = fullTicket.CreatedByUser.Name,
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
            TicketTitle = notification.TicketTitle,
            ProjectName = notification.ProjectName,
            CreatorName = notification.CreatorName,
            DescriptionSummary = notification.DescriptionSummary,
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

    private static string GetPriorityLabel(TicketPriority priority)
    {
        return priority switch
        {
            TicketPriority.Low => "Low",
            TicketPriority.Medium => "Medium",
            TicketPriority.High => "High",
            _ => "Unknown"
        };
    }
}