import OpenAI from 'openai';

const getClient = () => {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  });
};

function parseJSON(text: string): any {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return { rawResponse: text };
      }
    }
    return { rawResponse: text };
  }
}

async function makeRequest(systemPrompt: string, userPrompt: string): Promise<any> {
  const client = getClient();
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices?.[0]?.message?.content || '';
  return parseJSON(content);
}

export class AIService {
  static async scanVulnerabilities(sourceCode: string, language: string = 'Solidity') {
    const systemPrompt = `You are an expert smart contract security auditor. Analyze the provided ${language} smart contract for security vulnerabilities. Return a JSON object with this exact structure:
{
  "vulnerabilities": [
    {
      "title": "vulnerability name",
      "description": "detailed description",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFORMATIONAL",
      "category": "reentrancy|overflow|access-control|front-running|dos|logic-error|unchecked-return|other",
      "lineNumber": null,
      "codeSnippet": "relevant code",
      "recommendation": "how to fix"
    }
  ],
  "summary": "overall assessment",
  "riskScore": 0-100
}`;
    return makeRequest(systemPrompt, `Analyze this ${language} contract for vulnerabilities:\n\n${sourceCode}`);
  }

  static async optimizeGas(sourceCode: string, language: string = 'Solidity') {
    const systemPrompt = `You are an expert smart contract gas optimization specialist. Analyze the provided ${language} contract and suggest gas optimizations. Return a JSON object:
{
  "optimizations": [
    {
      "title": "optimization name",
      "description": "what to change and why",
      "currentCode": "current inefficient code",
      "optimizedCode": "optimized version",
      "estimatedSavings": "estimated gas savings",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "totalEstimatedSavings": "overall savings estimate",
  "gasScore": 0-100
}`;
    return makeRequest(systemPrompt, `Optimize gas usage for this ${language} contract:\n\n${sourceCode}`);
  }

  static async checkCompliance(sourceCode: string, standard: string = 'ERC20') {
    const systemPrompt = `You are a smart contract compliance expert. Check if the contract implements the ${standard} standard correctly. Return a JSON object:
{
  "standard": "${standard}",
  "complianceScore": 0-100,
  "results": [
    {
      "rule": "requirement name",
      "status": "PASS|FAIL|PARTIAL",
      "details": "explanation",
      "recommendation": "how to fix if needed"
    }
  ],
  "missingFunctions": ["list of missing required functions"],
  "extraFunctions": ["list of non-standard functions"]
}`;
    return makeRequest(systemPrompt, `Check ${standard} compliance for this contract:\n\n${sourceCode}`);
  }

  static async generateTests(sourceCode: string, language: string = 'Solidity') {
    const systemPrompt = `You are a smart contract testing expert. Generate comprehensive test cases for the provided ${language} contract using Hardhat/Chai. Return a JSON object:
{
  "testFramework": "Hardhat + Chai",
  "testCode": "complete test file code as a string",
  "testCases": [
    {
      "name": "test name",
      "description": "what it tests",
      "type": "unit|integration|edge-case|security"
    }
  ],
  "coverageEstimate": "estimated coverage percentage"
}`;
    return makeRequest(systemPrompt, `Generate tests for this ${language} contract:\n\n${sourceCode}`);
  }

  static async analyzeCodeQuality(sourceCode: string, language: string = 'Solidity') {
    const systemPrompt = `You are a smart contract code quality analyst. Analyze the code quality of the provided ${language} contract. Return a JSON object:
{
  "overallScore": 0-100,
  "categories": {
    "readability": 0-100,
    "maintainability": 0-100,
    "gasEfficiency": 0-100,
    "security": 0-100,
    "documentation": 0-100
  },
  "issues": [
    {
      "title": "issue name",
      "description": "detailed description",
      "severity": "HIGH|MEDIUM|LOW",
      "suggestion": "how to improve"
    }
  ],
  "summary": "overall assessment"
}`;
    return makeRequest(systemPrompt, `Analyze code quality for this ${language} contract:\n\n${sourceCode}`);
  }

  static async detectReentrancy(sourceCode: string) {
    const systemPrompt = `You are a reentrancy attack detection specialist. Analyze the provided Solidity contract specifically for reentrancy vulnerabilities. Return a JSON object:
{
  "reentrancyRisks": [
    {
      "functionName": "function name",
      "description": "how reentrancy could occur",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW",
      "lineNumber": null,
      "pattern": "cross-function|single-function|read-only",
      "recommendation": "how to fix"
    }
  ],
  "overallRisk": "SAFE|LOW|MEDIUM|HIGH|CRITICAL",
  "safePatterns": ["list of safe patterns found"],
  "unsafePatterns": ["list of unsafe patterns found"]
}`;
    return makeRequest(systemPrompt, `Detect reentrancy vulnerabilities in this contract:\n\n${sourceCode}`);
  }
}
