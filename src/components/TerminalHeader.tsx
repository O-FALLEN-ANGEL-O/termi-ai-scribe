import { ShellType } from '@/types/terminal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Activity, Terminal } from 'lucide-react';

interface TerminalHeaderProps {
  shell: ShellType;
  onShellChange: (shell: ShellType) => void;
  onSettingsClick: () => void;
  isGenerating: boolean;
  commandCount: number;
}

const shellIcons = {
  powershell: '🔷',
  cmd: '⬛',
  bash: '🐧',
  termux: '📱'
};

const shellNames = {
  powershell: 'PowerShell',
  cmd: 'Command Prompt',
  bash: 'Bash',
  termux: 'Termux'
};

export function TerminalHeader({ 
  shell, 
  onShellChange, 
  onSettingsClick, 
  isGenerating,
  commandCount 
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TermiAI
          </h1>
        </div>
        
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Activity className="h-3 w-3" />
          {isGenerating ? (
            <span className="text-accent">Generating...</span>
          ) : (
            <span className="hidden sm:inline">{commandCount} commands</span>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">Shell:</span>
          <Select value={shell} onValueChange={onShellChange}>
            <SelectTrigger className="w-32 md:w-40 bg-secondary/50">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{shellIcons[shell]}</span>
                  <span className="hidden sm:inline">{shellNames[shell]}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="powershell">
                <div className="flex items-center gap-2">
                  <span>🔷</span>
                  <span>PowerShell</span>
                </div>
              </SelectItem>
              <SelectItem value="cmd">
                <div className="flex items-center gap-2">
                  <span>⬛</span>
                  <span>Command Prompt</span>
                </div>
              </SelectItem>
              <SelectItem value="bash">
                <div className="flex items-center gap-2">
                  <span>🐧</span>
                  <span>Bash</span>
                </div>
              </SelectItem>
              <SelectItem value="termux">
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>Termux</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onSettingsClick}
          className="bg-secondary/50 hover:bg-secondary"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}