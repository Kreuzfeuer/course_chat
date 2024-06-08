# Используем официальный образ openjdk:21
FROM maven:3.8.6-jdk-21 as builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файл pom.xml
COPY pom.xml .

# Копируем остальные исходные файлы проекта
COPY src ./src

# Выполняем сборку проекта с помощью Maven
RUN mvn clean package -DskipTests

# Используем openjdk:21 для запуска приложения
FROM openjdk:21

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем собранный JAR-файл из предыдущего этапа
COPY --from=builder /app/target/*.jar app.jar

# Запускаем приложение
ENTRYPOINT ["java","-jar","app.jar"]