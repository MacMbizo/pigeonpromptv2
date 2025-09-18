export type Template = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_prompt_template: string;
  variables: string[];
  tags: string[];
};

export const systemTemplates: Template[] = [
  {
    id: 'jest-unit-test-generator',
    name: 'Jest Unit Test Generator',
    description: 'Generate focused Jest unit tests for a given function or module.',
    system_prompt: 'You are a meticulous test-writing assistant. You produce Jest tests that are deterministic, isolated, and cover edge cases.',
    user_prompt_template: 'Write Jest unit tests for the following code. Focus on inputs, outputs, and edge cases. Code:\n\n{{selectedCode}}\n\nFilename: {{filePath}}',
    variables: ['selectedCode', 'filePath'],
    tags: ['testing', 'javascript', 'jest']
  },
  {
    id: 'explain-this-code',
    name: 'Explain This Code',
    description: 'Explain what this code does, step by step, and highlight risks or edge cases.',
    system_prompt: 'You are a senior engineer explaining code to a teammate. Be accurate, concise, and highlight assumptions.',
    user_prompt_template: 'Explain this code clearly to a developer. Include a summary, key steps, and potential pitfalls.\n\n{{selectedCode}}',
    variables: ['selectedCode'],
    tags: ['explain', 'readability']
  },
  {
    id: 'refactor-for-readability',
    name: 'Refactor for Readability',
    description: 'Refactor code to improve readability without changing behavior.',
    system_prompt: 'You are a refactoring assistant. You preserve behavior while improving names, structure, and clarity.',
    user_prompt_template: 'Refactor the following code for readability. Keep functionality identical and include a short rationale.\n\n{{selectedCode}}',
    variables: ['selectedCode'],
    tags: ['refactor']
  },
  {
    id: 'write-api-docs',
    name: 'Write API Documentation',
    description: 'Generate concise API documentation from source code or TypeScript types.',
    system_prompt: 'You are a technical writer. Provide clear, concise API docs including parameters, returns, and examples.',
    user_prompt_template: 'Generate API docs for the following code. Use markdown and include examples.\n\n{{selectedCode}}',
    variables: ['selectedCode'],
    tags: ['documentation']
  },
  {
    id: 'generate-dockerfile',
    name: 'Generate a Dockerfile',
    description: 'Create an efficient Dockerfile for the project with best practices.',
    system_prompt: 'You are a DevOps expert. Produce a minimal, secure Dockerfile using best practices.',
    user_prompt_template: 'Given this project context, propose a Dockerfile with explanations for key choices.\n\nLanguage: {{language}}\nRepo context: {{repoContext}}',
    variables: ['language', 'repoContext'],
    tags: ['devops', 'docker']
  }
];

export function listSystemTemplates(): Template[] {
  return systemTemplates;
}