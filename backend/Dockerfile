# Use the official .NET 8 SDK image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy csproj files and restore dependencies
COPY SupportTicketingSystem.Api/*.csproj ./SupportTicketingSystem.Api/
RUN dotnet restore ./SupportTicketingSystem.Api/SupportTicketingSystem.Api.csproj

# Copy everything else and build
COPY . .
WORKDIR /app/SupportTicketingSystem.Api
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/SupportTicketingSystem.Api/out .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "SupportTicketingSystem.Api.dll"]