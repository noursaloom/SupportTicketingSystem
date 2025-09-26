using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;
using SupportTicketingSystem.Api.Services;
using Xunit;

namespace SupportTicketingSystem.Tests.Services;

public class TicketServiceTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateTicketAsync_WithValidData_ShouldCreateTicket()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var ticketService = new TicketService(context);

        var user = new User
        {
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = UserRole.User
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var createTicketDto = new CreateTicketDto
        {
            Title = "Test Ticket",
            Description = "Test Description",
            Priority = TicketPriority.High
        };

        // Act
        var result = await ticketService.CreateTicketAsync(createTicketDto, user.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(createTicketDto.Title, result.Title);
        Assert.Equal(createTicketDto.Description, result.Description);
        Assert.Equal(createTicketDto.Priority, result.Priority);
        Assert.Equal(TicketStatus.Open, result.Status);
        Assert.Equal(user.Id, result.CreatedByUser.Id);
    }

    [Fact]
    public async Task GetTicketsAsync_ForRegularUser_ShouldReturnOnlyUserTickets()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var ticketService = new TicketService(context);

        var user1 = new User { Name = "User 1", Email = "user1@test.com", PasswordHash = "hash", Role = UserRole.User };
        var user2 = new User { Name = "User 2", Email = "user2@test.com", PasswordHash = "hash", Role = UserRole.User };
        
        context.Users.AddRange(user1, user2);
        await context.SaveChangesAsync();

        var ticket1 = new Ticket { Title = "Ticket 1", Description = "Desc 1", CreatedByUserId = user1.Id };
        var ticket2 = new Ticket { Title = "Ticket 2", Description = "Desc 2", CreatedByUserId = user2.Id };
        
        context.Tickets.AddRange(ticket1, ticket2);
        await context.SaveChangesAsync();

        // Act
        var result = await ticketService.GetTicketsAsync(user1.Id, isAdmin: false);

        // Assert
        Assert.Single(result);
        Assert.Equal("Ticket 1", result.First().Title);
    }

    [Fact]
    public async Task GetTicketsAsync_ForAdmin_ShouldReturnAllTickets()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var ticketService = new TicketService(context);

        var user1 = new User { Name = "User 1", Email = "user1@test.com", PasswordHash = "hash", Role = UserRole.User };
        var user2 = new User { Name = "User 2", Email = "user2@test.com", PasswordHash = "hash", Role = UserRole.User };
        var admin = new User { Name = "Admin", Email = "admin@test.com", PasswordHash = "hash", Role = UserRole.Admin };
        
        context.Users.AddRange(user1, user2, admin);
        await context.SaveChangesAsync();

        var ticket1 = new Ticket { Title = "Ticket 1", Description = "Desc 1", CreatedByUserId = user1.Id };
        var ticket2 = new Ticket { Title = "Ticket 2", Description = "Desc 2", CreatedByUserId = user2.Id };
        
        context.Tickets.AddRange(ticket1, ticket2);
        await context.SaveChangesAsync();

        // Act
        var result = await ticketService.GetTicketsAsync(admin.Id, isAdmin: true);

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task UpdateTicketAsync_ByOwner_ShouldUpdateTicket()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var ticketService = new TicketService(context);

        var user = new User { Name = "User", Email = "user@test.com", PasswordHash = "hash", Role = UserRole.User };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var ticket = new Ticket 
        { 
            Title = "Original Title", 
            Description = "Original Description", 
            Priority = TicketPriority.Low,
            Status = TicketStatus.Open,
            CreatedByUserId = user.Id 
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var updateDto = new UpdateTicketDto
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Priority = TicketPriority.High,
            Status = TicketStatus.Pending
        };

        // Act
        var result = await ticketService.UpdateTicketAsync(ticket.Id, updateDto, user.Id, isAdmin: false);

        // Assert
        Assert.Equal(updateDto.Title, result.Title);
        Assert.Equal(updateDto.Description, result.Description);
        Assert.Equal(updateDto.Priority, result.Priority);
        Assert.Equal(updateDto.Status, result.Status);
    }

    [Fact]
    public async Task UpdateTicketAsync_ByNonOwner_ShouldThrowException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var ticketService = new TicketService(context);

        var user1 = new User { Name = "User 1", Email = "user1@test.com", PasswordHash = "hash", Role = UserRole.User };
        var user2 = new User { Name = "User 2", Email = "user2@test.com", PasswordHash = "hash", Role = UserRole.User };
        
        context.Users.AddRange(user1, user2);
        await context.SaveChangesAsync();

        var ticket = new Ticket 
        { 
            Title = "Title", 
            Description = "Description", 
            CreatedByUserId = user1.Id 
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();

        var updateDto = new UpdateTicketDto
        {
            Title = "Updated Title",
            Description = "Updated Description",
            Priority = TicketPriority.High,
            Status = TicketStatus.Pending
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => ticketService.UpdateTicketAsync(ticket.Id, updateDto, user2.Id, isAdmin: false));
    }
}