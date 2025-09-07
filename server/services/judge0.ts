interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface Judge0Result {
  token: string;
  status: {
    id: number;
    description: string;
  };
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  time?: string;
  memory?: number;
}

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

// Language IDs for Judge0
const LANGUAGE_IDS = {
  java: 62,
  python: 71,
  cpp: 54,
  c: 50,
  javascript: 63,
};

export class Judge0Service {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${JUDGE0_API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Judge0 API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async submitCode(submission: Judge0Submission): Promise<{ token: string }> {
    const result = await this.makeRequest('/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      body: JSON.stringify(submission),
    });

    return { token: result.token };
  }

  async getSubmissionResult(token: string): Promise<Judge0Result> {
    const result = await this.makeRequest(`/submissions/${token}?base64_encoded=false`);
    return result;
  }

  async executeCode(
    code: string,
    language: string,
    input?: string,
    timeLimit = 2,
    memoryLimit = 128000
  ): Promise<Judge0Result> {
    const languageId = LANGUAGE_IDS[language as keyof typeof LANGUAGE_IDS];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const submission: Judge0Submission = {
      source_code: code,
      language_id: languageId,
      stdin: input,
      cpu_time_limit: timeLimit,
      memory_limit: memoryLimit,
    };

    const { token } = await this.submitCode(submission);

    // Poll for result
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      const result = await this.getSubmissionResult(token);
      
      // Status 1 = In Queue, Status 2 = Processing
      if (result.status.id !== 1 && result.status.id !== 2) {
        return { ...result, token };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Submission timed out');
  }

  async executeWithTestCases(
    code: string,
    language: string,
    testCases: Array<{ input: string; expectedOutput: string }>,
    timeLimit = 2,
    memoryLimit = 128000
  ): Promise<{
    results: Array<{
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      status: string;
      time?: string;
      memory?: number;
    }>;
    totalPassed: number;
    totalTests: number;
  }> {
    const results = [];
    let totalPassed = 0;

    for (const testCase of testCases) {
      try {
        const result = await this.executeCode(code, language, testCase.input, timeLimit, memoryLimit);
        
        const actualOutput = (result.stdout || '').trim();
        const expectedOutput = testCase.expectedOutput.trim();
        const passed = actualOutput === expectedOutput && result.status.id === 3; // Status 3 = Accepted
        
        if (passed) totalPassed++;

        results.push({
          input: testCase.input,
          expectedOutput,
          actualOutput,
          passed,
          status: result.status.description,
          time: result.time,
          memory: result.memory,
        });
      } catch (error) {
        results.push({
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: '',
          passed: false,
          status: 'Error: ' + (error as Error).message,
        });
      }
    }

    return {
      results,
      totalPassed,
      totalTests: testCases.length,
    };
  }
}

export const judge0Service = new Judge0Service();
