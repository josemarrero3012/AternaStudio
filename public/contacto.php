<?php
/**
 * Backend real del formulario de contacto, para el hosting compartido
 * clásico de aternastudio.com — sin Node.js, sin servicio de terceros.
 * Envía por SMTP propio (Hostinger) usando PHPMailer, vendorizado en
 * php/PHPMailer/ (versión 6.9.3, sin Composer: este hosting no lo
 * garantiza).
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

require __DIR__ . '/php/mail-config.php';
require __DIR__ . '/php/PHPMailer/Exception.php';
require __DIR__ . '/php/PHPMailer/PHPMailer.php';
require __DIR__ . '/php/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_body']);
    exit;
}

$name = trim((string) ($body['name'] ?? ''));
$email = trim((string) ($body['email'] ?? ''));
$message = trim((string) ($body['message'] ?? ''));
$consent = ($body['consent'] ?? false) === true; // casilla RGPD
$company = trim((string) ($body['company'] ?? '')); // honeypot

// Bot: responde como si todo hubiera ido bien, pero no envía nada.
if ($company !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing_fields']);
    exit;
}
// Sin consentimiento expreso (casilla RGPD) no se procesa nada.
if (!$consent) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'consent_required']);
    exit;
}
if (strlen($name) > 200 || strlen($email) > 200 || strlen($message) > 5000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'too_long']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_email']);
    exit;
}

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
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
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'send_failed']);
}
