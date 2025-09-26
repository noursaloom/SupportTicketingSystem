using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public class TicketService : ITicketService
{
    private readonly ApplicationDbContext _context;

    public TicketService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketDto>> GetTicketsAsync(int userId, bool isAdmin)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .AsQueryable();

        // TicketAppliers can only see their own tickets
        // TicketReceivers and Admins can see all tickets
        var user = await _context.Users.FindAsync(userId);
        if (user?.Role == UserRole.TicketApplier)
        {
            query = query.Where(t => t.CreatedByUserId == userId);
        }

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return tickets.Select(MapToTicketDto);
    }

    public async Task<TicketDto?> GetTicketByIdAsync(int id, int userId, bool isAdmin)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            return null;

        var user = await _context.Users.FindAsync(userId);
        if (user?.Role == UserRole.TicketApplier && ticket.CreatedByUserId != userId)
            return null;

        return MapToTicketDto(ticket);
    }

    public async Task<TicketDto> CreateTicketAsync(CreateTicketDto createTicketDto, int userId)
    {
        var ticket = new Ticket
        {
            Title = createTicketDto.Title,
            Description = createTicketDto.Description,
            Priority = createTicketDto.Priority,
            Status = TicketStatus.Open,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        await _context.Entry(ticket)
            .Reference(t => t.CreatedByUser)
            .LoadAsync();

        return MapToTicketDto(ticket);
    }

    public async Task<TicketDto> UpdateTicketAsync(int id, UpdateTicketDto updateTicketDto, int userId, bool isAdmin)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            throw new InvalidOperationException("Ticket not found");

        if (!isAdmin && ticket.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("Not authorized to update this ticket");

        var oldStatus = ticket.Status;
        var oldAssigneeId = ticket.AssignedToUserId;

        ticket.Title = updateTicketDto.Title;
        ticket.Description = updateTicketDto.Description;
        ticket.Priority = updateTicketDto.Priority;
        ticket.Status = updateTicketDto.Status;

        await _context.SaveChangesAsync();

        return MapToTicketDto(ticket);
    }

    public async Task<bool> DeleteTicketAsync(int id, int userId, bool isAdmin)
    {
        var ticket = await _context.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        
        if (ticket == null)
            return false;

        if (!isAdmin && ticket.CreatedByUserId != userId)
            throw new UnauthorizedAccessException("Not authorized to delete this ticket");

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TicketDto> AssignTicketAsync(int id, AssignTicketDto assignTicketDto)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            throw new InvalidOperationException("Ticket not found");

        var assignee = await _context.Users.FirstOrDefaultAsync(u => u.Id == assignTicketDto.UserId);
        if (assignee == null)
            throw new InvalidOperationException("User not found");

        var oldAssigneeId = ticket.AssignedToUserId;
        ticket.AssignedToUserId = assignTicketDto.UserId;
        await _context.SaveChangesAsync();

        await _context.Entry(ticket)
            .Reference(t => t.AssignedToUser)
            .LoadAsync();

        return MapToTicketDto(ticket);
    }

    private static TicketDto MapToTicketDto(Ticket ticket)
    {
        return new TicketDto
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            Priority = ticket.Priority,
            Status = ticket.Status,
            CreatedAt = ticket.CreatedAt,
            CreatedByUser = new UserDto
            {
                Id = ticket.CreatedByUser.Id,
                Name = ticket.CreatedByUser.Name,
                Email = ticket.CreatedByUser.Email,
                Role = ticket.CreatedByUser.Role,
                CreatedAt = ticket.CreatedByUser.CreatedAt
            },
            AssignedToUser = ticket.AssignedToUser != null ? new UserDto
            {
                Id = ticket.AssignedToUser.Id,
                Name = ticket.AssignedToUser.Name,
                Email = ticket.AssignedToUser.Email,
                Role = ticket.AssignedToUser.Role,
                CreatedAt = ticket.AssignedToUser.CreatedAt
            } : null
        };
    }
}