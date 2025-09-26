using Microsoft.EntityFrameworkCore;
using SupportTicketingSystem.Api.Data;
using SupportTicketingSystem.Api.Models;
using SupportTicketingSystem.Api.Models.DTOs;

namespace SupportTicketingSystem.Api.Services;

public class ProjectService : IProjectService
{
    private readonly ApplicationDbContext _context;

    public ProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ProjectDto>> GetProjectsAsync()
    {
        var projects = await _context.Projects
            .Include(p => p.UserProjects)
            .ThenInclude(up => up.User)
            .OrderBy(p => p.Name)
            .ToListAsync();

        return projects.Select(MapToProjectDto);
    }

    public async Task<ProjectDto?> GetProjectByIdAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.UserProjects)
            .ThenInclude(up => up.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        return project != null ? MapToProjectDto(project) : null;
    }

    public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto createProjectDto)
    {
        if (await _context.Projects.AnyAsync(p => p.Name == createProjectDto.Name))
        {
            throw new InvalidOperationException("Project with this name already exists");
        }

        var project = new Project
        {
            Name = createProjectDto.Name,
            Description = createProjectDto.Description,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Assign users to project
        if (createProjectDto.UserIds.Any())
        {
            await AssignUsersToProject(project.Id, createProjectDto.UserIds);
        }

        // Reload with users
        await _context.Entry(project)
            .Collection(p => p.UserProjects)
            .Query()
            .Include(up => up.User)
            .LoadAsync();

        return MapToProjectDto(project);
    }

    public async Task<ProjectDto> UpdateProjectAsync(int id, UpdateProjectDto updateProjectDto)
    {
        var project = await _context.Projects
            .Include(p => p.UserProjects)
            .ThenInclude(up => up.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            throw new InvalidOperationException("Project not found");

        if (await _context.Projects.AnyAsync(p => p.Name == updateProjectDto.Name && p.Id != id))
        {
            throw new InvalidOperationException("Project with this name already exists");
        }

        project.Name = updateProjectDto.Name;
        project.Description = updateProjectDto.Description;

        // Update user assignments
        var existingUserIds = project.UserProjects.Select(up => up.UserId).ToList();
        var newUserIds = updateProjectDto.UserIds;

        // Remove users not in the new list
        var usersToRemove = project.UserProjects
            .Where(up => !newUserIds.Contains(up.UserId))
            .ToList();
        
        foreach (var userProject in usersToRemove)
        {
            _context.UserProjects.Remove(userProject);
        }

        // Add new users
        var usersToAdd = newUserIds
            .Where(userId => !existingUserIds.Contains(userId))
            .ToList();

        foreach (var userId in usersToAdd)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                project.UserProjects.Add(new UserProject
                {
                    UserId = userId,
                    ProjectId = project.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        return MapToProjectDto(project);
    }

    public async Task<bool> DeleteProjectAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Tickets)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            return false;

        // Check if project has tickets
        if (project.Tickets.Any())
        {
            throw new InvalidOperationException("Cannot delete project that has tickets");
        }

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ProjectDto> AssignUsersToProjectAsync(int id, AssignUsersToProjectDto assignUsersDto)
    {
        var project = await _context.Projects
            .Include(p => p.UserProjects)
            .ThenInclude(up => up.User)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
            throw new InvalidOperationException("Project not found");

        await AssignUsersToProject(id, assignUsersDto.UserIds);

        // Reload with updated users
        await _context.Entry(project)
            .Collection(p => p.UserProjects)
            .Query()
            .Include(up => up.User)
            .LoadAsync();

        return MapToProjectDto(project);
    }

    private async Task AssignUsersToProject(int projectId, List<int> userIds)
    {
        foreach (var userId in userIds)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                var existingAssignment = await _context.UserProjects
                    .FirstOrDefaultAsync(up => up.UserId == userId && up.ProjectId == projectId);

                if (existingAssignment == null)
                {
                    _context.UserProjects.Add(new UserProject
                    {
                        UserId = userId,
                        ProjectId = projectId,
                        AssignedAt = DateTime.UtcNow
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
    }

    private static ProjectDto MapToProjectDto(Project project)
    {
        return new ProjectDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            AssignedUsers = project.UserProjects.Select(up => new UserDto
            {
                Id = up.User.Id,
                Name = up.User.Name,
                Email = up.User.Email,
                Role = up.User.Role,
                CreatedAt = up.User.CreatedAt
            }).ToList()
        };
    }
}