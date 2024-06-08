# Используем официальный образ node:14 для сборки нашего приложения
FROM node:22 as build-stage

# Создаем директорию для нашего приложения внутри контейнера
WORKDIR /app

# Копируем наш package.json и package-lock.json в директорию приложения
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем наш код в директорию приложения
COPY . .

# Сборка приложения
RUN npm run build

# Используем nginx:stable-alpine для запуска нашего приложения
FROM nginx:stable-alpine

# Копируем настройки nginx
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы в директорию, откуда nginx будет их сервировать
COPY --from=build-stage /app/build /usr/share/nginx/html

# Экспортируем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]