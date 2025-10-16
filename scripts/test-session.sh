#!/bin/bash
# Quick script to start a test Claude session in demo-repo

cd "$(dirname "$0")/../demo-repo" || exit 1

echo "Starting Claude test session in demo-repo..."
echo "Working directory: $(pwd)"
echo ""
echo "When ready, exit with Ctrl+D"
echo "To suspend (test Ctrl+Z), use Ctrl+Z then 'fg' to resume"
echo ""

claude
