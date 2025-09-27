# Stage 1: Build Angular app
FROM node:18-alpine AS build
WORKDIR /app

# نسخ ملفات package
COPY package*.json ./

# تثبيت الباكج
RUN npm install

# نسخ باقي الكود وبناء المشروع
COPY . .
RUN npx ng build --configuration=production

# Stage 2: Serve with Nginx
FROM nginx:alpine
# نسخ البناء النهائي إلى مجلد nginx
COPY --from=build /app/dist/support-ticketing-frontend /usr/share/nginx/html

# نسخ إعدادات Nginx
COPY default.conf /etc/nginx/conf.d/default.conf

# فتح البورت
EXPOSE 80

# بدء Nginx
CMD ["nginx", "-g", "daemon off;"]
