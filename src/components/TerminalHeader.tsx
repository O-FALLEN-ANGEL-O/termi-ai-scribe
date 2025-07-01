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
  bash: '🐧'
};

const shellNames = {
  powershell: 'PowerShell',
  cmd: 'Command Prompt',
  bash: 'Bash'
};

export function TerminalHeader({ 
  shell, 
  onShellChange, 
  onSettingsClick, 
  isGenerating,
  commandCount 
}: TerminalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TermiAI
          </h1>
        </div>
        
        <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {isGenerating ? (
            <span className="text-accent">Generating...</span>
          ) : (
            <span>{commandCount} commands</span>
          )}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Shell:</span>
          <Select value={shell} onValueChange={onShellChange}>
            <SelectTrigger className="w-40 bg-secondary/50">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{shellIcons[shell]}</span>
                  <span>{shellNames[shell]}</span>
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