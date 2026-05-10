#!/usr/bin/env bash
# ============================================================
#  SGM – Setup Automatizado
#  Uso: bash setup.sh
# ============================================================
set -e

BLUE='\033[1;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
step()  { echo -e "\n${BLUE}▶ $1${NC}"; }
ok()    { echo -e "  ${GREEN}✓ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠ $1${NC}"; }
ask()   { echo -e "  ${YELLOW}→ $1${NC}"; }
error() { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

echo -e "${BLUE}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  SGM – Sistema de Gestão de Mangueiras    ║"
echo "  ║  Setup Automatizado v1.0                  ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ── 1. Check Node ──────────────────────────────────────────
step "Verificando Node.js"
if ! command -v node &>/dev/null; then error "Node.js não encontrado. Instale em https://nodejs.org"; fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then error "Node.js 18+ necessário (atual: $(node -v))"; fi
ok "Node.js $(node -v)"

# ── 2. Install dependencies ────────────────────────────────
step "Instalando dependências npm"
npm install
ok "npm install concluído"

# ── 3. Env file ────────────────────────────────────────────
step "Configurando variáveis de ambiente"
if [ -f .env.local ]; then
  warn ".env.local já existe. Pulando."
else
  cp .env.example .env.local
  echo ""
  ask "Preencha as variáveis no arquivo .env.local :"
  ask "  NEXT_PUBLIC_SUPABASE_URL      → Project Settings > API > Project URL"
  ask "  NEXT_PUBLIC_SUPABASE_ANON_KEY → Project Settings > API > anon public"
  ask "  SUPABASE_SERVICE_ROLE_KEY     → Project Settings > API > service_role"
  echo ""
  read -p "  Pressione ENTER quando .env.local estiver preenchido... " _
fi

# ── 4. Load env vars ───────────────────────────────────────
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | grep -v '^$' | xargs) 2>/dev/null || true
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"xxxx"* ]]; then
  warn "NEXT_PUBLIC_SUPABASE_URL não configurado. Pulando migração do banco."
  SKIP_DB=true
fi

# ── 5. Database migration ──────────────────────────────────
if [ -z "$SKIP_DB" ]; then
  step "Aplicando schema no Supabase"
  if command -v psql &>/dev/null; then
    DB_URL="${SUPABASE_DB_URL:-}"
    if [ -n "$DB_URL" ]; then
      psql "$DB_URL" -f supabase/migrations/001_schema.sql
      psql "$DB_URL" -f supabase/migrations/002_seed.sql
      ok "Schema e seed aplicados via psql"
    else
      warn "SUPABASE_DB_URL não definida. Copie e cole o SQL manualmente."
      warn "Arquivos: supabase/migrations/001_schema.sql e 002_seed.sql"
    fi
  else
    warn "psql não encontrado. Aplicando SQL via API REST..."
    # Apply schema via Supabase REST API
    curl -s -X POST \
      "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"sql\": $(cat supabase/migrations/001_schema.sql | jq -Rs .)}" \
      >/dev/null 2>&1 || warn "Erro na aplicação via REST. Aplique o SQL manualmente no Supabase Dashboard."
    ok "Tentativa de migração via REST concluída"
    warn "Verifique o Dashboard do Supabase: https://app.supabase.com → SQL Editor"
  fi
fi

# ── 6. Git setup ───────────────────────────────────────────
step "Configurando repositório Git"
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "feat: initial commit – SGM v1.0"
  ok "Repositório git inicializado"
else
  ok "Git já inicializado"
fi

# ── 7. GitHub repo ─────────────────────────────────────────
step "Criando repositório no GitHub"
if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null; then
    read -p "  Nome do repositório GitHub (default: sgm): " REPO_NAME
    REPO_NAME="${REPO_NAME:-sgm}"
    read -p "  Público ou privado? (public/private, default: private): " VISIBILITY
    VISIBILITY="${VISIBILITY:-private}"
    gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push
    REPO_URL=$(gh repo view --json url -q .url)
    ok "Repositório criado e código enviado: $REPO_URL"
  else
    warn "Execute 'gh auth login' para autenticar no GitHub CLI"
    ask "Depois: gh repo create sgm --private --source=. --remote=origin --push"
  fi
else
  warn "GitHub CLI (gh) não encontrado."
  ask "Opção A: Instale em https://cli.github.com e rode 'gh repo create sgm --private --source=. --remote=origin --push'"
  ask "Opção B: Crie o repo manualmente em https://github.com/new e faça:"
  ask "  git remote add origin https://github.com/SEU_USUARIO/sgm.git"
  ask "  git push -u origin main"
fi

# ── 8. Vercel ──────────────────────────────────────────────
step "Deploy no Vercel"
if command -v vercel &>/dev/null || npm list -g vercel &>/dev/null 2>&1; then
  ask "Iniciando deploy no Vercel (siga as instruções interativas)..."
  echo ""
  vercel --yes 2>/dev/null || npx vercel --yes
  echo ""
  ok "Deploy Vercel concluído!"
  warn "Configure as variáveis de ambiente no Vercel Dashboard:"
  warn "  https://vercel.com/dashboard → Projeto → Settings → Environment Variables"
  warn "  Adicione: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
else
  warn "Vercel CLI não encontrado. Instalando..."
  npm install -g vercel
  vercel --yes || warn "Configure manualmente em https://vercel.com"
fi

# ── 9. GitHub Secrets para CI/CD ──────────────────────────
step "Configurando Secrets no GitHub (para CI/CD automático)"
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  ask "Para o deploy automático via GitHub Actions, adicione os secrets:"
  ask "  VERCEL_TOKEN     → https://vercel.com/account/tokens"
  ask "  VERCEL_ORG_ID    → vercel.json após 'vercel link'"
  ask "  VERCEL_PROJECT_ID → vercel.json após 'vercel link'"
  echo ""
  read -p "  Tem o VERCEL_TOKEN disponível agora? (s/n): " HAS_TOKEN
  if [[ "$HAS_TOKEN" =~ ^[Ss]$ ]]; then
    read -sp "  VERCEL_TOKEN: " V_TOKEN; echo
    read -p   "  VERCEL_ORG_ID: " V_ORG
    read -p   "  VERCEL_PROJECT_ID: " V_PROJ
    gh secret set VERCEL_TOKEN     --body "$V_TOKEN"
    gh secret set VERCEL_ORG_ID    --body "$V_ORG"
    gh secret set VERCEL_PROJECT_ID --body "$V_PROJ"
    ok "GitHub Secrets configurados! CI/CD ativo: todo push na main faz deploy automático."
  else
    warn "Configure manualmente em: GitHub repo → Settings → Secrets → Actions"
  fi
fi

# ── DONE ───────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗"
echo -e "║  ✅ Setup concluído!                              ║"
echo -e "╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Próximos passos:${NC}"
echo -e "  1. Confirme que .env.local está preenchido"
echo -e "  2. Execute o schema SQL no Supabase Dashboard (se não foi automático)"
echo -e "     → supabase/migrations/001_schema.sql"
echo -e "     → supabase/migrations/002_seed.sql"
echo -e "  3. Adicione as env vars no Vercel Dashboard"
echo -e "  4. npm run dev  → http://localhost:3000"
echo ""
