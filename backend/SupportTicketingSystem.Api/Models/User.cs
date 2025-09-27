namespace SupportTicketingSystem.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    public virtual ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
    public virtual ICollection<UserProject> UserProjects { get; set; } = new List<UserProject>();
}

public enum UserRole
{
    TicketApplier = 0,
    TicketReceiver = 1,
    Admin = 2,
    User= 3
}