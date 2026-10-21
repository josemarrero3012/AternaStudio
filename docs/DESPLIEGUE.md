# Cómo subir la web a Hostinger

La web es estática: se compila en el ordenador y se sube la carpeta que sale
(`out/`). El servidor no necesita Node.js; solo Apache y PHP, que Hostinger ya
tiene, para el formulario de contacto.

Lo que se sube es la rama **`main`**. La rama `casos-de-exito` es solo una
vista previa en GitHub Pages: no se sube a Hostinger.

## Lo que hace falta

- **Node.js 22** (el que usa la publicación automática; con la 20.9 o más
  nueva también compila). Si usas `nvm`, basta con `nvm use`: lee `.nvmrc`.
- **Conexión a internet al compilar**: antes de cada compilación se descargan
  unos 130 MB del modelo del asistente (ver más abajo).
- **Acceso a hPanel de Hostinger** (Administrador de archivos o FTP) y a la
  cuenta de correo `contacto@aternastudio.com`.
- **La contraseña del correo**, que no está en el repositorio (ver
  «Formulario de contacto»).

## 1. Compilar

```bash
git clone https://github.com/josemarrero3012/AternaStudio.git
cd AternaStudio
git checkout main
npm ci
npm run build
```

`npm run build` deja la web entera en `out/`. Para verla antes de subirla:
`npm start` y abrir http://localhost:3000 (el formulario no envía en local,
porque no hay PHP).

> No pongas `NEXT_PUBLIC_BASE_PATH` al compilar para Hostinger. Esa variable
> solo sirve para la demo de GitHub Pages (`/AternaStudio`); con ella, los
> enlaces de la web real apuntarían a una carpeta que no existe.

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

- Si el servidor ya lo tiene (`public_html/php/mail-config.php`), no hay que
  hacer nada: solo no borrarlo al subir.
- Si no, copia la plantilla [`docs/mail-config.example.php`](mail-config.example.php)
  a `public/php/mail-config.php`, rellena la contraseña y compila: irá
  dentro de `out/php/`. Otra opción es subirla rellenada directamente al
  servidor. Nadie puede abrirla desde el navegador: `php/.htaccess` lo
  impide.

## 3. Subir

Sube **el contenido** de `out/` (no la carpeta en sí) a `public_html/`,
sustituyendo lo que haya.

Lo más seguro es comprimir el contenido de `out/` en un zip, subirlo con el
Administrador de archivos de hPanel a `public_html/` y descomprimirlo ahí.
Así no se pierden los archivos que empiezan por punto, que muchos programas
de FTP esconden. Tienen que llegar todos:

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `.htaccess` | URLs limpias (`/servicios` en vez de `/servicios.html`), cabeceras de seguridad, caché y la 404 |
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
