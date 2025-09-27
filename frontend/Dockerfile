# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# نسخ ملفات الحزم وتثبيت dependencies
COPY package*.json ./
RUN npm install

# نسخ كل الملفات وبناء Angular
COPY . .
RUN npm run build --prod

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist/support-ticketing-frontend /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
