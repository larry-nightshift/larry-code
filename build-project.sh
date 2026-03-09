#!/bin/bash

################################################################################
# Autonomous Project Builder
#
# This script reads project requirements and uses Claude to:
# 1. Understand and research the requirements
# 2. Plan the backend and frontend
# 3. Implement both backend and frontend autonomously
# 4. Commit and push to GitHub
#
# Usage: ./build-project.sh [requirements_file]
# Default: docs/project_march_9.md
################################################################################

set -e

REQUIREMENTS_FILE="${1:-docs/project_march_9.md}"
PROJECT_ROOT=$(pwd)
MODEL="claude-haiku-4-5-20251001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║             Autonomous Project Builder                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Validate prerequisites
echo -e "${YELLOW}[1/5] Validating prerequisites...${NC}"

if [ ! -f "$REQUIREMENTS_FILE" ]; then
    echo -e "${RED}✗ Requirements file not found: $REQUIREMENTS_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Requirements file found${NC}"

if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}✗ Must run from project root with backend/ and frontend/ directories${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project structure valid${NC}"

if [ ! -f "backend/CLAUDE.md" ]; then
    echo -e "${YELLOW}⚠ backend/CLAUDE.md not found${NC}"
fi

if ! command -v claude &> /dev/null; then
    echo -e "${RED}✗ Claude CLI not found in PATH${NC}"
    echo "   Install: https://github.com/anthropics/claude-code"
    exit 1
fi
echo -e "${GREEN}✓ Claude CLI available${NC}"

# Read requirements
echo ""
echo -e "${YELLOW}[2/5] Reading requirements...${NC}"
REQUIREMENTS=$(cat "$REQUIREMENTS_FILE")
echo -e "${GREEN}✓ Requirements loaded${NC}"

# Create the autonomous prompt
echo ""
echo -e "${YELLOW}[3/5] Preparing Claude prompt...${NC}"

read -r -d '' CLAUDE_PROMPT << 'AUTONOMOUS_PROMPT_EOF' || true
# PROJECT BUILDER - AUTONOMOUS MODE

You are an expert full-stack developer. Build the following project completely autonomously.

**CRITICAL: Make ALL decisions yourself. DO NOT ask the user questions. DO NOT ask for approval. Work end-to-end without stopping.**

---

## REQUIREMENTS:

```
AUTONOMOUS_PROMPT_EOF

CLAUDE_PROMPT="${CLAUDE_PROMPT}${REQUIREMENTS}"

read -r -d '' CLAUDE_PROMPT_END << 'AUTONOMOUS_PROMPT_EOF2' || true
```

---

## YOUR TASK - EXECUTE COMPLETELY AUTONOMOUSLY:

### PHASE 1: UNDERSTAND & RESEARCH
1. Read the requirements thoroughly
2. Identify any missing features that are important:
   - Security requirements (auth, validation, permissions)
   - Performance considerations (caching, pagination)
   - Error handling and edge cases
   - Best practices in the domain
3. List what's missing and why it's needed

### PHASE 2: PLAN BACKEND (NO APPROVAL NEEDED - JUST PLAN)
1. Read backend/CLAUDE.md to understand conventions
2. Design a new Django app following the `/api/<app_name>/` pattern
3. Plan:
   - Django app name (use underscores, lowercase)
   - Models with all fields
   - Serializers (read/write if needed)
   - ViewSets and endpoints
   - Any Celery tasks needed
   - Tests needed
4. Output your plan but DO NOT implement yet

### PHASE 3: PLAN FRONTEND (NO APPROVAL NEEDED - JUST PLAN)
1. Read frontend/CLAUDE.md to understand conventions (if it exists)
2. Design React components and pages:
   - List all pages/views needed
   - Component hierarchy
   - State management approach
   - API endpoints to call
3. Output your plan but DO NOT implement yet

### PHASE 4: IMPLEMENT BACKEND (NO APPROVAL - IMPLEMENT NOW)
1. Create the Django app: `python manage.py startapp <app_name>`
2. Implement models.py:
   - Define all models
   - Add created_at, updated_at fields
   - Add __str__ methods
   - Add Meta classes with ordering
3. Create migrations: `python manage.py makemigrations`
4. Implement serializers.py:
   - Create ModelSerializers
   - Add custom validation
   - Create separate read/write serializers if needed
5. Implement views.py / viewsets.py:
   - Create ViewSets for CRUD
   - Create APIViews for custom endpoints
   - Use proper permissions (IsAuthenticated)
   - Implement filtering, pagination where needed
6. Create urls.py:
   - Register viewsets with routers
   - Use `/api/<app_name>/` pattern
7. Register in config/urls.py: Add `path('<app_name>/', include('...'))`
8. Create tests.py:
   - Test model creation
   - Test API endpoints
   - Test permissions
9. Run migrations: `python manage.py migrate`
10. Verify backend works

### PHASE 5: IMPLEMENT FRONTEND (NO APPROVAL - IMPLEMENT NOW)
1. Create all React components in src/components/<app_name>/
2. Create pages in src/pages/ (if needed)
3. Implement API service: src/api/<app_name>Service.js
4. Add state management (Context or Zustand, matching project patterns)
5. Create forms and UI components
6. Add styling (match existing project theme)
7. Test API integration in development

### PHASE 6: VERIFY & TEST
1. Restart backend: `python manage.py runserver`
2. Test API endpoints (use REST client or curl)
3. Test frontend pages load correctly
4. Test API integration from frontend
5. Fix any issues found

### PHASE 7: GIT OPERATIONS (WHEN EVERYTHING WORKS)
Only when backend AND frontend are fully working:

1. Run: `git add .`
2. Run: `git commit -m 'feat: implement [feature name with backend API and frontend UI]'`
3. Run: `git push`

---

## CONSTRAINTS:
- DO NOT ask me questions
- DO NOT ask for approval on any design decision
- DO NOT pause for confirmation
- Work as fast as possible
- Follow best practices from CLAUDE.md files
- Ensure code quality is high
- Complete all 7 phases

## TOOLS AVAILABLE:
Read, Edit, Write, Bash, Agent, Glob, Grep

START NOW. Execute all phases autonomously without stopping.
AUTONOMOUS_PROMPT_EOF2

CLAUDE_PROMPT="${CLAUDE_PROMPT}${CLAUDE_PROMPT_END}"

echo -e "${GREEN}✓ Prompt prepared ($(echo "$CLAUDE_PROMPT" | wc -c) characters)${NC}"

# Display what's about to happen
echo ""
echo -e "${BLUE}Claude will now:${NC}"
echo "  1. Research and understand requirements"
echo "  2. Plan backend (no approval needed)"
echo "  3. Plan frontend (no approval needed)"
echo "  4. Implement full backend autonomously"
echo "  5. Implement full frontend autonomously"
echo "  6. Test everything"
echo "  7. Commit and push to GitHub"
echo ""
echo -e "${YELLOW}This may take 5-15 minutes depending on complexity...${NC}"
echo ""

# Launch Claude
echo -e "${YELLOW}[4/5] Launching Claude...${NC}"
echo "────────────────────────────────────────────────────────────────"

# Pass prompt to Claude via stdin
echo "$CLAUDE_PROMPT" | claude \
    --model "$MODEL" \
    --allowedTools "Read,Edit,Write,Bash,Agent,Glob,Grep" \
    --permission-mode acceptEdits

echo "────────────────────────────────────────────────────────────────"
echo ""

# Post-build validation
echo -e "${YELLOW}[5/5] Post-build validation...${NC}"

# Check if git operations were completed
if git diff --quiet HEAD~1 2>/dev/null; then
    echo -e "${GREEN}✓ Changes committed and repository is clean${NC}"
    git log --oneline -3 | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "  Run 'git status' to see changes"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    BUILD COMPLETE ✓                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  • Test the new feature: ${BLUE}python backend/manage.py runserver${NC}"
echo "  • Frontend development: ${BLUE}cd frontend && npm run dev${NC}"
echo "  • View changes: ${BLUE}git log --stat -2${NC}"
echo ""
