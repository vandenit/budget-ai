# syntax=docker/dockerfile:experimental
FROM eclipse-temurin:17-jdk-alpine as build
WORKDIR /workspace/app

COPY packages/ai/mvnw .
COPY packages/ai/.mvn .mvn
COPY packages/ai/pom.xml .
COPY packages/ai/src src

RUN --mount=type=cache,target=/root/.m2 ./mvnw install -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app


# Debugging: Check the classpath
# RUN java -cp "/app:/app/lib/*" org.budgetai.ai.Application

ENTRYPOINT ["java","-cp","/app:/app/lib/*","org.budgetai.ai.Application"]
#ENTRYPOINT ["sh", "-c", "echo 'Starting application...'; echo 'Ls app:'; ls -la /app; echo 'ls app/lib:'; ls -la /app/lib"]
