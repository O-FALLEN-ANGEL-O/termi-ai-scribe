import { useState, useCallback, useEffect } from 'react';
import { Command, TerminalConfig, ShellType } from '@/types/terminal';
import { generateCommand } from '@/services/mockAI';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_CONFIG: TerminalConfig = {
  shell: 'powershell',
  autoExecute: false,
  showWarnings: true,
  maxHistory: 100,
};

export function useTerminal() {
  const [config, setConfig] = useState<TerminalConfig>(() => {
    const saved = localStorage.getItem('termiai-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [commands, setCommands] = useState<Command[]>(() => {
    const saved = localStorage.getItem('termiai-history');
    return saved ? JSON.parse(saved).map((cmd: any) => ({
      ...cmd,
      timestamp: new Date(cmd.timestamp)
    })) : [];
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const { toast } = useToast();

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('termiai-config', JSON.stringify(config));
  }, [config]);

  // Save command history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('termiai-history', JSON.stringify(commands.slice(-config.maxHistory)));
  }, [commands, config.maxHistory]);

  const executePrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setCurrentPrompt(prompt);

    try {
      const response = await generateCommand(prompt, config.shell);
      
      const newCommand: Command = {
        id: Date.now().toString(),
        prompt,
        command: response.command,
        output: response.output,
        shell: config.shell,
        timestamp: new Date(),
        success: response.success,
      };

      setCommands(prev => [newCommand, ...prev].slice(0, config.maxHistory));

      // Show risk warning if enabled
      if (config.showWarnings && response.risk === 'high') {
        toast({
          title: "High Risk Command",
          description: "This command may have dangerous effects. Review carefully before execution.",
          variant: "destructive",
        });
      } else if (config.showWarnings && response.risk === 'medium') {
        toast({
          title: "Medium Risk Command",
          description: "This command may modify system state. Please review.",
        });
      }

      if (response.success) {
        toast({
          title: "Command Generated",
          description: `Successfully generated ${config.shell} command`,
        });
      }

    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate command. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentPrompt('');
    }
  }, [config, toast]);

  const updateConfig = useCallback((updates: Partial<TerminalConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const clearHistory = useCallback(() => {
    setCommands([]);
    localStorage.removeItem('termiai-history');
    toast({
      title: "History Cleared",
      description: "Command history has been cleared",
    });
  }, [toast]);

  const deleteCommand = useCallback((id: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== id));
  }, []);

  const copyCommand = useCallback(async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      toast({
        title: "Copied to Clipboard",
        description: "Command copied successfully",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy command to clipboard",
        variant: "destructive",
      });
    }
  }, [toast]);

  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(commands, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `termiai-history-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "History Exported",
      description: "Command history exported successfully",
    });
  }, [commands, toast]);

  const importHistory = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCommands = JSON.parse(e.target?.result as string);
        setCommands(importedCommands.map((cmd: any) => ({
          ...cmd,
          timestamp: new Date(cmd.timestamp)
        })));
        toast({
          title: "History Imported",
          description: "Command history imported successfully",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import command history",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  return {
    config,
    commands,
    isGenerating,
    currentPrompt,
    executePrompt,
    updateConfig,
    clearHistory,
    deleteCommand,
    copyCommand,
    exportHistory,
    importHistory,
  };
}