# Multi-stage Dockerfile for both frontend and backend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /app/backend
COPY backend/SupportTicketingSystem.Api/*.csproj ./SupportTicketingSystem.Api/
RUN dotnet restore ./SupportTicketingSystem.Api/SupportTicketingSystem.Api.csproj
COPY backend/ ./
WORKDIR /app/backend/SupportTicketingSystem.Api
RUN dotnet publish -c Release -o out

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend-build /app/backend/SupportTicketingSystem.Api/out .
COPY --from=frontend-build /app/frontend/dist/support-ticketing-frontend ./wwwroot

RUN mkdir -p /app/data
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "SupportTicketingSystem.Api.dll"]