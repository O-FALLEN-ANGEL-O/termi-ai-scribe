import { useState } from 'react';
import { Command } from '@/types/terminal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Trash2, ChevronDown, ChevronUp, Clock, Terminal, AlertTriangle, CheckCircle } from 'lucide-react';

interface CommandOutputProps {
  command: Command;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
}

export function CommandOutput({ command, onCopy, onDelete }: CommandOutputProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getRiskColor = (success: boolean) => {
    return success ? 'text-primary' : 'text-destructive';
  };

  const getRiskBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Success
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Error
      </Badge>
    );
  };

  const getShellIcon = (shell: string) => {
    const icons = {
      powershell: '🔷',
      cmd: '⬛',
      bash: '🐧'
    };
    return icons[shell as keyof typeof icons] || '💻';
  };

  return (
    <Card className="bg-card/30 backdrop-blur-sm border-border/50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getShellIcon(command.shell)}</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{command.timestamp.toLocaleString()}</span>
            </div>
            {getRiskBadge(command.success)}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopy(command.command)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(command.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-3">
          <div className="text-sm text-muted-foreground mb-1">Prompt:</div>
          <div className="text-sm bg-secondary/30 rounded p-2 border border-border/30">
            {command.prompt}
          </div>
        </div>

        {isExpanded && (
          <>
            <Separator className="my-3" />
            
            {/* Generated Command */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Generated Command:</span>
              </div>
              <div className="bg-background/80 rounded-lg p-3 border border-border/50 font-mono text-sm">
                <div className="flex items-start justify-between">
                  <code className={`flex-1 ${getRiskColor(command.success)}`}>
                    {command.command}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(command.command)}
                    className="ml-2 opacity-60 hover:opacity-100"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Command Output */}
            <div>
              <div className="text-sm font-medium mb-2">Output:</div>
              <div className="bg-background/80 rounded-lg p-3 border border-border/50 max-h-96 overflow-auto">
                <pre className="command-output text-sm text-foreground/90 whitespace-pre-wrap">
                  {command.output}
                </pre>
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy(command.output)}
                    className="opacity-60 hover:opacity-100"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Output
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}