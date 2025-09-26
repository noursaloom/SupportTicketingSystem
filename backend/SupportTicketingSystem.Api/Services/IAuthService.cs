using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
}