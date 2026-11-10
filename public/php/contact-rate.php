<?php

/**
 * Reserva un intento SMTP. Devuelve los segundos de espera si se alcanzó
 * el límite. Un solo fichero acotado y bloqueado sirve a todos los procesos PHP.
 */
function reserveContactAttempt(string $address): int
{
    $file = @fopen(__DIR__ . '/.contact-rate.json', 'c+');
    if ($file === false) {
        throw new RuntimeException('No se pudo abrir el contador.');
    }

    try {
        if (!flock($file, LOCK_EX)) {
            throw new RuntimeException('No se pudo bloquear el contador.');
        }

        $windowSeconds = 600;
        $now = time();
        $window = intdiv($now, $windowSeconds);
        $raw = stream_get_contents($file, 8192);
        if ($raw === false) {
            throw new RuntimeException('No se pudo leer el contador.');
        }
        $state = json_decode($raw, true);
        if (($state['window'] ?? null) !== $window) {
            $state = ['window' => $window, 'total' => 0, 'clients' => []];
        }

        $client = hash('sha256', $address);
        $count = $state['clients'][$client] ?? 0;
        if ($count >= 5 || $state['total'] >= 60) {
            return $windowSeconds - ($now % $windowSeconds);
        }

        $state['clients'][$client] = $count + 1;
        $state['total']++;
        $encoded = json_encode($state, JSON_THROW_ON_ERROR);
        if (!rewind($file) || fwrite($file, $encoded) !== strlen($encoded)
            || !ftruncate($file, strlen($encoded)) || !fflush($file)) {
            throw new RuntimeException('No se pudo guardar el contador.');
        }

        return 0;
    } finally {
        fclose($file);
    }
}
