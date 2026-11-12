<?php
/**
 * Backend real del formulario de contacto, para el hosting compartido
 * clásico de aternastudio.com — sin Node.js, sin servicio de terceros.
 * Envía por SMTP propio (Hostinger) usando PHPMailer, vendorizado en
 * php/PHPMailer/ (versión 7.1.1, sin Composer: este hosting no lo
 * garantiza). Las comprobaciones de este archivo se prueban en cada PR
 * (scripts/contact-check.sh).
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function contactError(int $status, string $code): void
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $code]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    contactError(405, 'method_not_allowed');
}

// Solo JSON. Un formulario HTML de otra web no puede enviar JSON sin que el
// navegador pida permiso antes (CORS), y aquí no se da: así nadie puede
// mandar el formulario en nombre de un visitante desde otro sitio.
$contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($contentType !== 'application/json') {
    contactError(415, 'unsupported_media_type');
}

// Si el navegador dice desde qué web llega la petición, tiene que ser esta.
// (Algunos navegadores o extensiones no envían Origin: entonces se acepta.)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $originHost = strtolower((string) parse_url($origin, PHP_URL_HOST));
    $ownHost = strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? ''));
    if ($originHost === '' || $originHost !== $ownHost) {
        contactError(403, 'forbidden_origin');
    }
}

// También limita cuerpos sin Content-Length. Hay margen para JSON escapado.
$maxBody = 32768;
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $maxBody) {
    contactError(413, 'body_too_large');
}
$raw = file_get_contents('php://input', false, null, 0, $maxBody + 1);
if ($raw === false) {
    contactError(400, 'invalid_body');
}
if (strlen($raw) > $maxBody) {
    contactError(413, 'body_too_large');
}

$body = json_decode($raw);
if (!$body instanceof stdClass) {
    contactError(400, 'invalid_body');
}
foreach (['name', 'email', 'message', 'company'] as $field) {
    if (property_exists($body, $field) && !is_string($body->$field)) {
        contactError(400, 'invalid_body');
    }
}

$name = trim($body->name ?? '');
$email = trim($body->email ?? '');
$message = trim($body->message ?? '');

if (trim($body->company ?? '') !== '') {
    echo json_encode(['ok' => true]);
    exit;
}
if ($name === '' || $email === '' || $message === '') {
    contactError(400, 'missing_fields');
}
if (($body->consent ?? false) !== true) {
    contactError(400, 'consent_required');
}
if (strlen($name) > 200 || strlen($email) > 200 || strlen($message) > 5000) {
    contactError(400, 'too_long');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    contactError(400, 'invalid_email');
}

$config = __DIR__ . '/php/mail-config.php';
if (!is_readable($config)) {
    error_log('[contacto.php] No se puede leer mail-config.php.');
    contactError(503, 'mail_unavailable');
}
try {
    require $config;
    foreach (['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'CONTACT_TO_EMAIL'] as $key) {
        if (!defined($key) || !is_scalar(constant($key)) || trim((string) constant($key)) === '') {
            throw new RuntimeException('Configuración SMTP incompleta.');
        }
    }
} catch (Throwable $e) {
    error_log('[contacto.php] Configuración SMTP no válida.');
    contactError(503, 'mail_unavailable');
}

require __DIR__ . '/php/contact-rate.php';
try {
    $retryAfter = reserveContactAttempt($_SERVER['REMOTE_ADDR'] ?? '');
} catch (RuntimeException $e) {
    error_log('[contacto.php] Almacenamiento del límite de envíos no disponible.');
    contactError(503, 'mail_unavailable');
}
if ($retryAfter > 0) {
    header('Retry-After: ' . $retryAfter);
    contactError(429, 'rate_limited');
}

require __DIR__ . '/php/PHPMailer/Exception.php';
require __DIR__ . '/php/PHPMailer/PHPMailer.php';
require __DIR__ . '/php/PHPMailer/SMTP.php';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Timeout = 10;
    $mail->Host = SMTP_HOST;
    $mail->Port = SMTP_PORT;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USER;
    $mail->Password = SMTP_PASSWORD;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom(SMTP_USER, 'Aterna Studio — Web');
    $mail->addAddress(CONTACT_TO_EMAIL);
    $mail->addReplyTo($email, $name);

    $mail->Subject = 'Nuevo contacto — ' . $name;
    $mail->isHTML(true);
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    // Prueba del consentimiento (art. 7.1 RGPD): queda en el propio correo.
    $consentLine = 'Consentimiento RGPD: sí — ' . gmdate('Y-m-d H:i:s') . ' UTC';
    $mail->Body = "<p>{$safeMessage}</p><hr><p>{$safeName}<br>{$safeEmail}</p><p><small>{$consentLine}</small></p>";
    $mail->AltBody = $message . "\n\n—\n" . $name . "\n" . $email . "\n\n" . $consentLine;

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (PHPMailerException $e) {
    error_log('[contacto.php] Error al enviar: ' . $mail->ErrorInfo);
    contactError(502, 'send_failed');
}
