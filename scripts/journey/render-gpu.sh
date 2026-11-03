#!/usr/bin/env bash
# Recorrido de la portada, versión 2: el render en el PC con la RTX, sin Claude.
# Se lanza desde la carpeta del repositorio (~/Escritorio/AternaStudio):
#
#   scripts/journey/render-gpu.sh test     # prueba corta: 6 fotogramas a calidad final
#   scripts/journey/render-gpu.sh render   # los 120 (si se corta, el mismo comando sigue)
#   scripts/journey/render-gpu.sh post     # solo rehace el revelado desde los EXR
#
# Hace git pull de la rama, prepara lo que falte en .render/ (Blender oficial y
# un venv para el revelado; nada de eso va a git), comprueba la GPU, renderiza
# (reanudable), valida los EXR, revela y sube solo lo final: public/journey/v2
# y el informe de scripts/journey/report. Los EXR se quedan en .render/exr.
#
# Opciones (variables de entorno): PRESET=final|draft · FSTOP=4 · JOBS=N
# (procesos del revelado) · NO_PUSH=1 (no sube nada) · BRANCH=…

set -euo pipefail

MODE="${1:-}"
BRANCH="${BRANCH:-claude/hopeful-babbage-yt1ln3}"
PRESET="${PRESET:-final}"
FSTOP="${FSTOP:-4}"
RES="3840x2160"
TEST_FRAMES="0,24,60,84,105,119"
BLENDER_VERSION="5.2.3"
BLENDER_SERIES="5.2"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="$ROOT/.render"
BLENDER_DIR="$WORK/blender-$BLENDER_VERSION-linux-x64"
BLENDER="$BLENDER_DIR/blender"
VENV="$WORK/venv"
EXR="$WORK/exr"
LOGS="$WORK/logs"
OUT="$ROOT/public/journey/v2"
REPORT="$ROOT/scripts/journey/report"
STAMP="$(date +%Y%m%d-%H%M%S)"

say() { printf '\n\033[1;35m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

main() {
  case "$MODE" in
    test | render | post) ;;
    *)
      sed -n '2,16p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 1
      ;;
  esac

  cd "$ROOT"
  mkdir -p "$WORK" "$LOGS"
  START=$(date +%s)

  # 1. La rama al día ------------------------------------------------------------
  say "Rama $BRANCH al día"
  command -v git >/dev/null || die "Falta git."
  # Lo que dejó a medias una ejecución anterior en las carpetas de salida se
  # regenera al revelar; cualquier otro cambio local para el script.
  git checkout -- public/journey/v2 scripts/journey/report 2>/dev/null || true
  git clean -fdq -- public/journey/v2 scripts/journey/report 2>/dev/null || true
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    git status --short
    die "Hay cambios locales en el repositorio. Guárdalos o descártalos y vuelve a lanzar el script."
  fi
  git fetch origin "$BRANCH"
  if [ "$(git rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
      git checkout "$BRANCH"
    else
      git checkout -b "$BRANCH" --track "origin/$BRANCH"
    fi
  fi
  before="$(sha256sum "$ROOT/scripts/journey/render-gpu.sh")"
  git pull --ff-only origin "$BRANCH"
  if [ "$(sha256sum "$ROOT/scripts/journey/render-gpu.sh")" != "$before" ]; then
    say "El script se ha actualizado con el pull: se relanza la versión nueva"
    exec "$ROOT/scripts/journey/render-gpu.sh" "$MODE"
  fi

  # 2. Blender oficial y el venv del revelado -------------------------------------
  if [ "$MODE" != "post" ] && [ ! -x "$BLENDER" ]; then
    say "Descargando Blender $BLENDER_VERSION (oficial, con CUDA y OptiX; unos 400 MB)"
    base="https://download.blender.org/release/Blender$BLENDER_SERIES"
    tarball="blender-$BLENDER_VERSION-linux-x64.tar.xz"
    curl -fL --retry 4 -C - -o "$WORK/$tarball" "$base/$tarball"
    if curl -fsSL -o "$WORK/blender.sha256" "$base/blender-$BLENDER_VERSION.sha256"; then
      (cd "$WORK" && grep " $tarball\$" blender.sha256 | sha256sum -c -) || die "La suma SHA-256 de Blender no coincide: borra $WORK/$tarball y vuelve a lanzar."
    else
      echo "Aviso: no se pudo descargar la suma SHA-256; se sigue con la descarga por HTTPS."
    fi
    tar -xJf "$WORK/$tarball" -C "$WORK"
    rm -f "$WORK/$tarball"
    [ -x "$BLENDER" ] || die "No se encontró $BLENDER tras descomprimir."
  fi

  make_venv() { # $1: el Python con el que se crea
    rm -rf "$VENV"
    "$1" -m venv "$VENV" &&
      "$VENV/bin/python" -m pip install -q --upgrade pip &&
      "$VENV/bin/python" -m pip install -q -r scripts/journey/requirements.txt
  }
  REQ_HASH="$(sha256sum scripts/journey/requirements.txt | cut -c1-16)"
  if [ ! -x "$VENV/bin/python" ] || [ "$(cat "$VENV/.req" 2>/dev/null)" != "$REQ_HASH" ]; then
    say "Preparando el venv del revelado (numpy, opencv, pillow con AVIF, OpenEXR)"
    if ! make_venv python3; then
      echo "Con el Python del sistema no se pudo; se prueba con el de Blender."
      bpy_python="$(ls "$BLENDER_DIR"/"$BLENDER_SERIES"/python/bin/python3.* 2>/dev/null | head -n1 || true)"
      [ -n "$bpy_python" ] || die "No se pudo preparar el venv (mira el error de pip de arriba)."
      make_venv "$bpy_python" || die "No se pudo preparar el venv (mira el error de pip de arriba)."
    fi
    echo "$REQ_HASH" >"$VENV/.req"
  fi
  "$VENV/bin/python" -c "from PIL import features; import sys; sys.exit(0 if features.check('avif') else 1)" ||
    die "Pillow no trae AVIF en este venv: borra $VENV y vuelve a lanzar."

  # 3. Render ---------------------------------------------------------------------
  render() { # $1: lista de fotogramas (vacía = los 120)
    local frames_arg=() tries
    [ -n "$1" ] && frames_arg=(--frames "$1")
    for tries in 1 2 3; do
      if "$BLENDER" -b --factory-startup --python-exit-code 1 --python scripts/journey/scene.py -- \
        --out "$EXR" --preset "$PRESET" --fstop "$FSTOP" --res "$RES" --device optix "${frames_arg[@]}" \
        2>&1 | tee -a "$LOGS/render-$STAMP.log"; then
        return 0
      fi
      echo "Blender se paró (intento $tries de 3). Se reanuda donde se quedó…"
      sleep 5
    done
    die "El render falla una y otra vez. El registro está en $LOGS/render-$STAMP.log."
  }

  if [ "$MODE" != "post" ]; then
    say "GPU"
    if command -v nvidia-smi >/dev/null; then
      nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader || true
    fi
    devices="$("$BLENDER" -b --factory-startup --python-exit-code 1 --python scripts/journey/scene.py -- --list-devices 2>/dev/null | grep -E '^(OPTIX|CUDA):' || true)"
    echo "$devices"
    echo "$devices" | grep -q '^OPTIX: [^—]' || die "Cycles no ve ninguna GPU con OptiX. Comprueba el driver de NVIDIA (nvidia-smi) y vuelve a lanzar."

    avail="$(df -BG --output=avail "$WORK" | tail -n1 | tr -dc '0-9')"
    echo "Espacio libre: ${avail} GB (los EXR de los 120 ocupan unos 30–45 GB)"
    [ "$avail" -ge 60 ] || echo "Aviso: menos de 60 GB libres; puede no caber el render completo."

    # Si cambia la escena o los ajustes, los EXR anteriores no valen: se apartan.
    SIG="$(cat scripts/journey/scene.py scripts/journey/mark.json | sha256sum | cut -c1-16)-$PRESET-f$FSTOP-$RES"
    if [ -d "$EXR" ] && [ -f "$EXR/.sig" ] && [ "$(cat "$EXR/.sig")" != "$SIG" ]; then
      echo "La escena o los ajustes han cambiado: los EXR anteriores pasan a $WORK/exr-$STAMP (bórralos si no los necesitas)."
      mv "$EXR" "$WORK/exr-$STAMP"
    fi
    mkdir -p "$EXR"
    echo "$SIG" >"$EXR/.sig"

    frames=""
    [ "$MODE" = "test" ] && frames="$TEST_FRAMES"
    say "Renderizando ($MODE, preajuste $PRESET, f/$FSTOP). La primera vez OptiX prepara sus núcleos: unos minutos."
    render "$frames"
    for pass in 1 2; do
      say "Validando los EXR"
      "$VENV/bin/python" scripts/journey/post.py "$EXR" --check ${JOBS:+--jobs "$JOBS"} | tee -a "$LOGS/check-$STAMP.log"
      grep -q " 0 rotos" "$LOGS/check-$STAMP.log" && break
      say "Repitiendo los fotogramas rotos"
      render "$frames"
    done
  fi

  # 4. Revelado e informe -------------------------------------------------------------
  [ -n "$(ls "$EXR"/f???.exr 2>/dev/null)" ] || die "No hay EXR en $EXR: primero test o render."
  # Lo que se haya mejorado del revelado mientras renderizaba, ya (los EXR no cambian).
  if [ -z "${NO_PULL:-}" ]; then
    git pull --ff-only origin "$BRANCH" || echo "Aviso: no se pudo actualizar la rama; se revela con lo que hay."
  fi
  say "Revelando (CPU, en paralelo)"
  rm -rf "$EXR/post"
  "$VENV/bin/python" scripts/journey/post.py "$EXR" "$OUT" --report "$REPORT" ${JOBS:+--jobs "$JOBS"} 2>&1 | tee "$LOGS/post-$STAMP.log"
  {
    echo "Modo: $MODE · preajuste $PRESET · f/$FSTOP · $(date '+%Y-%m-%d %H:%M')"
    command -v nvidia-smi >/dev/null && nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
    echo "Tiempo total del script: $((($(date +%s) - START) / 60)) min"
  } >"$REPORT/equipo.txt"
  cp "$LOGS/post-$STAMP.log" "$REPORT/post.log"

  # 5. Subir solo lo final -------------------------------------------------------------
  if [ -n "${NO_PUSH:-}" ]; then
    say "NO_PUSH: no se sube nada. Resultado en $OUT y $REPORT."
    exit 0
  fi
  [ -n "$(git config user.email || true)" ] || die "git no tiene usuario: git config --global user.name \"Tu nombre\" && git config --global user.email tu@correo"
  git add -A -- public/journey/v2 scripts/journey/report
  if git diff --cached --quiet; then
    say "No hay nada nuevo que subir."
  else
    n="$(ls "$EXR"/f???.exr | wc -l)"
    case "$MODE" in
      test) msg="Recorrido v2: prueba corta renderizada en la RTX ($n fotogramas)" ;;
      render) msg="Recorrido v2: render en la RTX ($n de 120 fotogramas)" ;;
      post) msg="Recorrido v2: revelado rehecho desde los EXR ($n fotogramas)" ;;
    esac
    git commit -q -m "$msg"
    say "Subiendo a $BRANCH"
    pushed=""
    for wait in 2 4 8 16; do
      if git push origin "$BRANCH"; then
        pushed=1
        break
      fi
      git pull --rebase origin "$BRANCH" || true
      sleep "$wait"
    done
    [ -n "$pushed" ] || die "No se pudo subir. Si pide credenciales: gh auth login (o git push origin $BRANCH a mano)."
  fi
  say "Listo en $((($(date +%s) - START) / 60)) min. Informe: scripts/journey/report/report.md"
}

# Todo va en main(): bash lo lee entero antes de empezar, así el git pull
# puede cambiar este archivo sin romper la ejecución en curso.
main "$@"
