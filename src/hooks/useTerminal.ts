import { useState, useCallback, useEffect } from 'react';
import { Command, TerminalConfig } from '@/types/terminal';
import { generateCommand, GenerationError } from '@/services/ai';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_CONFIG: TerminalConfig = {
  shell: 'powershell',
  showWarnings: true,
  maxHistory: 100,
};

/** Accepts history saved by older versions (which had fake `output`/`success` fields). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCommand(raw: any): Command {
  return {
    id: String(raw.id ?? Date.now()),
    prompt: String(raw.prompt ?? ''),
    command: String(raw.command ?? ''),
    explanation: String(raw.explanation ?? ''),
    risk: raw.risk === 'high' || raw.risk === 'medium' ? raw.risk : 'low',
    caveat: String(raw.caveat ?? ''),
    shell: raw.shell ?? 'powershell',
    timestamp: new Date(raw.timestamp ?? Date.now()),
    source: raw.source === 'ai' ? 'ai' : 'demo',
  };
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function useTerminal() {
  const [config, setConfig] = useState<TerminalConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...loadJSON<Partial<TerminalConfig>>('termiai-config', {}),
  }));

  const [commands, setCommands] = useState<Command[]>(() => {
    const saved = loadJSON<unknown[]>('termiai-history', []);
    return Array.isArray(saved) ? saved.map(normalizeCommand) : [];
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
      const result = await generateCommand(prompt, config.shell);

      const newCommand: Command = {
        id: Date.now().toString(),
        prompt,
        ...result,
        shell: config.shell,
        timestamp: new Date(),
      };

      setCommands(prev => [newCommand, ...prev].slice(0, config.maxHistory));

      if (!result.command) {
        toast({ title: "No command for that", description: result.explanation });
      } else if (config.showWarnings && result.risk === 'high') {
        toast({
          title: "High-risk command",
          description: "This could delete data or change your system. Read the warning before you run it.",
          variant: "destructive",
        });
      } else if (config.showWarnings && result.risk === 'medium') {
        toast({
          title: "Review before running",
          description: "This command changes files, settings or processes.",
        });
      }
    } catch (error) {
      toast({
        title: "Couldn't generate a command",
        description: error instanceof GenerationError ? error.message : "Please try again.",
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
        if (!Array.isArray(importedCommands)) throw new Error('not a list');
        setCommands(importedCommands.map(normalizeCommand));
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