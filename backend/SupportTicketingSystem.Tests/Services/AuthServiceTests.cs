using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;
using SupportTicketingSystem.Api.Services;

namespace SupportTicketingSystem.Tests.Services;

public class AuthServiceTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new ApplicationDbContext(options);
    }

    private IConfiguration GetConfiguration()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                {"JwtSettings:SecretKey", "your-very-long-secret-key-that-is-at-least-32-characters-long"},
                {"JwtSettings:ExpiryInMinutes", "60"}
            })
            .Build();
        
        return configuration;
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUser()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var configuration = GetConfiguration();
        var authService = new AuthService(context, configuration);
        
        var registerDto = new RegisterDto
        {
            Name = "Test User",
            Email = "test@example.com",
            Password = "password123"
        };

        // Act
        var result = await authService.RegisterAsync(registerDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(registerDto.Name, result.User.Name);
        Assert.Equal(registerDto.Email, result.User.Email);
        Assert.Equal(UserRole.User, result.User.Role);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldThrowException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var configuration = GetConfiguration();
        var authService = new AuthService(context, configuration);

        // Add existing user
        context.Users.Add(new User
        {
            Name = "Existing User",
            Email = "test@example.com",
            PasswordHash = "hash",
            Role = UserRole.User
        });
        await context.SaveChangesAsync();

        var registerDto = new RegisterDto
        {
            Name = "Test User",
            Email = "test@example.com",
            Password = "password123"
        };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.RegisterAsync(registerDto));
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnToken()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var configuration = GetConfiguration();
        var authService = new AuthService(context, configuration);

        var password = "password123";
        var user = new User
        {
            Name = "Test User",
            Email = "test@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = UserRole.User
        };

        context.Users.Add(user);
        await context.SaveChangesAsync();

        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = password
        };

        // Act
        var result = await authService.LoginAsync(loginDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Name, result.User.Name);
        Assert.Equal(user.Email, result.User.Email);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldThrowException()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var configuration = GetConfiguration();
        var authService = new AuthService(context, configuration);

        var loginDto = new LoginDto
        {
            Email = "nonexistent@example.com",
            Password = "wrongpassword"
        };

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => authService.LoginAsync(loginDto));
    }
}