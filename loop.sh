#!/bin/bash
set -euo pipefail

# Ralph Wiggum Loop Script for Cursor CLI
# Usage:
#   ./loop.sh [plan] [max_iterations]       # Plan/build on current branch
#   ./loop.sh plan-work "work description"  # Create scoped plan on current branch
# Examples:
#   ./loop.sh                               # Build mode, unlimited
#   ./loop.sh 20                            # Build mode, max 20 iterations
#   ./loop.sh plan                          # Full planning, unlimited
#   ./loop.sh plan 5                        # Full planning, max 5 iterations
#   ./loop.sh plan-work "user auth"         # Scoped planning for specific work
#
# Environment variables:
#   PLAN_MODEL  - Model for planning mode (default: claude-4.5-opus)
#   BUILD_MODEL - Model for building mode (default: claude-4.5-sonnet)

# Default models (can be overridden via environment variables)
PLAN_MODEL="${PLAN_MODEL:-claude-4.5-opus}"
BUILD_MODEL="${BUILD_MODEL:-claude-4.5-sonnet}"

# Parse arguments
MODE="build"
PROMPT_FILE="PROMPT_build.md"
MODEL="$BUILD_MODEL"
MAX_ITERATIONS=0
WORK_DESCRIPTION=""

if [ "${1:-}" = "plan" ]; then
    MODE="plan"
    PROMPT_FILE="PROMPT_plan.md"
    MODEL="$PLAN_MODEL"
    MAX_ITERATIONS=${2:-0}
elif [ "${1:-}" = "plan-work" ]; then
    if [ -z "${2:-}" ]; then
        echo "Error: plan-work requires a work description"
        echo "Usage: ./loop.sh plan-work \"description of the work\""
        exit 1
    fi
    MODE="plan-work"
    WORK_DESCRIPTION="$2"
    PROMPT_FILE="PROMPT_plan_work.md"
    MODEL="$PLAN_MODEL"
    MAX_ITERATIONS=${3:-5}
elif [[ "${1:-}" =~ ^[0-9]+$ ]]; then
    MAX_ITERATIONS=$1
fi

ITERATION=0
CURRENT_BRANCH=$(git branch --show-current)

# Validate branch for plan-work mode
if [ "$MODE" = "plan-work" ]; then
    if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
        echo "Error: plan-work should be run on a work branch, not main/master"
        echo "Create a work branch first: git checkout -b ralph/your-work"
        exit 1
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Mode:   $MODE"
echo "Model:  $MODEL"
echo "Prompt: $PROMPT_FILE"
echo "Branch: $CURRENT_BRANCH"
[ "$MAX_ITERATIONS" -gt 0 ] && echo "Max:    $MAX_ITERATIONS iterations"
[ -n "$WORK_DESCRIPTION" ] && echo "Work:   $WORK_DESCRIPTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verify prompt file exists
if [ ! -f "$PROMPT_FILE" ]; then
    echo "Error: $PROMPT_FILE not found"
    exit 1
fi

# Main loop
while true; do
    if [ "$MAX_ITERATIONS" -gt 0 ] && [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
        echo "Reached max iterations: $MAX_ITERATIONS"

        if [ "$MODE" = "plan-work" ]; then
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "Scoped plan created for: $WORK_DESCRIPTION"
            echo "To build, run:"
            echo "  ./loop.sh"
            echo "  ./loop.sh 20"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        fi
        break
    fi

    ITERATION=$((ITERATION + 1))
    echo -e "\n======================== ITERATION $ITERATION ========================\n"

    # For plan-work mode, substitute ${WORK_SCOPE} in prompt
    if [ "$MODE" = "plan-work" ]; then
        WORK_SCOPE="$WORK_DESCRIPTION" envsubst < "$PROMPT_FILE" | agent -p --model "$MODEL" --output-format json
    else
        agent -p "$(cat "$PROMPT_FILE")" --model "$MODEL" --output-format json
    fi

    # Push changes after each iteration
    git push origin "$CURRENT_BRANCH" 2>/dev/null || {
        echo "Creating remote branch..."
        git push -u origin "$CURRENT_BRANCH"
    }

    echo -e "\n======================== ITERATION $ITERATION COMPLETE ========================\n"
done
