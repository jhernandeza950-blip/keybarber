# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml ./
RUN mvn -B dependency:go-offline || true

COPY src ./src
RUN mvn -B -DskipTests clean package && \
    cp target/keybarber-app-*.jar app.jar

# Runtime stage
FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /app/app.jar app.jar

EXPOSE 8080

ENV JAVA_OPTS="-XX:+TieredCompilation -XX:TieredStopAtLevel=1 -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]


