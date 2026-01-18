#!/usr/bin/env bash
# /webapps/erd-ecosystem/devops/scripts/git-acp.sh
set -euo pipefail
IFS=$'\n\t'

# Mensaje de confirmación de script integrado
echo "🟢 [ERD-ECOSYSTEM] Ejecutando git-acp integrado..."

# --- Detección inteligente de configuración ---
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
LOCAL_CONFIG="${PROJECT_ROOT}/.git-acprc"
USER_CONFIG="${HOME}/scripts/.git-acprc"

ORIG_ARGS=("$@")
FORCE=0
for __a in "$@"; do
  case "$__a" in
    --force|--i-know-what-im-doing) FORCE=1 ;;
  esac
done
(( FORCE )) && export DISABLE_NO_ACP_GUARD=1

# 1) Carga de Configuración (Prioridad: Local > Usuario)
if [ -f "$LOCAL_CONFIG" ]; then
  # shellcheck disable=SC1090
  source "$LOCAL_CONFIG"
elif [ -f "$USER_CONFIG" ]; then
  # shellcheck disable=SC1090
  source "$USER_CONFIG"
fi

# Defaults
DAY_START="${DAY_START:-00:00}"
REFS_LABEL="${REFS_LABEL:-Conteo: commit}"
DAILY_GOAL="${DAILY_GOAL:-10}"
PROFILES=("${PROFILES[@]:-}")
GH_AUTO_CREATE="${GH_AUTO_CREATE:-false}"
GH_DEFAULT_VISIBILITY="${GH_DEFAULT_VISIBILITY:-private}"

# --- Switch Modo Simple vs Pro ---
SIMPLE_MODE=false
# Variable para guardar a dónde hacer push (en modo simple es origin)
push_target="origin"

# 2) Validaciones base y decisión de modo
if [ ${#PROFILES[@]} -eq 0 ]; then
  # En lugar de error, activamos modo simple para otros devs
  SIMPLE_MODE=true
  
  # Validación mínima para modo simple
  if [ -z "$(git config user.name)" ]; then
    echo "❌ Error: Git user.name no está configurado globalmente."
    echo "   Ejecuta: git config --global user.name 'Tu Nombre'"
    exit 1
  fi
fi

git rev-parse --is-inside-work-tree &>/dev/null || {
  echo "❌ Error: no estás dentro de un repositorio Git."
  exit 1
}

# 2.1) Asegura main como rama por defecto para futuros repos
git config --global init.defaultBranch main >/dev/null

# 3) Guard (superrepo)
if [[ "${DISABLE_NO_ACP_GUARD:-0}" != "1" ]]; then
  TOP="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
  if [[ -n "$TOP" && -f "$TOP/.no-acp-here" ]]; then
    echo
    echo "🛑 SUPERREPO (NO ACP)"
    echo "🔴 Aquí NO se usa 'git acp' (marcado con .no-acp-here)."
    echo
    echo "✅ Usa en su lugar:"
    echo "   • make rel"
    echo "   • make rel-auto"
    echo "   • git rel"
    echo
    if [[ -t 0 && -t 1 ]]; then
      echo
      echo "¿Qué quieres hacer ahora?"
      export COLUMNS=1
      PS3="Elige opción: "
      select opt in "make rel" "make rel-auto" "git rel" "Continuar con 'git acp' (forzar)" "Salir"; do
        case "$REPLY" in
          1) exec make rel ;;
          2) exec make rel-auto ;;
          3) exec git rel ;;
          4) exec env DISABLE_NO_ACP_GUARD=1 "$0" "${ORIG_ARGS[@]}" ;;
          5) echo "✋ Cancelado."; exit 2 ;;
          *) echo "Opción inválida."; continue ;;
        esac
      done
    else
      exit 2
    fi
  fi
fi

# ——— Helpers SSH/Remote ———

AGENT_ENV="${HOME}/.ssh/agent.env"

start_agent() {
  eval "$(ssh-agent -s)" >/dev/null
  mkdir -p "${HOME}/.ssh"
  {
    echo "export SSH_AUTH_SOCK=${SSH_AUTH_SOCK}"
    echo "export SSH_AGENT_PID=${SSH_AGENT_PID}"
  } > "${AGENT_ENV}"
  chmod 600 "${AGENT_ENV}"
}

load_or_start_agent() {
  if [[ -f "${AGENT_ENV}" ]]; then
    # shellcheck disable=SC1090
    source "${AGENT_ENV}"
    if ! kill -0 "${SSH_AGENT_PID:-0}" 2>/dev/null; then
      start_agent
    fi
  else
    start_agent
  fi
}

fingerprint_of() { ssh-keygen -lf "$1" 2>/dev/null | awk '{print $2}'; }

ensure_key_added() {
  local key="$1"
  case "$key" in
    "~/"*) key="${HOME}/${key#~/}" ;;
  esac
  key="${key/#$HOME\/~\//$HOME/}"

  if [[ ! -f "$key" ]]; then
    echo "🔴 Llave no encontrada: $key"
    return 1
  fi

  local fp
  fp="$(fingerprint_of "$key")" || return 1

  if ! ssh-add -l 2>/dev/null | grep -q "$fp"; then
    ssh-add "$key" >/dev/null
    echo "🔑 ssh-add: $key"
  fi
}

test_github_ssh() {
  local host_alias="$1"
  ssh -o StrictHostKeyChecking=accept-new -T "git@${host_alias}" 2>&1 || true
}

normalize_url_to_alias() {
  local alias="$1"
  local url owner repo
  read -r url || { echo ""; return 0; }

  if [[ "$url" =~ ^https://github\.com/([^/]+)/([^/]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[1]}"
    repo="${BASH_REMATCH[2]}"
  elif [[ "$url" =~ ^git@github\.com:([^/]+)/([^/]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[1]}"
    repo="${BASH_REMATCH[2]}"
  elif [[ "$url" =~ ^git@([^:]+):([^/]+)/([^/]+)(\.git)?$ ]]; then
    owner="${BASH_REMATCH[2]}"
    repo="${BASH_REMATCH[3]}"
  else
    echo "$url"
    return 0
  fi
  repo="${repo%.git}"
  repo="${repo%.git}"
  echo "git@${alias}:${owner}/${repo}.git"
}

ensure_remote_exists_and_points_to_alias() {
  local remote="$1" alias="$2" owner="$3"
  local top repo url newurl
  top="$(git rev-parse --show-toplevel)"
  repo="$(basename "$top")"

  if git remote | grep -q "^${remote}$"; then
    url="$(git remote get-url "$remote")"
    newurl="$(echo "$url" | normalize_url_to_alias "$alias")"
    if [[ "$newurl" != "$url" && -n "$newurl" ]]; then
      git remote set-url "$remote" "$newurl"
      echo "🔧 Remote actualizado → $remote = $newurl"
    else
      echo "🟢 Remote OK → $remote = $url"
    fi
  else
    local ssh_url="git@${alias}:${owner}/${repo}.git"
    git remote add "$remote" "$ssh_url"
    echo "➕ Remote agregado → $remote = $ssh_url"
  fi
}

remote_repo_or_create() {
  local remote="$1" alias="$2" owner="$3"
  local url repo r
  url="$(git remote get-url "$remote")"
  repo="$(basename -s .git "$(git rev-parse --show-toplevel)")"
  r="${owner}/${repo}"

  if git ls-remote "$remote" &>/dev/null; then
    return 0
  fi

  echo "ℹ️  No se pudo consultar $remote ($url). ¿Existe el repo? Intentando crear..."
  if [[ "${GH_AUTO_CREATE}" == "true" ]] && command -v gh >/dev/null 2>&1; then
    if gh repo view "$r" &>/dev/null; then
      echo "🟡 El repo $r ya existe. Probablemente es un tema de permisos o llave."
      return 0
    fi
    if gh repo create "$r" --"${GH_DEFAULT_VISIBILITY}" -y; then
      echo "✅ Repo creado en GitHub: $r"
      return 0
    else
      echo "🔴 Falló 'gh repo create $r'. Revisa GH_TOKEN o 'gh auth login'."
      return 0
    fi
  else
    echo "🔴 No se creó automáticamente (GH_AUTO_CREATE=${GH_AUTO_CREATE}, gh CLI no disponible o sin login)."
    return 0
  fi
}

# ——— Selector de identidad ———
# SOLO SE EJECUTA SI ESTAMOS EN MODO PRO (Hay perfiles)
if ! $SIMPLE_MODE; then

  echo "🎩 ¿Con qué sombrero quieres hacer este commit?"
  display_names=()
  for profile in "${PROFILES[@]}"; do
    display_names+=("$(echo "$profile" | cut -d';' -f1)")
  done
  export COLUMNS=1
  PS3="Selecciona una identidad: "
  select opt in "${display_names[@]}" "Cancelar"; do
    if [[ "$opt" == "Cancelar" ]]; then
      echo "❌ Commit cancelado."
      exit 0
    elif [[ -z "$opt" ]]; then
      echo "Opción inválida. Inténtalo de nuevo."
      continue
    else
      selected_profile_config=""
      for profile in "${PROFILES[@]}"; do
        if [[ "$(echo "$profile" | cut -d';' -f1)" == "$opt" ]]; then
          selected_profile_config="$profile"
          break
        fi
      done
      [[ -z "${selected_profile_config:-}" ]] && { echo "❌ Perfil no encontrado."; exit 1; }

      IFS=';' read -r display_name git_name git_email gpg_key push_target ssh_host_alias ssh_key_path gh_owner <<< "$selected_profile_config"

      echo "✅ Usando la identidad de '$display_name' (firmado como '$git_name')."
      git config user.name "$git_name"
      git config user.email "$git_email"
      git config commit.gpgsign true
      git config user.signingkey "${gpg_key:-}" 2>/dev/null || true

      if [[ -z "${ssh_host_alias:-}" ]]; then
        ssh_host_alias="$(grep -E '^[[:space:]]*Host github\.com-' -A0 -h ~/.ssh/config 2>/dev/null | awk '{print $2}' | head -n1 || true)"
        [[ -z "$ssh_host_alias" ]] && ssh_host_alias="github.com"
      fi
      if [[ -z "${gh_owner:-}" ]]; then
        if [[ "$ssh_host_alias" =~ ^github\.com-(.+)$ ]]; then gh_owner="${BASH_REMATCH[1]}"; else gh_owner="$(git config github.user || true)"; fi
        [[ -z "$gh_owner" ]] && gh_owner="${git_name%% *}"
      fi
      if [[ -z "${ssh_key_path:-}" ]]; then
        if [[ "$ssh_host_alias" =~ ^github\.com-(.+)$ ]]; then
          ssh_key_path="${HOME}/.ssh/id_ed25519_${BASH_REMATCH[1]}"
        else
          ssh_key_path="${HOME}/.ssh/id_ed25519"
        fi
      fi

      load_or_start_agent
      ensure_key_added "$ssh_key_path" || true
      test_github_ssh "$ssh_host_alias" || true
      ensure_remote_exists_and_points_to_alias "$push_target" "$ssh_host_alias" "$gh_owner"
      remote_repo_or_create "$push_target" "$ssh_host_alias" "$gh_owner"

      echo "🟢 Remoto listo → '${push_target}' (host: ${ssh_host_alias}, owner: ${gh_owner})"
      echo "✅ El commit se enviará a '${push_target}'."
      break
    fi
  done
  IFS=$'\n\t'
else
  # MODO SIMPLE PARA OTROS DEVS
  echo "⚡ Modo Estándar (Sin gestión de identidades avanzada)."
  # push_target ya se definió como "origin" arriba
fi

# ——— Flags/args ———
NO_PUSH=false
DRY_RUN=false
ARGS=()
while (( $# )); do
  case "$1" in
    --no-push) NO_PUSH=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --force|--i-know-what-im-doing) shift ;;
    *) ARGS+=("$1"); shift ;;
  esac
done

if [ ${#ARGS[@]} -eq 0 ] && ! $DRY_RUN; then
  # Si estamos en modo simple, usamos read simple, si no, asumimos interactivo
  INTERACTIVE=true
  if $SIMPLE_MODE; then
    echo "📝 Escribe tu mensaje de commit:"
    read -r MSG
    INTERACTIVE=false
  fi
else
  INTERACTIVE=false
  MSG="${ARGS[*]}"
fi

# ——— Funciones commit/push ———
get_today()   { date +%F; }
count_today() { git rev-list --count --since="$1 $DAY_START" HEAD; }

do_commit() {
  local msg="$1"
  local count="$2"
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M')"

  git add .
  if $INTERACTIVE; then
    # Si no hay mensaje en argumentos, git commit abre el editor
    # (En interactivo no inyectamos la fecha automáticamente para no complicar el editor)
    git commit
  else
    # Aquí inyectamos el mensaje del usuario, la FECHA y el CONTEO
    git commit -m "$msg" -m "📅 Fecha: $timestamp" -m "${REFS_LABEL} #$count"
  fi
}

do_push() {
  local remote="$1"
  local branch
  local target_ref

  # 1. Intentar obtener el nombre de la rama actual
  branch="$(git branch --show-current 2>/dev/null || echo "")"

  # 2. Lógica para Submódulos / HEAD Desacoplado
  if [[ -z "$branch" ]]; then
    echo "⚠️  HEAD desacoplado detectado (común en submódulos)."
    echo "🔄 Asumiendo destino hacia rama 'main'..."
    branch="main"
    # IMPORTANTE: Empujamos HEAD (donde estás) hacia main remoto
    target_ref="HEAD:refs/heads/main"
  else
    target_ref="$branch"
  fi

  echo "📡 Enviando a '$remote' (Ref: $target_ref)..."

  # Intento 1: Push normal
  if git push "$remote" "$target_ref"; then
    return 0
  fi

  echo "⚠️  El push fue rechazado (posiblemente hay cambios remotos nuevos)."
  echo "🔄 Iniciando auto-reparación: 'git pull --rebase'..."

  # Intento 2: Pull rebase y luego push
  # Nota: Hacemos pull de la rama destino (branch) para actualizar nuestro HEAD desacoplado
  if git pull --rebase "$remote" "$branch"; then
     echo "✅ Rebase exitoso. Sincronizando tags y reintentando push..."
     git fetch --tags --force "$remote"
     git push "$remote" "$target_ref"
  else
     echo "❌ Conflicto irresoluble automáticamente."
     echo "🛠  Por favor, resuelve los conflictos manualmente y luego ejecuta:"
     echo "    git push $remote $target_ref"
     exit 1
  fi
}

# ——— Lógica ———
TODAY=$(get_today)
COUNT_BEFORE=$(count_today "$TODAY")
NEXT=$((COUNT_BEFORE + 1))

if ! $DRY_RUN; then
  do_commit "${MSG:-}" "$NEXT"
  if ! $NO_PUSH; then
    do_push "$push_target"
  else
    echo "⚠️  Se omitió el push (--no-push)."
  fi
fi

TOTAL_TODAY=$(count_today "$TODAY")
REMAIN=$(( DAILY_GOAL - TOTAL_TODAY ))
(( REMAIN < 0 )) && REMAIN=0
PERCENT=$(( DAILY_GOAL > 0 ? (TOTAL_TODAY * 100 / DAILY_GOAL) : 100 ))
(( PERCENT > 100 )) && PERCENT=100

BAR_LENGTH=30
FILLED=$(( PERCENT * BAR_LENGTH / 100 ))
EMPTY=$(( BAR_LENGTH - FILLED ))
bar=""
for ((i=0; i<FILLED; i++)); do bar+="#"; done
for ((i=0; i<EMPTY;  i++)); do bar+="-"; done

GREEN='\033[0;32m'; NC='\033[0m'
echo
echo -e "${GREEN}┌─────────────────────────────────────────────"
echo -e "│ 📊 Commits hoy: ${TOTAL_TODAY}/${DAILY_GOAL} (${PERCENT}%)"
echo -e "│ Progress : |${bar}|"
echo -e "│ Faltan   : ${REMAIN} commit(s) para la meta diaria"
echo -e "└─────────────────────────────────────────────${NC}"

if $DRY_RUN; then
  echo -e "${GREEN}⚗️  Simulación (--dry-run); no se hizo commit ni push.${NC}"
fi