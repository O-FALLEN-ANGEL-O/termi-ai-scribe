import { ShellType, GeneratedCommand, RiskLevel } from '@/types/terminal';

// Offline demo mode: a keyword lookup used only when the AI service isn't reachable
// (local `vite dev`, or no API key configured). It never invents command output.

// Mock command database for different shell types
const commandTemplates = {
  powershell: {
    'list files': 'Get-ChildItem',
    'current directory': 'Get-Location',
    'disk space': 'Get-PSDrive',
    'running processes': 'Get-Process',
    'network info': 'Get-NetAdapter',
    'system info': 'Get-ComputerInfo',
    'services': 'Get-Service',
    'delete temp files': 'Remove-Item $env:TEMP\\* -Recurse -Force',
    'create folder': 'New-Item -ItemType Directory -Name',
    'copy files': 'Copy-Item',
    'move files': 'Move-Item',
    'find text in files': 'Select-String',
    'cpu usage': 'Get-Counter "\\Processor(_Total)\\% Processor Time"',
    'memory usage': 'Get-Counter "\\Memory\\Available MBytes"',
    'installed programs': 'Get-WmiObject -Class Win32_Product',
  },
  cmd: {
    'list files': 'dir',
    'current directory': 'cd',
    'disk space': 'wmic logicaldisk get size,freespace,caption',
    'running processes': 'tasklist',
    'network info': 'ipconfig /all',
    'system info': 'systeminfo',
    'services': 'sc query',
    'delete temp files': 'del /s /q %temp%\\*',
    'create folder': 'mkdir',
    'copy files': 'copy',
    'move files': 'move',
    'find text in files': 'findstr /s /i',
    'cpu usage': 'wmic cpu get loadpercentage',
    'memory usage': 'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory',
    'installed programs': 'wmic product get name,version',
  },
  bash: {
    'list files': 'ls -la',
    'current directory': 'pwd',
    'disk space': 'df -h',
    'running processes': 'ps aux',
    'network info': 'ifconfig',
    'system info': 'uname -a',
    'services': 'systemctl list-units --type=service',
    'delete temp files': 'rm -rf /tmp/*',
    'create folder': 'mkdir -p',
    'copy files': 'cp -r',
    'move files': 'mv',
    'find text in files': 'grep -r',
    'cpu usage': 'top -bn1 | grep "Cpu(s)"',
    'memory usage': 'free -h',
    'installed programs': 'dpkg -l',
  },
  termux: {
    'device info': 'termux-info',
    'installed apps': 'pm list packages',
    'battery status': 'termux-battery-status',
    'storage usage': 'df -h',
    'wifi networks': 'termux-wifi-scaninfo',
    'device temperature': 'cat /sys/class/thermal/thermal_zone*/temp',
    'running processes': 'ps aux',
    'network usage': 'cat /proc/net/dev',
    'check battery': 'termux-battery-status',
    'show installed': 'pm list packages',
    'device temp': 'cat /sys/class/thermal/thermal_zone*/temp',
    'system info': 'termux-info'
  }
};

// Risk assessment based on command patterns
function assessRisk(command: string): RiskLevel {
  const highRiskPatterns = [
    /rm\s+-rf/i, /del\s+\/s/i, /format/i, /shutdown/i, /restart/i,
    /reg\s+delete/i, /Remove-Item.*-Recurse.*-Force/i
  ];
  
  const mediumRiskPatterns = [
    /delete/i, /remove/i, /kill/i, /stop/i, /disable/i
  ];

  if (highRiskPatterns.some(pattern => pattern.test(command))) {
    return 'high';
  }
  if (mediumRiskPatterns.some(pattern => pattern.test(command))) {
    return 'medium';
  }
  return 'low';
}

// Generate explanation for the command
function generateExplanation(prompt: string, command: string, shell: ShellType): string {
  const explanations = {
    list: `Lists all files and directories in the current location with detailed information.`,
    directory: `Shows the current working directory path.`,
    space: `Displays disk space usage and available storage.`,
    process: `Shows all currently running processes with memory and CPU usage.`,
    network: `Displays network adapter configuration and IP addresses.`,
    system: `Provides detailed system information including OS version and hardware specs.`,
    default: `Executes the requested operation using ${shell} command syntax.`
  };

  const key = Object.keys(explanations).find(k => 
    prompt.toLowerCase().includes(k) || command.toLowerCase().includes(k)
  ) || 'default';

  return explanations[key as keyof typeof explanations];
}

/** Keyword-matched command for demo mode. */
export function generateDemoCommand(prompt: string, shell: ShellType): GeneratedCommand {
  const templates = commandTemplates[shell];
  const normalizedPrompt = prompt.toLowerCase();
  const match = Object.entries(templates).find(([key]) => normalizedPrompt.includes(key));

  if (!match) {
    return {
      command: '',
      explanation:
        "Demo mode only knows a handful of common requests (try one of the quick prompts). The AI version understands anything you describe.",
      risk: 'low',
      caveat: '',
      source: 'demo',
    };
  }

  const command = match[1];
  return {
    command,
    explanation: generateExplanation(prompt, command, shell),
    risk: assessRisk(command),
    caveat: '',
    source: 'demo',
  };
}

// Get command suggestions based on current input
export function getCommandSuggestions(input: string, shell: ShellType): string[] {
  const templates = commandTemplates[shell];
  const suggestions: string[] = [];

  Object.keys(templates).forEach(key => {
    if (key.toLowerCase().includes(input.toLowerCase()) && input.length > 2) {
      suggestions.push(key);
    }
  });

  return suggestions.slice(0, 5);
}