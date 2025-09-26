using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
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
        try
        {
            var userId = GetUserId();
            var ticket = await _ticketService.CreateTicketAsync(createTicketDto, userId);
            
            return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TicketDto>> UpdateTicket(int id, [FromBody] UpdateTicketDto updateTicketDto)
    {
        try
        {
            var userId = GetUserId();
            var isAdminOrReceiver = IsAdminOrReceiver();
            
            var ticket = await _ticketService.UpdateTicketAsync(id, updateTicketDto, userId, isAdminOrReceiver);
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
            var ticket = await _ticketService.AssignTicketAsync(id, assignTicketDto);
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
}