using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Models;

namespace SupportTicketingSystem.Api.Data;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // Check if data already exists
        if (await context.Users.AnyAsync())
            return;

        // Create demo users
        var adminUser = new User
        {
            Name = "Admin User",
            Email = "admin@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        var regularUser = new User
        {
            Name = "Regular User",
            Email = "user@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = UserRole.User,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(adminUser, regularUser);
        await context.SaveChangesAsync();

        // Create demo tickets
        var tickets = new[]
        {
            new Ticket
            {
                Title = "Login Issue",
                Description = "Cannot login to the system with correct credentials",
                Priority = TicketPriority.High,
                Status = TicketStatus.Open,
                CreatedByUserId = regularUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new Ticket
            {
                Title = "Feature Request: Dark Mode",
                Description = "Please add dark mode theme option to the application",
                Priority = TicketPriority.Low,
                Status = TicketStatus.Pending,
                CreatedByUserId = regularUser.Id,
                AssignedToUserId = adminUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Ticket
            {
                Title = "Performance Issue",
                Description = "Application is running slow when loading ticket list",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Open,
                CreatedByUserId = regularUser.Id,
                CreatedAt = DateTime.UtcNow.AddHours(-6)
            },
            new Ticket
            {
                Title = "Bug: Email Notifications",
                Description = "Not receiving email notifications for ticket updates",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Resolved,
                CreatedByUserId = regularUser.Id,
                AssignedToUserId = adminUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new Ticket
            {
                Title = "UI Improvement Suggestion",
                Description = "The ticket form could use better validation messages",
                Priority = TicketPriority.Low,
                Status = TicketStatus.Closed,
                CreatedByUserId = regularUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            }
        };

        context.Tickets.AddRange(tickets);
        await context.SaveChangesAsync();
    }
}