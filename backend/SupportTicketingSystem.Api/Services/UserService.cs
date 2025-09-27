using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public UserService(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    public async Task<IEnumerable<UserDto>> GetUsersAsync()
    {
        var users = await _context.Users.OrderBy(u => u.Name).ToListAsync();
        return users.Select(MapToUserDto);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        return user != null ? MapToUserDto(user) : null;
    }

    public async Task<UserDto> CreateUserAsync(CreateUserDto createUserDto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        // Generate temporary password
        var temporaryPassword = GenerateTemporaryPassword();

        var user = new User
        {
            Name = createUserDto.Name,
            Email = createUserDto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(temporaryPassword),
            Role = createUserDto.Role,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Send welcome email with temporary password
        await _emailService.SendNewUserAccountEmailAsync(user, temporaryPassword);

        return MapToUserDto(user);
    }

    public async Task<UserDto> UpdateUserAsync(int id, UpdateUserDto updateUserDto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            throw new InvalidOperationException("User not found");

        if (await _context.Users.AnyAsync(u => u.Email == updateUserDto.Email && u.Id != id))
        {
            throw new InvalidOperationException("User with this email already exists");
        }

        user.Name = updateUserDto.Name;
        user.Email = updateUserDto.Email;
        user.Role = updateUserDto.Role;

        await _context.SaveChangesAsync();
        return MapToUserDto(user);
    }

    public async Task<bool> DeleteUserAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
        
        if (user == null)
            return false;

        // Check if user has created tickets
        var hasTickets = await _context.Tickets.AnyAsync(t => t.CreatedByUserId == id);
        if (hasTickets)
        {
            throw new InvalidOperationException("Cannot delete user who has created tickets");
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    private static string GenerateTemporaryPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 12)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}