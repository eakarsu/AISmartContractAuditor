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
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

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

  static async checkCompliance(sourceCode: string, standard: string = 'ERC20', templateRules?: any) {
    const rulesSection = templateRules
      ? `\nUse these specific rules from the compliance template:\n${JSON.stringify(templateRules, null, 2)}\n`
      : '';
    const systemPrompt = `You are a smart contract compliance expert. Check if the contract implements the ${standard} standard correctly.${rulesSection} Return a JSON object:
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

  static async generateAutoFix(vulnerability: any, fullSourceCode: string) {
    const systemPrompt = `You are a smart contract security expert specializing in vulnerability remediation. Generate a targeted fix for the specified vulnerability. Return a JSON object:
{
  "patchedCode": "the fixed version of the relevant code snippet or full contract if small enough",
  "explanation": "detailed explanation of what was changed and why",
  "diffSummary": "brief summary of changes made",
  "additionalNotes": "any security considerations or caveats"
}`;

    const userPrompt = `Fix this ${vulnerability.severity} severity vulnerability:

Title: ${vulnerability.title}
Category: ${vulnerability.category}
Description: ${vulnerability.description}
Recommendation: ${vulnerability.recommendation || 'Apply best practices'}

Vulnerable Code:
${vulnerability.codeSnippet || fullSourceCode.slice(0, 3000)}

Full Contract Context (first 2000 chars):
${fullSourceCode.slice(0, 2000)}

Provide a specific, minimal patch that fixes this vulnerability without breaking existing functionality.`;

    return makeRequest(systemPrompt, userPrompt);
  }

  static async recognizePatterns(sourceCode: string, language: string = 'Solidity') {
    const systemPrompt = `You are a smart-contract pattern recognition expert. Identify both common safe patterns AND known vulnerable patterns/anti-patterns. Respond ONLY in valid JSON.`;
    const userPrompt = `Language: ${language}
Source code:
\`\`\`
${sourceCode.slice(0, 12000)}
\`\`\`

Return JSON: {patterns_detected:[{name,kind:"safe|risky|unsafe",confidence:0-1,line_range,evidence,reference:"e.g. SWC-101 / known incident"}], anti_patterns:[{name,severity,description,fix_recommendation}], libraries_used:[{library,version_hint,is_pinned:bool,known_issues:[]}], inheritance_summary, summary}.`;
    return makeRequest(systemPrompt, userPrompt);
  }

  static async estimateGas(sourceCode: string, expectedFunctions?: string[]) {
    const systemPrompt = `You are an EVM gas-estimation AI. Estimate deployment + per-function gas costs and identify hotspots. Respond ONLY in valid JSON.`;
    const userPrompt = `Source code:
\`\`\`
${sourceCode.slice(0, 12000)}
\`\`\`

Expected functions to estimate: ${JSON.stringify(expectedFunctions || [])}

Return JSON: {deployment_gas_estimate, deployment_cost_usd_estimate_at_30gwei, function_estimates:[{name,gas_low,gas_typical,gas_high,notes}], storage_layout_hotspots:[], optimization_opportunities:[{description,estimated_savings_pct,risk}], assumptions:[], summary}.`;
    return makeRequest(systemPrompt, userPrompt);
  }

  static async upgradePathRecommendation(sourceCode: string, currentPattern?: string, targetGoal?: string) {
    const systemPrompt = `You are a smart-contract upgradeability advisor. Recommend the safest upgrade migration path (Transparent Proxy, UUPS, Beacon, Diamond, or "non-upgradeable redeploy"). Respond ONLY in valid JSON.`;
    const userPrompt = `Current upgrade pattern (if any): ${currentPattern || 'unknown / non-upgradeable'}
Target goal: ${targetGoal || 'safer upgradeability'}
Source code:
\`\`\`
${sourceCode.slice(0, 12000)}
\`\`\`

Return JSON: {current_pattern_detected, recommended_pattern:"TransparentProxy|UUPS|Beacon|Diamond|non-upgradeable-redeploy", rationale, migration_steps:[{step,description,risk,reversible:bool}], storage_layout_concerns:[{slot_or_var,risk,mitigation}], initializer_concerns:[], access_control_changes:[], rollback_plan, openzeppelin_libs_required:[], summary}.`;
    return makeRequest(systemPrompt, userPrompt);
  }

  static async formalVerificationSuggestions(sourceCode: string, propertiesOfInterest?: string[]) {
    const systemPrompt = `You are a formal verification advisor. Suggest properties/invariants worth formally verifying and which tools to use (Certora, Foundry invariant tests, KEVM, SMTChecker, Halmos). Respond ONLY in valid JSON.`;
    const userPrompt = `Properties the team cares about: ${JSON.stringify(propertiesOfInterest || [])}
Source code:
\`\`\`
${sourceCode.slice(0, 12000)}
\`\`\`

Return JSON: {recommended_tooling:[{tool,why,effort:"low|medium|high"}], invariants_to_verify:[{name,statement,severity_if_violated,suggested_tool,example_assertion}], temporal_properties:[{name,statement,suggested_tool}], boundary_conditions:[], symbolic_execution_targets:[], suggested_test_harness_skeleton, blockers, summary}.`;
    return makeRequest(systemPrompt, userPrompt);
  }

  static async forkAnalysis(sourceCode: string, similarContractName?: string) {
    const systemPrompt = `You are a smart-contract similarity analyst. Identify whether this contract is a fork or close derivative of well-known contracts (Uniswap, Compound, OpenZeppelin, Sushi, etc.) and surface inherited vulnerabilities/audits. Respond ONLY in valid JSON.`;
    const userPrompt = `Reference (optional): ${similarContractName || ''}
Source code:
\`\`\`
${sourceCode.slice(0, 12000)}
\`\`\`

Return JSON: {is_likely_fork:bool, parent_protocols:[{name,similarity_score:0-1,evidence:[],differences:[],inherited_vulnerabilities:[]}], modified_areas:[{area,risk_level,review_priority}], known_audits_to_consult:[{auditor,report_url_hint,findings_to_check}], compliance_check:{license_consistent:bool,attribution_present:bool,notes}, summary}.`;
    return makeRequest(systemPrompt, userPrompt);
  }
}
