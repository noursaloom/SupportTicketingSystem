using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(EmailNotificationDto emailDto)
    {
        if (!_emailSettings.EnableEmailNotifications)
        {
            _logger.LogInformation("Email notifications are disabled");
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress("", emailDto.To));
            message.Subject = emailDto.Subject;

            var bodyBuilder = new BodyBuilder();
            if (emailDto.IsHtml)
            {
                bodyBuilder.HtmlBody = emailDto.Body;
            }
            else
            {
                bodyBuilder.TextBody = emailDto.Body;
            }
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, 
                _emailSettings.EnableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
            
            if (!string.IsNullOrEmpty(_emailSettings.SmtpUsername))
            {
                await client.AuthenticateAsync(_emailSettings.SmtpUsername, _emailSettings.SmtpPassword);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}", emailDto.To);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", emailDto.To);
            // Don't throw - email failures shouldn't break the application
        }
    }

    public async Task SendTicketCreatedEmailAsync(Ticket ticket, User recipient)
    {
        var subject = $"New Ticket Created: {ticket.Title}";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;'>
                        New Support Ticket Created
                    </h2>
                    
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0; color: #333;'>{ticket.Title}</h3>
                        <p><strong>Priority:</strong> <span style='color: {GetPriorityColor(ticket.Priority)};'>{GetPriorityLabel(ticket.Priority)}</span></p>
                        <p><strong>Created by:</strong> {ticket.CreatedByUser.Name} ({ticket.CreatedByUser.Email})</p>
                        <p><strong>Created on:</strong> {ticket.CreatedAt:MMM dd, yyyy 'at' HH:mm}</p>
                        {(ticket.Project != null ? $"<p><strong>Project:</strong> {ticket.Project.Name}</p>" : "")}
                    </div>
                    
                    <div style='background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;'>
                        <h4 style='margin-top: 0; color: #555;'>Description:</h4>
                        <p style='white-space: pre-wrap;'>{ticket.Description}</p>
                    </div>
                    
                    <div style='margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 8px;'>
                        <p style='margin: 0;'><strong>Action Required:</strong> Please review and assign this ticket as needed.</p>
                    </div>
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;'>
                    <p style='font-size: 12px; color: #666; text-align: center;'>
                        This is an automated notification from the Support Ticketing System.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(new EmailNotificationDto
        {
            To = recipient.Email,
            Subject = subject,
            Body = body,
            IsHtml = true
        });
    }

    public async Task SendTicketStatusChangedEmailAsync(Ticket ticket, TicketStatus oldStatus, User recipient)
    {
        var subject = $"Ticket Status Updated: {ticket.Title}";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #388e3c; border-bottom: 2px solid #388e3c; padding-bottom: 10px;'>
                        Ticket Status Updated
                    </h2>
                    
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0; color: #333;'>{ticket.Title}</h3>
                        <div style='display: flex; align-items: center; margin: 15px 0;'>
                            <span style='background-color: #ffebee; color: #d32f2f; padding: 4px 12px; border-radius: 16px; font-size: 12px; margin-right: 10px;'>
                                {GetStatusLabel(oldStatus)}
                            </span>
                            <span style='margin: 0 10px; color: #666;'>→</span>
                            <span style='background-color: #e8f5e8; color: #388e3c; padding: 4px 12px; border-radius: 16px; font-size: 12px;'>
                                {GetStatusLabel(ticket.Status)}
                            </span>
                        </div>
                        <p><strong>Updated on:</strong> {DateTime.UtcNow:MMM dd, yyyy 'at' HH:mm}</p>
                        {(ticket.AssignedToUser != null ? $"<p><strong>Assigned to:</strong> {ticket.AssignedToUser.Name}</p>" : "")}
                        {(ticket.Project != null ? $"<p><strong>Project:</strong> {ticket.Project.Name}</p>" : "")}
                    </div>
                    
                    <div style='margin-top: 30px; padding: 20px; background-color: #e8f5e8; border-radius: 8px;'>
                        <p style='margin: 0;'><strong>Status Update:</strong> Your ticket status has been changed from {GetStatusLabel(oldStatus)} to {GetStatusLabel(ticket.Status)}.</p>
                    </div>
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;'>
                    <p style='font-size: 12px; color: #666; text-align: center;'>
                        This is an automated notification from the Support Ticketing System.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(new EmailNotificationDto
        {
            To = recipient.Email,
            Subject = subject,
            Body = body,
            IsHtml = true
        });
    }

    public async Task SendTicketAssignedEmailAsync(Ticket ticket, User recipient)
    {
        var subject = $"Ticket Assigned to You: {ticket.Title}";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #f57c00; border-bottom: 2px solid #f57c00; padding-bottom: 10px;'>
                        Ticket Assigned to You
                    </h2>
                    
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0; color: #333;'>{ticket.Title}</h3>
                        <p><strong>Priority:</strong> <span style='color: {GetPriorityColor(ticket.Priority)};'>{GetPriorityLabel(ticket.Priority)}</span></p>
                        <p><strong>Status:</strong> {GetStatusLabel(ticket.Status)}</p>
                        <p><strong>Created by:</strong> {ticket.CreatedByUser.Name} ({ticket.CreatedByUser.Email})</p>
                        <p><strong>Assigned on:</strong> {DateTime.UtcNow:MMM dd, yyyy 'at' HH:mm}</p>
                        {(ticket.Project != null ? $"<p><strong>Project:</strong> {ticket.Project.Name}</p>" : "")}
                    </div>
                    
                    <div style='background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;'>
                        <h4 style='margin-top: 0; color: #555;'>Description:</h4>
                        <p style='white-space: pre-wrap;'>{ticket.Description}</p>
                    </div>
                    
                    <div style='margin-top: 30px; padding: 20px; background-color: #fff3e0; border-radius: 8px;'>
                        <p style='margin: 0;'><strong>Action Required:</strong> This ticket has been assigned to you. Please review and take appropriate action.</p>
                    </div>
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;'>
                    <p style='font-size: 12px; color: #666; text-align: center;'>
                        This is an automated notification from the Support Ticketing System.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(new EmailNotificationDto
        {
            To = recipient.Email,
            Subject = subject,
            Body = body,
            IsHtml = true
        });
    }

    public async Task SendUserAddedToProjectEmailAsync(Project project, User user, User addedBy)
    {
        var subject = $"Added to Project: {project.Name}";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #9c27b0; border-bottom: 2px solid #9c27b0; padding-bottom: 10px;'>
                        Added to Project
                    </h2>
                    
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0; color: #333;'>{project.Name}</h3>
                        <p><strong>Added by:</strong> {addedBy.Name} ({addedBy.Email})</p>
                        <p><strong>Added on:</strong> {DateTime.UtcNow:MMM dd, yyyy 'at' HH:mm}</p>
                    </div>
                    
                    <div style='background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;'>
                        <h4 style='margin-top: 0; color: #555;'>Project Description:</h4>
                        <p style='white-space: pre-wrap;'>{project.Description}</p>
                    </div>
                    
                    <div style='margin-top: 30px; padding: 20px; background-color: #f3e5f5; border-radius: 8px;'>
                        <p style='margin: 0;'><strong>Welcome to the team!</strong> You now have access to this project and will receive notifications for related tickets.</p>
                    </div>
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;'>
                    <p style='font-size: 12px; color: #666; text-align: center;'>
                        This is an automated notification from the Support Ticketing System.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(new EmailNotificationDto
        {
            To = user.Email,
            Subject = subject,
            Body = body,
            IsHtml = true
        });
    }

    public async Task SendNewUserAccountEmailAsync(User user, string temporaryPassword)
    {
        var subject = "Welcome to Support Ticketing System - Account Created";
        var body = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px;'>
                        Welcome to Support Ticketing System
                    </h2>
                    
                    <div style='background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                        <h3 style='margin-top: 0; color: #333;'>Your Account Has Been Created</h3>
                        <p>Hello {user.Name},</p>
                        <p>An account has been created for you in the Support Ticketing System.</p>
                    </div>
                    
                    <div style='background-color: #fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;'>
                        <h4 style='margin-top: 0; color: #555;'>Login Details:</h4>
                        <p><strong>Email:</strong> {user.Email}</p>
                        <p><strong>Temporary Password:</strong> <code style='background-color: #f5f5f5; padding: 2px 6px; border-radius: 4px;'>{temporaryPassword}</code></p>
                        <p><strong>Role:</strong> {GetRoleLabel(user.Role)}</p>
                    </div>
                    
                    <div style='margin-top: 30px; padding: 20px; background-color: #fff3e0; border-radius: 8px;'>
                        <p style='margin: 0;'><strong>Important:</strong> Please log in and change your password immediately for security purposes.</p>
                    </div>
                    
                    <hr style='margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;'>
                    <p style='font-size: 12px; color: #666; text-align: center;'>
                        This is an automated notification from the Support Ticketing System.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(new EmailNotificationDto
        {
            To = user.Email,
            Subject = subject,
            Body = body,
            IsHtml = true
        });
    }

    private static string GetPriorityColor(TicketPriority priority)
    {
        return priority switch
        {
            TicketPriority.Low => "#388e3c",
            TicketPriority.Medium => "#f57c00",
            TicketPriority.High => "#d32f2f",
            _ => "#666"
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

    private static string GetRoleLabel(UserRole role)
    {
        return role switch
        {
            UserRole.TicketApplier => "Ticket Applier",
            UserRole.TicketReceiver => "Ticket Receiver",
            UserRole.Admin => "Administrator",
            _ => "Unknown"
        };
    }
}