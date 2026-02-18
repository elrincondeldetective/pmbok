#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_TMPL="${ROOT_DIR}/deploy/argocd/apps.tmpl.yaml"
APP_STATIC="${ROOT_DIR}/deploy/argocd/apps.yaml"
APP_TO_APPLY="${APP_STATIC}"
ARGOCD_INSTALL_URL="${ARGOCD_INSTALL_URL:-https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml}"
TMP_FILES=()

cleanup_tmp() {
  local f
  for f in "${TMP_FILES[@]:-}"; do
    [[ -n "${f}" ]] && rm -f "${f}" || true
  done
}

trap cleanup_tmp EXIT

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Falta comando requerido: $1" >&2
    exit 1
  }
}

for cmd in minikube kubectl kustomize docker git; do
  need_cmd "$cmd"
done

PROFILE="${MINIKUBE_PROFILE:-pmbok}"
ARGOCD_NS="argocd"
APP_NAME="pmbok-local-basic"

REPO_URL_OVERRIDE="${PMBOK_REPO_URL:-}"
REVISION_OVERRIDE="${PMBOK_REVISION:-}"

if [[ -n "${REPO_URL_OVERRIDE}" || -n "${REVISION_OVERRIDE}" ]]; then
  need_cmd envsubst
  if [[ ! -f "${APP_TMPL}" ]]; then
    echo "❌ Falta template: ${APP_TMPL}" >&2
    exit 1
  fi
  REPO_URL="${REPO_URL_OVERRIDE:-https://github.com/elrincondeldetective/pmbok.git}"
  REVISION="${REVISION_OVERRIDE:-main}"
  tmp_manifest="$(mktemp)"
  TMP_FILES+=("${tmp_manifest}")
  export REPO_URL REVISION
  envsubst < "${APP_TMPL}" > "${tmp_manifest}"
  APP_TO_APPLY="${tmp_manifest}"
else
  if [[ ! -f "${APP_STATIC}" ]]; then
    echo "❌ Falta manifiesto estático: ${APP_STATIC}" >&2
    exit 1
  fi
fi

echo "🚀 minikube start (profile=${PROFILE})"
minikube start -p "${PROFILE}"

# Requisito de cluster limpio: contexto dedicado del profile
echo "🎯 usando contexto kubectl: ${PROFILE}"
kubectl config use-context "${PROFILE}"

echo "🌐 habilitando ingress"
if command -v timeout >/dev/null 2>&1; then
  if ! timeout 180 minikube -p "${PROFILE}" addons enable ingress; then
    echo "⚠️  no pude confirmar ingress en 180s; continúo."
  fi
else
  if ! minikube -p "${PROFILE}" addons enable ingress; then
    echo "⚠️  fallo habilitando ingress; continúo."
  fi
fi

echo "📦 verificando ArgoCD"
kubectl get ns "${ARGOCD_NS}" >/dev/null 2>&1 || kubectl create ns "${ARGOCD_NS}"

if kubectl -n "${ARGOCD_NS}" get deploy argocd-server >/dev/null 2>&1 \
   && kubectl get crd applications.argoproj.io >/dev/null 2>&1; then
  echo "ℹ️  ArgoCD ya instalado. Omito reinstalación."
else
  echo "📦 instalando ArgoCD"
  kubectl create ns "${ARGOCD_NS}" --dry-run=client -o yaml | kubectl apply -f -
  argocd_install_manifest="${ROOT_DIR}/deploy/argocd/install/argocd.yaml"
  if [[ ! -f "${argocd_install_manifest}" ]]; then
    need_cmd curl
    argocd_install_manifest="$(mktemp)"
    TMP_FILES+=("${argocd_install_manifest}")
    curl -fsSL "${ARGOCD_INSTALL_URL}" -o "${argocd_install_manifest}"
  fi
  kubectl apply --server-side --force-conflicts --field-manager=argocd-installer -n "${ARGOCD_NS}" -f "${argocd_install_manifest}"
fi

echo "⏳ esperando argocd-repo-server"
kubectl -n "${ARGOCD_NS}" rollout status deploy/argocd-repo-server --timeout=240s
echo "⏳ esperando argocd-server"
kubectl -n "${ARGOCD_NS}" rollout status deploy/argocd-server --timeout=240s

echo "🐳 construyendo imágenes en docker de minikube"
source <(minikube -p "${PROFILE}" docker-env)
docker build -t pmbok-backend:dev "${ROOT_DIR}/backend"
docker build -t pmbok-frontend:dev "${ROOT_DIR}/frontend"

echo "🧩 aplicando Application"
kubectl apply -f "${APP_TO_APPLY}"

echo "⏳ esperando estado Synced/Healthy de ${APP_NAME}"
for i in $(seq 1 120); do
  sync="$(kubectl -n "${ARGOCD_NS}" get application "${APP_NAME}" -o jsonpath='{.status.sync.status}' 2>/dev/null || true)"
  health="$(kubectl -n "${ARGOCD_NS}" get application "${APP_NAME}" -o jsonpath='{.status.health.status}' 2>/dev/null || true)"
  echo "tick=${i} sync=${sync:-NA} health=${health:-NA}"
  if [[ "${sync}" == "Synced" && "${health}" == "Healthy" ]]; then
    echo "✅ ${APP_NAME} Synced/Healthy"
    exit 0
  fi
  sleep 5
done

echo "❌ Timeout esperando Synced/Healthy en ${APP_NAME}" >&2
kubectl -n "${ARGOCD_NS}" get application "${APP_NAME}" -o yaml || true
exit 1
