# ============================================================
# BUILD STAGE - Use base image Maven directly
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS build

# Set workdir (the image default is /usr/src/maven)
WORKDIR /app

# Copy only the essential files Maven needs
COPY pom.xml ./
COPY src ./src

# Run Maven package directly (the base image has Maven at /usr/share/maven/bin/maven)
# -DskipTests skips test execution
RUN mvn package -DskipTests

# ============================================================
# RUNTIME STAGE - Java JRE only
# ============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the packaged JAR from build stage
COPY --from=build /app/target/app.jar app.jar

# Expose the port your Spring Boot app uses
EXPOSE 8080

# Health check - ping your app's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the app with optimized memory settings
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
