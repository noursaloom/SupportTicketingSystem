namespace SupportTicketingSystem.Api.Models.DTOs;

public class ProjectDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<UserDto> AssignedUsers { get; set; } = new List<UserDto>();
}

public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<int> UserIds { get; set; } = new List<int>();
}

public class UpdateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<int> UserIds { get; set; } = new List<int>();
}

public class AssignUsersToProjectDto
{
    public List<int> UserIds { get; set; } = new List<int>();
}