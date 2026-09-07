# ============================================================
# BUILD STAGE - Download deps & compile
# ============================================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy Maven wrapper & config FIRST (for layer caching)
COPY mvnw pom.xml ./
COPY .mvn ./.mvn

# Make wrapper executable
RUN chmod +x mvnw

# ✅ FIX: Dependency download - removed -q -B flags that caused phase error
RUN ./mvnw dependency:go-offline

# Copy source code & compile (safe flags)
COPY src ./src
RUN ./mvnw -q -B package -DskipTests

# ============================================================
# RUNTIME STAGE - Java JRE only
# ============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the packaged JAR from build stage (specific filename)
COPY --from=build /app/target/app.jar app.jar

# Expose the port your Spring Boot app uses
EXPOSE 8080

# Health check - ping your app's health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Start the app with optimized memory settings
ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]
