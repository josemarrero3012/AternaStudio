# Cómo subir la web a Hostinger

La web es estática: se compila en el ordenador y se sube lo que sale
(`out/`). El servidor no necesita Node.js; solo Apache y PHP, que Hostinger ya
tiene, para el formulario de contacto.

Lo que se sube es la rama **`main`**. La rama `casos-de-exito` es solo una
vista previa en GitHub Pages: no se sube a Hostinger.

**En resumen:** quien desarrolla la web ejecuta `npm run package`, que deja
en `entregas/` un zip y una nota. Quien la sube a Hostinger solo necesita esos
dos archivos: la nota explica cómo subirla y qué comprobar.

## Lo que hace falta

- **Node.js 22** (el que usa la publicación automática; con la 20.9 o más
  nueva también compila). Si usas `nvm`, basta con `nvm use`: lee `.nvmrc`.
- **Conexión a internet al compilar**: antes de cada compilación se descargan
  unos 130 MB del modelo del asistente (ver más abajo).
- **Acceso a hPanel de Hostinger** (Administrador de archivos o FTP) y a la
  cuenta de correo `contacto@aternastudio.com`.
- **La contraseña del correo**, que no está en el repositorio (ver
  «Formulario de contacto»).

## 1. Preparar la entrega

```bash
git clone https://github.com/josemarrero3012/AternaStudio.git
cd AternaStudio
git checkout main
npm ci
npm run package
```

`npm run package` (`scripts/package.mjs`):

1. Se niega a seguir si hay cambios sin confirmar: cada zip corresponde a un
   commit concreto, que va en su nombre y en la nota.
2. Compila la web para el dominio real (sin `NEXT_PUBLIC_BASE_PATH`, la ruta
   de la demo de GitHub Pages).
3. Comprueba que están los archivos imprescindibles (los `.htaccess`, el
   formulario, la 404 de cada idioma…), que no se cuela la configuración del
   correo y que está el modelo del asistente.
4. Deja en `entregas/` (fuera de git):
   - `aterna-web-<fecha>-<commit>.zip`: el contenido de `out/` en la raíz del
     zip, con los archivos que empiezan por punto.
   - `aterna-web-<fecha>-<commit>-NOTA.md`: cómo subirla, qué comprobar
     después, qué cambia desde la entrega anterior y lo que queda por decidir
     en el servidor.

Opciones: `--desde <commit, etiqueta o AAAA-MM-DD>` para elegir desde dónde
se cuentan los cambios en la nota (por defecto, la última etiqueta
`entrega-*`); `--sin-compilar` para usar el `out/` que ya hay;
`--sin-modelo` si no se pudo descargar el modelo del asistente.

Cuando el responsable confirma que la ha subido, se registra con la etiqueta
que propone la nota (`git tag entrega-<fecha> <commit>` y `git push origin
entrega-<fecha>`). Así la nota de la próxima entrega solo lista lo nuevo.

Para ver la web antes de entregarla: `npm start` y abrir
http://localhost:3000 (el formulario no envía en local, porque no hay PHP).

### El modelo del asistente

Antes de compilar se ejecuta solo `scripts/fetch-semantic.mjs`, que descarga
el modelo del asistente en `public/semantic/` (no está en git porque pesa
mucho). La primera vez tarda un poco; las siguientes ya lo tiene.

Si al compilar sale un aviso de que no se pudo descargar, la web se compila
igual y el asistente funciona solo con búsqueda por palabras. Para tenerlo
completo, vuelve a compilar con conexión. Se comprueba mirando que exista
`out/semantic/manifest.json`.

## 2. Formulario de contacto

El formulario llama a `contacto.php`, que envía el correo por el SMTP de
Hostinger con PHPMailer (ya incluido en `public/php/PHPMailer/`). Necesita un
archivo con los datos del correo, `php/mail-config.php`, que **no está en
git** porque lleva la contraseña.

- Si el servidor ya tiene `public_html/php/mail-config.php`, consérvalo.
- Si falta, rellena [la plantilla](mail-config.example.php) y súbela directamente
  al servidor en esa ruta. No copies las credenciales a `public/` ni a `out/`.
  La compilación se detiene si encuentra la configuración o el contador
  dentro de `public/php/`.
- PHP necesita crear y actualizar `public_html/php/.contact-rate.json` con
  permisos privados. Si la carpeta no es escribible por PHP, crea un archivo
  vacío con permiso de lectura y escritura para su usuario. El contador
  limita los intentos SMTP a 5 por IP y 60 en total por ventana de 10 minutos.
- `contacto.php` solo acepta JSON y, si el navegador indica de qué web viene
  la petición, solo de esta. Sus respuestas se prueban en cada PR con
  `scripts/contact-check.sh` (con el PHP del CI, sin enviar correos).
  Conserva el archivo al desplegar y comprueba que `php/.htaccess` devuelve 403
  al acceder por HTTP a la configuración o al contador.

## 3. Subir

Se sube el zip de `entregas/` con el Administrador de archivos de hPanel a
`public_html/` y se descomprime ahí, sustituyendo lo que haya. El zip lleva el
contenido de `out/` en su raíz. Así no se pierden los archivos que empiezan
por punto, que muchos programas de FTP esconden. Tienen que llegar todos:

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `.htaccess` | URLs limpias (`/servicios` en vez de `/servicios.html`), `www` a la dirección sin `www`, cabeceras de seguridad (con la política de contenido), caché y la 404 |
| `en/.htaccess`, `nl/.htaccess`, `de/.htaccess` | Que cada idioma muestre su propia 404 |
| `contacto.php` y `php/` | El formulario de contacto |
| `semantic/` | El modelo del asistente (unos 130 MB) |
| `_next/`, `brand/`, los `.html` | La web |

Antes de borrar nada en el servidor, guarda una copia de
`public_html/php/mail-config.php`. Si vacías `public_html/` para dejarlo
limpio, vuelve a ponerlo después.

## 4. Comprobar

Después de subir, abre la web en una ventana privada y mira:

- https://aternastudio.com/ y https://aternastudio.com/servicios cargan (si
  `/servicios` da 403 o 404, falta el `.htaccess` de la raíz).
- https://aternastudio.com/en, `/nl` y `/de` salen ya traducidas.
- https://aternastudio.com/de/no-existe muestra la 404 en alemán (si sale
  en español, falta `de/.htaccess`).
- https://www.aternastudio.com/servicios lleva a
  https://aternastudio.com/servicios.
- El formulario de contacto envía y el correo llega a
  `contacto@aternastudio.com`. Si da error, revisa `php/mail-config.php`;
  el motivo queda en el registro de errores de PHP de hPanel.
- https://aternastudio.com/semantic/manifest.json existe (el asistente con
  modelo, solo en ordenador).

## Las demos de GitHub Pages

No hay que hacer nada a mano. Cada vez que se sube algo a `main` o a
`casos-de-exito`, `.github/workflows/pages.yml` compila las dos y las
publica:

- `main` en https://josemarrero3012.github.io/AternaStudio/
- `casos-de-exito` en https://josemarrero3012.github.io/AternaStudio/casos/

En las demos el formulario no envía (GitHub Pages no tiene PHP).

## Cuando se publiquen los casos de éxito

La rama `casos-de-exito` es `main` más la sección «Trabajo». Para llevarla a
la web real: fusionar `casos-de-exito` en `main` con un PR, quitar el
`noindex` de «Trabajo» (`noindex` en `src/lib/meta.ts`), añadir `/trabajo` y
sus casos a `src/app/sitemap.ts` y volver a compilar y subir.

Mientras tanto, cada cambio que entre en `main` hay que llevarlo también a
`casos-de-exito` (fusionar `main` en esa rama) para que la vista previa siga
siendo igual que la web real.
