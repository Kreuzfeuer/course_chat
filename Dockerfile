FROM openjdk:21-jdk-alpine

WORKDIR /app

COPY target/*.jar app.jar

# Запускаем приложение
ENTRYPOINT ["java","-jar","app.jar"]