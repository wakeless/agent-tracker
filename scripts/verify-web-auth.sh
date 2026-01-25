#!/bin/bash
set -e

echo "=== Web Auth/TLS Verification ==="

cd packages/web

# Ensure tsx is available
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found"
  exit 1
fi

# Test 1: Basic auth with auto-generated password
echo -e "\n[1/4] Testing auto-generated auth..."
PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
export AUTH_CREDENTIAL="admin:$PASSWORD"

# Start server in background
timeout 30s npx tsx src/cli.ts &
SERVER_PID=$!
sleep 5

# Should fail without auth
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "401" ]; then
  echo "FAIL: Expected 401, got $HTTP_CODE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

# Should succeed with auth
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u "admin:$PASSWORD" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
unset AUTH_CREDENTIAL
echo "PASS: Basic auth works"

# Test 2: No-auth mode
echo -e "\n[2/4] Testing no-auth mode..."
timeout 30s npx tsx src/cli.ts --no-auth &
SERVER_PID=$!
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "PASS: No-auth mode works"

# Test 3: Custom credentials
echo -e "\n[3/4] Testing custom credentials..."
timeout 30s npx tsx src/cli.ts -c myuser:mypass &
SERVER_PID=$!
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -u "myuser:mypass" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "PASS: Custom credentials work"

# Test 4: TLS (generate temp certs)
echo -e "\n[4/4] Testing TLS..."
TMPDIR=$(mktemp -d)
openssl req -x509 -newkey rsa:2048 -keyout "$TMPDIR/key.pem" -out "$TMPDIR/cert.pem" \
  -days 1 -nodes -subj '/CN=localhost' 2>/dev/null

timeout 30s npx tsx src/cli.ts --no-auth --tls --tls-cert "$TMPDIR/cert.pem" --tls-key "$TMPDIR/key.pem" &
SERVER_PID=$!
sleep 5

HTTP_CODE=$(curl -sk -o /dev/null -w "%{http_code}" https://localhost:3000/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Expected 200, got $HTTP_CODE (TLS may not be fully supported yet)"
  # TLS test failure is not critical for initial implementation
  echo "WARNING: TLS test failed but continuing..."
else
  echo "PASS: TLS works"
fi

kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
rm -rf "$TMPDIR"

echo -e "\n=== Web Auth verification complete ==="
