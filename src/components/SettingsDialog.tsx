import { TerminalConfig } from '@/types/terminal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TerminalConfig;
  onConfigChange: (config: Partial<TerminalConfig>) => void;
  onClearHistory: () => void;
  onExportHistory: () => void;
  commandCount: number;
}

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onClearHistory,
  onExportHistory,
  commandCount
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-execute">Auto Execute Commands</Label>
              <Switch
                id="auto-execute"
                checked={config.autoExecute}
                onCheckedChange={(checked) => onConfigChange({ autoExecute: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-warnings">Show Risk Warnings</Label>
              <Switch
                id="show-warnings"
                checked={config.showWarnings}
                onCheckedChange={(checked) => onConfigChange({ showWarnings: checked })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label>Max History Items</Label>
              <Select
                value={config.maxHistory.toString()}
                onValueChange={(value) => onConfigChange({ maxHistory: parseInt(value) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 commands</SelectItem>
                  <SelectItem value="100">100 commands</SelectItem>
                  <SelectItem value="200">200 commands</SelectItem>
                  <SelectItem value="500">500 commands</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              History: {commandCount} commands stored
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onExportHistory} className="flex-1">
                Export History
              </Button>
              <Button variant="destructive" onClick={onClearHistory} className="flex-1">
                Clear History
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}