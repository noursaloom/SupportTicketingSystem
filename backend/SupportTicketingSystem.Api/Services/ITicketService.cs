using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public interface ITicketService
{
    Task<IEnumerable<TicketDto>> GetTicketsAsync(int userId, bool isAdmin);
    Task<TicketDto?> GetTicketByIdAsync(int id, int userId, bool isAdmin);
    Task<TicketDto> CreateTicketAsync(CreateTicketDto createTicketDto, int userId);
    Task<TicketDto> UpdateTicketAsync(int id, UpdateTicketDto updateTicketDto, int userId, bool isAdmin);
    Task<bool> DeleteTicketAsync(int id, int userId, bool isAdmin);
    Task<TicketDto> AssignTicketAsync(int id, AssignTicketDto assignTicketDto);
}