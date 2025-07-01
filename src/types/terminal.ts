export type ShellType = 'powershell' | 'cmd' | 'bash' | 'termux';

export interface Command {
  id: string;
  prompt: string;
  command: string;
  output: string;
  shell: ShellType;
  timestamp: Date;
  success: boolean;
}

export interface TerminalConfig {
  shell: ShellType;
  autoExecute: boolean;
  showWarnings: boolean;
  maxHistory: number;
}

export interface MockAIResponse {
  command: string;
  explanation: string;
  risk: 'low' | 'medium' | 'high';
  success: boolean;
  output: string;
}