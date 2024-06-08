FROM openjdk:21

WORKDIR /app

COPY target/*.jar app.jar

# Запускаем приложение
ENTRYPOINT ["java","-jar","app.jar"]