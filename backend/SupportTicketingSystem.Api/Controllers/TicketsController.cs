using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;
using SupportTicketingSystem.Api.Services;
using System.Security.Claims;

namespace SupportTicketingSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;
    private readonly INotificationService _notificationService;

    public TicketsController(ITicketService ticketService, INotificationService notificationService)
    {
        _ticketService = ticketService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetTickets()
    {
        var userId = GetUserId();
        var isAdminOrReceiver = IsAdminOrReceiver();
        
        var tickets = await _ticketService.GetTicketsAsync(userId, isAdminOrReceiver);
        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketDto>> GetTicket(int id)
    {
        var userId = GetUserId();
        var isAdminOrReceiver = IsAdminOrReceiver();
        
        var ticket = await _ticketService.GetTicketByIdAsync(id, userId, isAdminOrReceiver);
        
        if (ticket == null)
            return NotFound();
            
        return Ok(ticket);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket([FromBody] CreateTicketDto createTicketDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        
        try
        {
            var userId = GetUserId();
            var ticket = await _ticketService.CreateTicketAsync(createTicketDto, userId);
            
            // Create notification for ticket receivers and admins
            await _notificationService.CreateTicketCreatedNotificationAsync(await GetFullTicketAsync(ticket.Id));
            
            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while creating the ticket", details = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TicketDto>> UpdateTicket(int id, [FromBody] UpdateTicketDto updateTicketDto)
    {
        try
        {
            var userId = GetUserId();
            var isAdminOrReceiver = IsAdminOrReceiver();
            
            // Get the old ticket for comparison
            var oldTicket = await _ticketService.GetTicketByIdAsync(id, userId, isAdminOrReceiver);
            if (oldTicket == null)
                return NotFound();
                
            var ticket = await _ticketService.UpdateTicketAsync(id, updateTicketDto, userId, isAdminOrReceiver);
            
            // Create notifications for status changes
            if (oldTicket.Status != ticket.Status)
            {
                await _notificationService.CreateTicketStatusChangedNotificationAsync(
                    await GetFullTicketAsync(ticket.Id), oldTicket.Status);
            }
            
            return Ok(ticket);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        try
        {
            var userId = GetUserId();
            var isAdminOrReceiver = IsAdminOrReceiver();
            
            var deleted = await _ticketService.DeleteTicketAsync(id, userId, isAdminOrReceiver);
            
            if (!deleted)
                return NotFound();
                
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
    }

    [HttpPost("{id}/assign")]
    [Authorize(Roles = "Admin,TicketReceiver")]
    public async Task<ActionResult<TicketDto>> AssignTicket(int id, [FromBody] AssignTicketDto assignTicketDto)
    {
        try
        {
            var oldTicket = await _ticketService.GetTicketByIdAsync(id, 0, true);
            if (oldTicket == null)
                return BadRequest(new { message = "Ticket not found" });
                
            var ticket = await _ticketService.AssignTicketAsync(id, assignTicketDto);
            
            // Create notification for newly assigned user
            await _notificationService.CreateTicketAssignedNotificationAsync(
                await GetFullTicketAsync(ticket.Id), oldTicket.AssignedToUser?.Id);
                
            return Ok(ticket);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }

    private bool IsAdmin()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return roleClaim == UserRole.Admin.ToString();
    }
    
    private bool IsAdminOrReceiver()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return roleClaim == UserRole.Admin.ToString() || roleClaim == UserRole.TicketReceiver.ToString();
    }
    
    private async Task<Ticket> GetFullTicketAsync(int ticketId)
    {
        // This is a helper method to get the full ticket entity for notifications
        // We need to access the context directly here
        using var scope = HttpContext.RequestServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        return await context.Tickets
            .Include(t => t.CreatedByUser)
            .Include(t => t.AssignedToUser)
            .FirstOrDefaultAsync(t => t.Id == ticketId) ?? throw new InvalidOperationException("Ticket not found");
    }
}