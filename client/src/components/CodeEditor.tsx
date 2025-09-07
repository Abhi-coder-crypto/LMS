import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Save, Lightbulb, Book, CheckCircle, XCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
}

interface CodeEditorProps {
  task: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    starterCode: string;
    xpReward: number;
  };
  onSubmit: (code: string, language: string) => Promise<any>;
  isSubmitting?: boolean;
}

export default function CodeEditor({ task, onSubmit, isSubmitting = false }: CodeEditorProps) {
  const [code, setCode] = useState(task.starterCode || '');
  const [language, setLanguage] = useState('java');
  const [results, setResults] = useState<TestResult[]>([]);
  const [totalPassed, setTotalPassed] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(task.starterCode || '');
  }, [task.starterCode]);

  const handleSubmit = async () => {
    try {
      const result = await onSubmit(code, language);
      setResults(result.results || []);
      setTotalPassed(result.totalPassed || 0);
      setTotalTests(result.totalTests || 0);
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '    ' + code.substring(end);
        setCode(newCode);
        
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        }, 0);
      }
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const progressPercentage = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

  return (
    <div className="space-y-6" data-testid="code-editor">
      {/* Problem Statement */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-2" data-testid="task-title">{task.title}</CardTitle>
              <p className="text-muted-foreground mb-4" data-testid="task-description">
                {task.description}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={cn("capitalize", getDifficultyColor(task.difficulty))} data-testid={`difficulty-${task.difficulty}`}>
              {task.difficulty}
            </Badge>
            <Badge variant="secondary" data-testid="xp-reward">
              +{task.xpReward} XP
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Code Editor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Code Editor</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" data-testid="button-save">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                size="sm"
                data-testid="button-run"
              >
                <Play className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Running...' : 'Run Code'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor" data-testid="tab-editor">Editor</TabsTrigger>
              <TabsTrigger value="results" data-testid="tab-results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-medium">Solution.java</h5>
                <Select value={language} onValueChange={setLanguage} data-testid="select-language">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="java">Java</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="cpp">C++</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-96 p-4 bg-gray-900 text-gray-100 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Write your code here..."
                  data-testid="textarea-code"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              {results.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Test Results</h5>
                    <span className="text-sm text-muted-foreground" data-testid="text-progress">
                      {totalPassed}/{totalTests} Test Cases Passed
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Progress</span>
                      <span>{totalPassed}/{totalTests}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercentage}%` }}
                        data-testid="progress-bar"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                        data-testid={`test-case-${index}`}
                      >
                        {result.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" data-testid={`test-passed-${index}`} />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" data-testid={`test-failed-${index}`} />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                          </div>
                          {!result.passed && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Expected: {result.expectedOutput}, Got: {result.actualOutput}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Run your code to see test results</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        
        {/* Action Bar */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button variant="ghost" size="sm" data-testid="button-hint">
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
              <Button variant="ghost" size="sm" data-testid="button-solution">
                <Book className="w-4 h-4 mr-2" />
                Solution
              </Button>
            </div>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              data-testid="button-submit"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Solution'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
