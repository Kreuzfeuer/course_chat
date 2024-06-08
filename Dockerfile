# Используем Node.js в качестве базового образа
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходные файлы проекта
COPY . .

# Сборка приложения
RUN npm run build

# Используем nginx:alpine в качестве базового образа для сервера
FROM nginx:alpine

# Копируем сборку React в директорию по умолчанию nginx
COPY --from=0 /app/build /usr/share/nginx/html

# Экспортируем порт 80
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]