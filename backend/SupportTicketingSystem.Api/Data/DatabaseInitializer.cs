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

        var applierUser = new User
        {
            Name = "Ticket Applier",
            Email = "applier@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = UserRole.TicketApplier,
            CreatedAt = DateTime.UtcNow
        };

        var receiverUser = new User
        {
            Name = "Ticket Receiver",
            Email = "receiver@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = UserRole.TicketReceiver,
            CreatedAt = DateTime.UtcNow
        };

        // Keep legacy user for backward compatibility
        var legacyUser = new User
        {
            Name = "Legacy User",
            Email = "user@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            Role = UserRole.TicketApplier,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(adminUser, applierUser, receiverUser, legacyUser);
        await context.SaveChangesAsync();

        // Create demo projects
        var webProject = new Project
        {
            Name = "Web Application",
            Description = "Main web application development and maintenance",
            CreatedAt = DateTime.UtcNow
        };

        var mobileProject = new Project
        {
            Name = "Mobile App",
            Description = "Mobile application for iOS and Android platforms",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };

        var apiProject = new Project
        {
            Name = "API Services",
            Description = "Backend API services and microservices",
            CreatedAt = DateTime.UtcNow.AddDays(-5)
        };

        context.Projects.AddRange(webProject, mobileProject, apiProject);
        await context.SaveChangesAsync();

        // Assign users to projects
        var userProjects = new[]
        {
            new UserProject { UserId = applierUser.Id, ProjectId = webProject.Id, AssignedAt = DateTime.UtcNow },
            new UserProject { UserId = receiverUser.Id, ProjectId = webProject.Id, AssignedAt = DateTime.UtcNow },
            new UserProject { UserId = legacyUser.Id, ProjectId = webProject.Id, AssignedAt = DateTime.UtcNow },
            new UserProject { UserId = applierUser.Id, ProjectId = mobileProject.Id, AssignedAt = DateTime.UtcNow },
            new UserProject { UserId = receiverUser.Id, ProjectId = apiProject.Id, AssignedAt = DateTime.UtcNow }
        };

        context.UserProjects.AddRange(userProjects);
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
                CreatedByUserId = applierUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                ProjectId = webProject.Id
            },
            new Ticket
            {
                Title = "Feature Request: Dark Mode",
                Description = "Please add dark mode theme option to the application",
                Priority = TicketPriority.Low,
                Status = TicketStatus.Pending,
                CreatedByUserId = legacyUser.Id,
                AssignedToUserId = receiverUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                ProjectId = webProject.Id
            },
            new Ticket
            {
                Title = "Performance Issue",
                Description = "Application is running slow when loading ticket list",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Open,
                CreatedByUserId = applierUser.Id,
                CreatedAt = DateTime.UtcNow.AddHours(-6),
                ProjectId = mobileProject.Id
            },
            new Ticket
            {
                Title = "Bug: Email Notifications",
                Description = "Not receiving email notifications for ticket updates",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Resolved,
                CreatedByUserId = legacyUser.Id,
                AssignedToUserId = receiverUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                ProjectId = apiProject.Id
            },
            new Ticket
            {
                Title = "UI Improvement Suggestion",
                Description = "The ticket form could use better validation messages",
                Priority = TicketPriority.Low,
                Status = TicketStatus.Closed,
                CreatedByUserId = applierUser.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                ProjectId = webProject.Id
            }
        };

        context.Tickets.AddRange(tickets);
        await context.SaveChangesAsync();
    }
}