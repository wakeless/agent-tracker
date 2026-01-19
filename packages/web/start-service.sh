#!/bin/bash
cd /home/sprite/agent-tracker/packages/web
export BASE_PATH=/agent-tracker
exec npx vite --host 0.0.0.0
