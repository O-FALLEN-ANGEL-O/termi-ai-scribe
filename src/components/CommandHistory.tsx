import { Command } from '@/types/terminal';
import { CommandOutput } from './CommandOutput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { History, FileX } from 'lucide-react';

interface CommandHistoryProps {
  commands: Command[];
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
}

export function CommandHistory({ commands, onCopy, onDelete }: CommandHistoryProps) {
  if (commands.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/30 backdrop-blur-sm border-border/50">
        <FileX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No commands yet</h3>
        <p className="text-muted-foreground">
          Start by entering a natural language prompt above to generate your first command.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="h-4 w-4" />
        <span>Command History ({commands.length} commands)</span>
      </div>
      
      <ScrollArea className="h-[400px] md:h-[600px]">
        <div className="space-y-4 pr-2 md:pr-4">
          {commands.map((command) => (
            <CommandOutput
              key={command.id}
              command={command}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}