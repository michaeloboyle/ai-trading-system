#!/bin/bash

# Claude Code tmux session manager for ai-trading-system
# Usage: ./claude-tmux.sh [start|attach|stop]

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
SESSION_NAME="claude-$(basename "$PROJECT_DIR")"

case "${1:-start}" in
    start)
        # Check if session already exists
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            echo "Session '$SESSION_NAME' already exists. Use 'attach' to connect."
            exit 1
        fi
        
        # Create new session
        tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR"
        
        # Setup windows
        tmux rename-window -t "$SESSION_NAME:0" "main"
        tmux new-window -t "$SESSION_NAME" -n "docker" -c "$PROJECT_DIR"
        tmux new-window -t "$SESSION_NAME" -n "logs" -c "$PROJECT_DIR"
        tmux new-window -t "$SESSION_NAME" -n "test" -c "$PROJECT_DIR"
        
        # Start docker services in docker window
        tmux send-keys -t "$SESSION_NAME:docker" "docker-compose up -d" Enter
        
        # Setup log monitoring in logs window
        tmux send-keys -t "$SESSION_NAME:logs" "docker-compose logs -f" Enter
        
        # Return to main window
        tmux select-window -t "$SESSION_NAME:main"
        
        echo "Session '$SESSION_NAME' created. Use 'tmux attach -t $SESSION_NAME' or './claude-tmux.sh attach'"
        ;;
    
    attach)
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            tmux attach-session -t "$SESSION_NAME"
        else
            echo "Session '$SESSION_NAME' doesn't exist. Use 'start' to create it."
            exit 1
        fi
        ;;
    
    stop)
        if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
            tmux kill-session -t "$SESSION_NAME"
            echo "Session '$SESSION_NAME' stopped."
        else
            echo "Session '$SESSION_NAME' doesn't exist."
        fi
        ;;
    
    *)
        echo "Usage: $0 [start|attach|stop]"
        echo "  start  - Create new Claude Code session"
        echo "  attach - Attach to existing session"
        echo "  stop   - Kill the session"
        exit 1
        ;;
esac