import React from 'react';
import { Session } from '../types/session.js';
interface TerminalBreadcrumbProps {
    session: Session;
}
/**
 * Displays terminal location as a breadcrumb hierarchy
 *
 * For iTerm2:
 * - Parses session ID (w0t4p2:uuid) to show Window > Tab > Pane hierarchy
 * - Shows window name if available, otherwise "Window N"
 * - Shows tab name in hierarchy
 * - Displays profile as secondary info
 *
 * For other terminals:
 * - Shows terminal program, shell, and TTY
 */
export declare function TerminalBreadcrumb({ session }: TerminalBreadcrumbProps): React.JSX.Element;
export {};
//# sourceMappingURL=TerminalBreadcrumb.d.ts.map