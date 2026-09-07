# ============================================================
# BUILD STAGE - Use base image Maven with clean package
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS build

# Set workdir
WORKDIR /app

# Copy only the essential files Maven needs
COPY pom.xml ./
COPY src ./src

# Run Maven clean package (ensures fresh build, avoids incremental issues)
# -DskipTests skips test execution
RUN mvn clean package -DskipTests

# ============================================================
# RUNTIME STAGE - Java JRE only
# ============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the packaged JAR from build stage
# JAR filename is quiz_app-0.0.1-SNAPSHOT.jar per pom.xml configuration
COPY --from=build /app/target/quiz_app-0.0.1-SNAPSHOT.jar app.jar

# Expose the port your Spring Boot app uses
EXPOSE 8080

# Health check - ping your app's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the app with optimized memory settings
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
