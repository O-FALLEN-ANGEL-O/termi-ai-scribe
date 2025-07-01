import { useState } from 'react';
import { useTerminal } from '@/hooks/useTerminal';
import { TerminalHeader } from '@/components/TerminalHeader';
import { PromptInput } from '@/components/PromptInput';
import { CommandHistory } from '@/components/CommandHistory';
import { SettingsDialog } from '@/components/SettingsDialog';
import { ShellType } from '@/types/terminal';

const Index = () => {
  const [showSettings, setShowSettings] = useState(false);
  const {
    config,
    commands,
    isGenerating,
    executePrompt,
    updateConfig,
    clearHistory,
    copyCommand,
    deleteCommand,
    exportHistory,
  } = useTerminal();

  const handleShellChange = (shell: ShellType) => {
    updateConfig({ shell });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 terminal-scanlines">
      <div className="container mx-auto max-w-6xl">
        <TerminalHeader
          shell={config.shell}
          onShellChange={handleShellChange}
          onSettingsClick={() => setShowSettings(true)}
          isGenerating={isGenerating}
          commandCount={commands.length}
        />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <PromptInput
            onExecute={executePrompt}
            isGenerating={isGenerating}
            shell={config.shell}
          />

          <CommandHistory
            commands={commands}
            onCopy={copyCommand}
            onDelete={deleteCommand}
          />
        </div>

        <SettingsDialog
          open={showSettings}
          onOpenChange={setShowSettings}
          config={config}
          onConfigChange={updateConfig}
          onClearHistory={clearHistory}
          onExportHistory={exportHistory}
          commandCount={commands.length}
        />
      </div>
    </div>
  );
};

export default Index;