#!/bin/bash

# Centralized guard for database operations
# Usage: ./scripts/db-guard.sh <command_description> <destructive_flag_required>

NODE_ENV="${NODE_ENV:-development}"

COMMAND_DESC=$1
DESTRUCTIVE_REQUIRED=$2

# Colors
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Block prohibited commands in production/staging environments
if [[ "$NODE_ENV" == "production" || "$NODE_ENV" == "staging" || "$VERCEL" == "1" ]]; then
  if [[ "$COMMAND_DESC" == *"migrate dev"* || "$COMMAND_DESC" == *"db push"* || "$COMMAND_DESC" == *"migrate reset"* ]]; then
    echo -e "${RED}ERROR: '$COMMAND_DESC' is PERMANENTLY BLOCKED in $NODE_ENV / Vercel.${NC}"
    exit 1
  fi

  if [[ "$DESTRUCTIVE_REQUIRED" == "true" ]]; then
    echo -e "${RED}ERROR: Destructive command '$COMMAND_DESC' is PERMANENTLY BLOCKED in $NODE_ENV environment.${NC}"
    exit 1
  fi
fi

# 2. Require explicit flag for destructive operations in local development
if [[ "$DESTRUCTIVE_REQUIRED" == "true" ]]; then
  if [[ "$ALLOW_DESTRUCTIVE_DB" != "YES_I_KNOW" ]]; then
    echo -e "${RED}ERROR: Command '$COMMAND_DESC' is destructive.${NC}"
    echo "To proceed, you must set: ALLOW_DESTRUCTIVE_DB=YES_I_KNOW"
    echo "Example: ALLOW_DESTRUCTIVE_DB=YES_I_KNOW npm run db:reset"
    exit 1
  fi
fi

# 3. Block dev-only commands unless LOCAL_DEV=1
if [[ "$COMMAND_DESC" == *"migrate dev"* || "$COMMAND_DESC" == *"db push"* ]]; then
  if [[ "$LOCAL_DEV" != "1" && "$NODE_ENV" != "development" ]]; then
     echo -e "${RED}ERROR: '$COMMAND_DESC' is restricted to local development environments (LOCAL_DEV=1).${NC}"
     exit 1
  fi
fi

exit 0
