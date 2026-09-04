# Backend Startup Instructions

## Why Plain `java -jar` Fails

Simply running `java -jar target/quiz_app-0.0.1-SNAPSHOT.jar` will **not** start correctly because:

- The default configuration in [src/main/resources/application.properties](src/main/resources/application.properties) (lines 6-8) specifies:
  - `DB_URL=jdbc:postgresql://localhost:5432/questionDB`
  - `DB_USERNAME=postgres`
- These defaults assume a local PostgreSQL database, which is not available in this environment
- **Secrets are located at `/.env.secrets`** (project root), not `frontend/.env.secrets`

---

## Stop Backend

Reference command (already executed):

```bash
lsof -ti:8080 | xargs kill -9 2>/dev/null; pkill -f "quiz_app-0.0.1-SNAPSHOT.jar" 2>/dev/null; echo "stopped"
```

---

## Start Backend

Loads environment variables from `.env.secrets` (project root) and starts the JAR in the background:

```bash
cd /Users/govindgupta/Projects/Quiz-App
set -a; source .env.secrets; set +a
java -jar target/quiz_app-0.0.1-SNAPSHOT.jar > /tmp/quiz-backend.log 2>&1 &
sleep 8; tail -n 20 /tmp/quiz-backend.log; curl -s http://localhost:8080/actuator/health; echo ""
```

**Note:** The `set -a` / `set +a` ensures all variables in `.env.secrets` are exported to the environment before the JAR starts.

---

## Verify Startup

### Health Check

Verify the service is up (expect `{"status":"UP"}`):

```bash
curl -s http://localhost:8080/actuator/health
```

### Login Verification

Test the authentication endpoint:

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"guptagovind516@gmail.com","password":"govind516@"}' | head -c 200
```

If successful, returns a JWT token (truncated to first 200 characters above).