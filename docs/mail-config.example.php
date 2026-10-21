<?php
// Plantilla de public/php/mail-config.php, el archivo con la contraseña del
// correo que usa contacto.php. El de verdad NO va en git (.gitignore).
//
// Cópiala a public/php/mail-config.php antes de compilar, o súbela ya
// rellenada a public_html/php/mail-config.php en Hostinger. Los datos salen
// de hPanel > Correos > la cuenta de correo > Configuración (SMTP).

define('SMTP_HOST', 'smtp.hostinger.com');
define('SMTP_PORT', 465);
define('SMTP_SECURE', 'ssl');                    // 465 con 'ssl'; o 587 con 'tls'
define('SMTP_USER', 'contacto@aternastudio.com'); // la cuenta que envía
define('SMTP_PASSWORD', 'CAMBIAR');              // su contraseña
define('CONTACT_TO_EMAIL', 'contacto@aternastudio.com'); // quién recibe los mensajes
