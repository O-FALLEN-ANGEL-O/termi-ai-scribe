import { ShellType, MockAIResponse } from '@/types/terminal';

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
  }
};

// Mock output responses
const mockOutputs = {
  'Get-ChildItem': `Directory: C:\\Users\\Demo

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        12/15/2024   2:30 PM                Documents
d-----        12/15/2024   1:15 PM                Downloads  
d-----        12/10/2024  10:45 AM                Pictures
-a----        12/14/2024   9:20 AM           1024 config.json
-a----        12/13/2024   4:30 PM           2048 readme.txt`,

  'dir': `Volume in drive C has no label.
Volume Serial Number is 1234-5678

Directory of C:\\Users\\Demo

12/15/2024  02:30 PM    <DIR>          Documents
12/15/2024  01:15 PM    <DIR>          Downloads
12/10/2024  10:45 AM    <DIR>          Pictures
12/14/2024  09:20 AM             1,024 config.json
12/13/2024  04:30 PM             2,048 readme.txt
               2 File(s)          3,072 bytes
               3 Dir(s)  15,234,567,890 bytes free`,

  'ls -la': `total 24
drwxr-xr-x  5 user user 4096 Dec 15 14:30 .
drwxr-xr-x  3 user user 4096 Dec 10 10:45 ..
drwxr-xr-x  2 user user 4096 Dec 15 14:30 Documents
drwxr-xr-x  2 user user 4096 Dec 15 13:15 Downloads
drwxr-xr-x  2 user user 4096 Dec 10 10:45 Pictures
-rw-r--r--  1 user user 1024 Dec 14 09:20 config.json
-rw-r--r--  1 user user 2048 Dec 13 16:30 readme.txt`,

  'Get-Process': `Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName
-------  ------    -----      -----     ------     --  -- -----------
   1234      45    12345      23456       1.23   4567   1 chrome
    567      23     6789      12345       0.45   8901   1 notepad
    890      34     4567       8901       2.10   2345   1 explorer`,

  'default': 'Command executed successfully.\nOutput would appear here based on the specific command and system state.'
};

// Risk assessment based on command patterns
function assessRisk(command: string): 'low' | 'medium' | 'high' {
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

// Main AI simulation function
export async function generateCommand(prompt: string, shell: ShellType): Promise<MockAIResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  const templates = commandTemplates[shell];
  const normalizedPrompt = prompt.toLowerCase();

  // Find matching command template
  let command = '';
  let matchedKey = '';

  for (const [key, template] of Object.entries(templates)) {
    if (normalizedPrompt.includes(key)) {
      command = template;
      matchedKey = key;
      break;
    }
  }

  // If no direct match, try to generate based on keywords
  if (!command) {
    if (normalizedPrompt.includes('file') && normalizedPrompt.includes('find')) {
      command = shell === 'bash' ? 'find . -name "*.txt"' : 
                shell === 'powershell' ? 'Get-ChildItem -Recurse -Filter "*.txt"' : 
                'dir /s *.txt';
    } else if (normalizedPrompt.includes('install') || normalizedPrompt.includes('software')) {
      command = shell === 'bash' ? 'sudo apt install package-name' :
                shell === 'powershell' ? 'Install-Package PackageName' :
                'winget install PackageName';
    } else if (normalizedPrompt.includes('update')) {
      command = shell === 'bash' ? 'sudo apt update && sudo apt upgrade' :
                shell === 'powershell' ? 'Update-Module' :
                'winget upgrade --all';
    } else {
      // Generic fallback
      command = shell === 'bash' ? `# ${prompt}` :
                shell === 'powershell' ? `# ${prompt}` :
                `REM ${prompt}`;
    }
  }

  // Get appropriate mock output
  const output = mockOutputs[command as keyof typeof mockOutputs] || 
                 mockOutputs[matchedKey as keyof typeof mockOutputs] || 
                 mockOutputs.default;

  const risk = assessRisk(command);
  const explanation = generateExplanation(prompt, command, shell);

  return {
    command,
    explanation,
    risk,
    success: Math.random() > 0.1, // 90% success rate
    output: output + `\n\n[Executed at ${new Date().toLocaleTimeString()}]`
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