#!/usr/bin/env bash
# Prueba el formulario de contacto (public/contacto.php) con el servidor que
# trae PHP, sin enviar ningún correo: trabaja sobre una copia de public/ y,
# para el límite de envíos, usa una configuración SMTP falsa que apunta a un
# puerto cerrado. Necesita php y curl. Lo lanza el CI en cada PR.
#
#   bash scripts/contact-check.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8099}"
BASE="http://127.0.0.1:$PORT"
WORK="$(mktemp -d)"
trap 'kill "$SERVER" 2>/dev/null || true; rm -rf "$WORK"' EXIT

echo "PHP $(php -r 'echo PHP_VERSION;')"
for f in "$ROOT"/public/contacto.php "$ROOT"/public/php/*.php "$ROOT"/public/php/PHPMailer/*.php; do
  php -l "$f" >/dev/null
done
echo "sintaxis: bien"

cp -r "$ROOT/public/contacto.php" "$ROOT/public/php" "$WORK/"
rm -f "$WORK/php/mail-config.php" "$WORK/php/.contact-rate.json"
php -S "127.0.0.1:$PORT" -t "$WORK" >/dev/null 2>&1 &
SERVER=$!
for _ in $(seq 50); do curl -s -o /dev/null "$BASE/contacto.php" && break; sleep 0.1; done

FAILS=0
VALID='{"name":"Prueba","email":"prueba@example.com","message":"Hola","consent":true,"company":""}'

# check <descripción> <estado esperado> <código esperado> <curl args...>
check() {
  local what="$1" want_status="$2" want_code="$3"
  shift 3
  local body status
  body="$(curl -s -o - -w '\n%{http_code}' "$@" "$BASE/contacto.php")"
  status="${body##*$'\n'}"
  body="${body%$'\n'*}"
  if [[ "$status" == "$want_status" && "$body" == *"$want_code"* ]]; then
    echo "  bien  $what ($status)"
  else
    echo "  MAL   $what: se esperaba $want_status $want_code, llegó $status $body"
    FAILS=$((FAILS + 1))
  fi
}

json=(-X POST -H 'Content-Type: application/json')
same=(-H "Origin: http://127.0.0.1:$PORT")

echo "Rechazos:"
check "GET" 405 method_not_allowed
check "formulario HTML (no JSON)" 415 unsupported_media_type -X POST -d 'name=a'
check "texto plano" 415 unsupported_media_type -X POST -H 'Content-Type: text/plain' --data "$VALID"
check "desde otra web" 403 forbidden_origin "${json[@]}" -H 'Origin: https://otra-web.example' --data "$VALID"
check "JSON roto" 400 invalid_body "${json[@]}" "${same[@]}" --data '{roto'
check "campo que no es texto" 400 invalid_body "${json[@]}" "${same[@]}" --data '{"name":1,"email":"a@b.c","message":"x","consent":true}'
check "faltan campos" 400 missing_fields "${json[@]}" "${same[@]}" --data '{"name":"a","consent":true}'
check "sin consentimiento" 400 consent_required "${json[@]}" "${same[@]}" --data '{"name":"a","email":"a@b.c","message":"x"}'
check "correo no válido" 400 invalid_email "${json[@]}" "${same[@]}" --data '{"name":"a","email":"no-es-correo","message":"x","consent":true}'
check "demasiado largo" 413 body_too_large "${json[@]}" "${same[@]}" --data "{\"name\":\"$(head -c 40000 /dev/zero | tr '\0' a)\"}"

echo "Trampa para bots:"
check "campo trampa relleno: finge que se envió" 200 '"ok":true' "${json[@]}" "${same[@]}" --data '{"name":"a","email":"a@b.c","message":"x","consent":true,"company":"bot"}'

echo "Envío válido sin configuración de correo:"
check "misma web" 503 mail_unavailable "${json[@]}" "${same[@]}" --data "$VALID"
check "sin cabecera Origin" 503 mail_unavailable "${json[@]}" --data "$VALID"

echo "Límite de envíos (SMTP falso en un puerto cerrado):"
cat > "$WORK/php/mail-config.php" <<'PHP'
<?php
define('SMTP_HOST', '127.0.0.1');
define('SMTP_PORT', 1);
define('SMTP_SECURE', 'tls');
define('SMTP_USER', 'prueba@example.com');
define('SMTP_PASSWORD', 'no-es-real');
define('CONTACT_TO_EMAIL', 'prueba@example.com');
PHP
for i in 1 2 3 4 5; do
  check "intento $i: no conecta" 502 send_failed "${json[@]}" "${same[@]}" --data "$VALID"
done
check "intento 6: espera" 429 rate_limited "${json[@]}" "${same[@]}" --data "$VALID"

if ((FAILS)); then
  echo "$FAILS comprobaciones fallidas"
  exit 1
fi
echo "Formulario: todo bien"
