# Test Scenarios for Agent Tracker

## Scenario 1: Single Session Start/Stop
**Goal**: Verify basic session detection
**Steps**:
1. Start the agent-tracker TUI in one terminal
2. Open a new terminal and start Claude in demo-repo: `cd demo-repo && claude`
3. Verify the session appears in the tracker
4. Exit Claude (Ctrl+D)
5. Verify the session is removed or marked as ended

**Expected**: Session appears when started, updates when ended

## Scenario 2: Multiple Concurrent Sessions
**Goal**: Test tracking multiple active sessions
**Steps**:
1. Start the agent-tracker TUI
2. Open 3 different terminals
3. Start Claude in demo-repo in each terminal
4. Verify all 3 sessions appear in the tracker
5. Exit one session
6. Verify only 2 sessions remain active

**Expected**: All sessions tracked independently

## Scenario 3: Active vs Inactive Sessions
**Goal**: Test activity tracking and sorting
**Steps**:
1. Start the agent-tracker TUI
2. Start 2 Claude sessions
3. Interact with session 1 (send a prompt)
4. Wait without interacting with session 2
5. Verify session 1 is at the top (active)
6. Verify session 2 is greyed out (inactive)

**Expected**: Active sessions appear at top, inactive sessions greyed at bottom

## Scenario 4: Session Metadata Display
**Goal**: Verify session information is captured and displayed
**Steps**:
1. Start the agent-tracker TUI
2. Start a Claude session in demo-repo
3. Select the session in the tracker
4. Verify the right panel shows:
   - Working directory (demo-repo path)
   - Session ID
   - Terminal identification info
   - Start time

**Expected**: All metadata is captured and displayed correctly

## Scenario 5: Backgrounded Session (Ctrl+Z)
**Goal**: Test handling of suspended sessions
**Steps**:
1. Start the agent-tracker TUI
2. Start a Claude session
3. Suspend it with Ctrl+Z
4. Verify it still appears in the tracker (marked as inactive)
5. Resume with `fg`
6. Verify it becomes active again

**Expected**: Session remains tracked when suspended

## Scenario 6: Session in Different Directories
**Goal**: Test tracking sessions in different working directories
**Steps**:
1. Start the agent-tracker TUI
2. Start Claude in demo-repo
3. Start Claude in parent directory
4. Verify both sessions appear with correct paths

**Expected**: Multiple sessions in different directories tracked correctly
