# Stage 1: Build Angular app
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build (production config)
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Nginx serve
FROM nginx:alpine
COPY --from=build /app/dist/support-ticketing-frontend /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
