#!/usr/bin/env bash
# ==============================================================================
# Mapletyne MTT Charge CPO - Unified E2E Test Suite Runner
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PROJECT_ROOT="$(cd "$DIR/../.." >/dev/null 2>&1 && pwd)"

MODE="all"
TIER=""
MILESTONE=""
SUITE="platform"
EXTRA_ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    --baseline)
      MODE="baseline"
      shift
      ;;
    --all)
      MODE="all"
      shift
      ;;
    --strict)
      MODE="strict"
      shift
      ;;
    --tier)
      TIER="$2"
      shift 2
      ;;
    --milestone)
      MILESTONE="$2"
      SUITE="visual"
      shift 2
      ;;
    --visual)
      SUITE="visual"
      shift
      ;;
    --platform)
      SUITE="platform"
      shift
      ;;
    *)
      EXTRA_ARGS+=("$1")
      shift
      ;;
  esac
done

cd "$PROJECT_ROOT"

echo "======================================================================"
echo " Mapletyne MTT Charge CPO: E2E Automated Verification Runner"
echo "======================================================================"
echo " Mode:      $MODE"
echo " Suite:     $SUITE"
echo " Tier:      ${TIER:-All Tiers (1-4)}"
echo " Gateway:   ${INGRESS_BASE_URL:-http://localhost:34080}"
echo " Core CSMS: ${CORE_BASE_URL:-http://localhost:34800}"
echo " Keycloak:  ${KEYCLOAK_BASE_URL:-http://localhost:34085}"
echo " Root:      $PROJECT_ROOT"
echo "----------------------------------------------------------------------"

if [[ "$SUITE" == "visual" ]]; then
  PYTEST_CMD=(python3 -m pytest tests/e2e/test_penpot_visual_replication.py -v)
  if [[ -n "$TIER" ]]; then
    PYTEST_CMD+=(-m "tier$TIER")
  elif [[ -n "$MILESTONE" ]]; then
    PYTEST_CMD+=(-m "$MILESTONE")
  elif [[ "$MODE" == "baseline" ]]; then
    PYTEST_CMD+=(-m "baseline")
  fi
else
  # Default: Mapletyne Platform 4-Tier Hardened E2E Test Suite
  if [[ -n "$TIER" ]]; then
    case $TIER in
      1)
        PYTEST_CMD=(python3 -m pytest tests/e2e/test_tier1_features.py -v)
        ;;
      2)
        PYTEST_CMD=(python3 -m pytest tests/e2e/test_tier2_boundaries.py -v)
        ;;
      3)
        PYTEST_CMD=(python3 -m pytest tests/e2e/test_tier3_combinations.py -v)
        ;;
      4)
        PYTEST_CMD=(python3 -m pytest tests/e2e/test_tier4_scenarios.py -v)
        ;;
      *)
        PYTEST_CMD=(python3 -m pytest tests/e2e/test_tier${TIER}*.py -v)
        ;;
    esac
  else
    PYTEST_CMD=(python3 -m pytest \
      tests/e2e/test_tier1_features.py \
      tests/e2e/test_tier2_boundaries.py \
      tests/e2e/test_tier3_combinations.py \
      tests/e2e/test_tier4_scenarios.py \
      -v)
  fi
fi

if [[ "$MODE" == "strict" ]]; then
  export STRICT_ALL=1
fi

if [[ ${#EXTRA_ARGS[@]} -gt 0 ]]; then
  PYTEST_CMD+=("${EXTRA_ARGS[@]}")
fi

echo " Command: ${PYTEST_CMD[*]}"
echo "======================================================================"

set +e
"${PYTEST_CMD[@]}"
EXIT_CODE=$?
set -e

echo "----------------------------------------------------------------------"
if [[ $EXIT_CODE -eq 0 ]]; then
  echo " [SUCCESS] E2E test suite executed successfully with 0 errors!"
else
  echo " [FAILED] One or more E2E tests failed with exit code $EXIT_CODE."
fi
echo "======================================================================"
exit $EXIT_CODE
