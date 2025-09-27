# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/support-ticketing-frontend /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set API URL environment variable if needed
ENV API_URL=http://backend-service-name.onrender.com/api

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
