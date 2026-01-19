#!/usr/bin/env bash
# /webapps/erd-ecosystem/apps/pmbok/.devtools/git-feature.sh
# Script gemelo de "git feature" para el repo PMBOK:
# - Prefijo: feature/
# - Base por defecto: dev (si existe); si no existe, usa main
# - Crea o actualiza la rama feature y (opcional) hace push con upstream
set -euo pipefail
IFS=$'\n\t'

REMOTE="${REMOTE:-origin}"
PREFIX="${PREFIX:-feature/}"

# Base deseada: el usuario pidió "main" pero también "dev".
# Para que funcione bien con ambos casos: si existe 'dev' la usamos, si no, usamos 'main'.
DEFAULT_BASE_DEV="dev"
DEFAULT_BASE_MAIN="main"

MODE="rebase"      # rebase | merge
NO_PULL=false
DO_PUSH=false

usage() {
  cat <<'EOF'
Uso:
  git feature <nombre> [--base <rama>] [--rebase|--merge] [--no-pull] [--push]

Ejemplos:
  git feature login
  git feature feature/login
  git feature login --base main
  git feature login --base dev
  git feature login --merge
  git feature login --push

Qué hace:
  1) Determina base (por defecto: 'dev' si existe; si no, 'main').
  2) Actualiza base (fetch + pull, a menos que uses --no-pull).
  3) Si la rama no existe: la crea desde base.
  4) Si ya existe: hace checkout y la actualiza desde base (rebase por defecto).
  5) Opcional: --push hace push y setea upstream.
EOF
}

die() { echo "❌ $*" >&2; exit 1; }

ensure_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "No estás dentro de un repo Git."
}

ensure_clean() {
  if [[ -n "$(git status --porcelain)" ]]; then
    die "Tienes cambios sin guardar. Haz commit o stash primero."
  fi
}

branch_exists_local() {
  git show-ref --verify --quiet "refs/heads/$1"
}

branch_exists_remote() {
  git ls-remote --exit-code --heads "$REMOTE" "$1" >/dev/null 2>&1
}

pick_default_base() {
  # Preferimos 'dev' si existe local o remoto; si no, caemos a 'main'
  if branch_exists_local "$DEFAULT_BASE_DEV" || branch_exists_remote "$DEFAULT_BASE_DEV"; then
    echo "$DEFAULT_BASE_DEV"
  else
    echo "$DEFAULT_BASE_MAIN"
  fi
}

update_base_branch() {
  local base="$1"
  echo "🔄 Actualizando base '$base'..."

  # Trae refs del remoto (no falla si no existe remoto)
  git fetch "$REMOTE" "$base" >/dev/null 2>&1 || true

  # Asegura rama local base
  if branch_exists_local "$base"; then
    git checkout "$base" >/dev/null 2>&1 || die "No pude hacer checkout a '$base'."
  else
    # Si no existe local, pero sí en remoto, créala desde remoto
    if branch_exists_remote "$base"; then
      git checkout -b "$base" "$REMOTE/$base" >/dev/null 2>&1 || die "No pude crear '$base' desde '$REMOTE/$base'."
    else
      die "No existe la rama base '$base' ni local ni en remoto."
    fi
  fi

  if ! $NO_PULL; then
    git pull "$REMOTE" "$base" || die "Falló pull de '$REMOTE/$base'."
  fi
}

normalize_branch_name() {
  local name="$1"
  if [[ "$name" == */* ]]; then
    echo "$name"
  else
    echo "${PREFIX}${name}"
  fi
}

# ---- parse args ----
ensure_repo

if [[ $# -lt 1 ]]; then usage; exit 1; fi

NAME="$1"
shift || true

BASE_BRANCH="$(pick_default_base)"

while (( $# )); do
  case "$1" in
    --base)
      BASE_BRANCH="${2:-}"
      [[ -z "$BASE_BRANCH" ]] && die "Falta valor para --base"
      shift 2
      ;;
    --rebase) MODE="rebase"; shift ;;
    --merge) MODE="merge"; shift ;;
    --no-pull) NO_PULL=true; shift ;;
    --push) DO_PUSH=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Opción desconocida: $1" ;;
  esac
done

TARGET_BRANCH="$(normalize_branch_name "$NAME")"

ensure_clean

# 1) Actualiza base
update_base_branch "$BASE_BRANCH"

# 2) Crea o actualiza rama feature
if branch_exists_local "$TARGET_BRANCH"; then
  echo "🧭 Rama existe: $TARGET_BRANCH"
  git checkout "$TARGET_BRANCH" >/dev/null 2>&1 || die "No pude hacer checkout a '$TARGET_BRANCH'."

  echo "🔁 Actualizando '$TARGET_BRANCH' desde '$BASE_BRANCH' ($MODE)..."
  if [[ "$MODE" == "rebase" ]]; then
    if ! git rebase "$BASE_BRANCH"; then
      echo "⚠️ Rebase con conflictos."
      echo "   Resuelve y luego: git rebase --continue"
      echo "   O aborta:          git rebase --abort"
      exit 1
    fi
  else
    if ! git merge "$BASE_BRANCH"; then
      echo "⚠️ Merge con conflictos."
      echo "   Resuelve, luego commit y continúa."
      exit 1
    fi
  fi
else
  echo "🌱 Creando rama: $TARGET_BRANCH desde $BASE_BRANCH"
  git checkout -b "$TARGET_BRANCH" "$BASE_BRANCH" >/dev/null 2>&1 || die "No pude crear '$TARGET_BRANCH' desde '$BASE_BRANCH'."
fi

# 3) Push opcional
if $DO_PUSH; then
  echo "📡 Haciendo push y seteando upstream..."
  git push -u "$REMOTE" "$TARGET_BRANCH"
fi

echo "✅ Listo. Estás en: $(git branch --show-current)"
echo "   Base: $BASE_BRANCH | Modo: $MODE | Remote: $REMOTE"
