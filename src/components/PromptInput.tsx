import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShellType } from '@/types/terminal';
import { getCommandSuggestions } from '@/services/mockAI';
import { ChevronRight, Zap, Lightbulb } from 'lucide-react';

interface PromptInputProps {
  onExecute: (prompt: string) => void;
  isGenerating: boolean;
  shell: ShellType;
}

const quickPrompts = [
  "List all files in current directory",
  "Show disk space usage",
  "Display running processes",
  "Get system information",
  "Show network configuration",
  "Find large files over 100MB",
  "Check memory usage",
  "List installed programs"
];

const mobileQuickPrompts = [
  "Show device info",
  "List all installed apps",
  "Check battery status",
  "Display storage usage",
  "Show WiFi networks",
  "Get device temperature",
  "List running processes",
  "Check network usage"
];

export function PromptInput({ onExecute, isGenerating, shell }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const currentQuickPrompts = shell === 'termux' ? mobileQuickPrompts : quickPrompts;

  useEffect(() => {
    if (prompt.length > 2) {
      const newSuggestions = getCommandSuggestions(prompt, shell);
      setSuggestions(newSuggestions);
      setShowQuickPrompts(false);
    } else {
      setSuggestions([]);
      setShowQuickPrompts(true);
    }
  }, [prompt, shell]);

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onExecute(prompt);
    setPrompt('');
    setSuggestions([]);
    setShowQuickPrompts(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
    setShowQuickPrompts(false);
    textareaRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setSuggestions([]);
    textareaRef.current?.focus();
  };

  return (
    <Card className="p-4 md:p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-accent" />
          <span className="hidden sm:inline">Describe what you want to do in natural language</span>
          <span className="sm:hidden">Enter your command</span>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={shell === 'termux' 
              ? "e.g., 'Check battery level' or 'Show installed apps'" 
              : "e.g., 'Show me all Python files larger than 10MB' or 'List running services'"
            }
            className="min-h-[80px] md:min-h-[100px] resize-none bg-background/50 border-border/50 focus:border-primary/50 font-mono terminal-glow text-sm"
            disabled={isGenerating}
          />
          
          {prompt && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                <span className="hidden sm:inline">Ctrl+Enter to execute</span>
                <span className="sm:hidden">Ctrl+↵</span>
              </Badge>
            </div>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs bg-secondary/30 hover:bg-secondary/60 border-border/50"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Prompts */}
        {showQuickPrompts && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {shell === 'termux' ? 'Mobile commands:' : 'Quick prompts:'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {currentQuickPrompts.map((quickPrompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickPrompt(quickPrompt)}
                  className="justify-start text-left h-auto p-2 text-xs bg-secondary/20 hover:bg-secondary/40 border border-border/30"
                >
                  <ChevronRight className="h-3 w-3 mr-1 text-accent flex-shrink-0" />
                  <span className="truncate">{quickPrompt}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Ctrl+Enter</kbd> to generate and execute
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground terminal-glow w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Loading...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Generate & Execute</span>
                <span className="sm:hidden">Execute</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}