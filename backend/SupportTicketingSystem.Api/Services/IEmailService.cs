using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(EmailNotificationDto emailDto);
    Task SendTicketCreatedEmailAsync(Ticket ticket, User recipient);
    Task SendTicketStatusChangedEmailAsync(Ticket ticket, TicketStatus oldStatus, User recipient);
    Task SendTicketAssignedEmailAsync(Ticket ticket, User recipient);
    Task SendUserAddedToProjectEmailAsync(Project project, User user, User addedBy);
    Task SendNewUserAccountEmailAsync(User user, string temporaryPassword);
}