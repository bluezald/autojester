import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const chatGptEndpoint = 'https://api.openai.com/v1/chat/completions';

// Function to send code snippet to ChatGPT and get generated unit tests
async function generateUnitTests(code: string): Promise<string[]> {
  try {
    // Make a POST request to the ChatGPT API
    const response = await axios.post(chatGptEndpoint, {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: 'generate unit tests' }, { role: 'user', content: code }],
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-YourOpenAIAPIKeyHere',
      },
    });

    // Extract the generated unit tests from the response
    const generatedTests = response.data.choices.map((choice: any) => choice.message.content);

    return generatedTests;
  } catch (error) {
    console.error('Error generating unit tests:', error);
    return [];
  }
}

function createTestSpecFileFromString(content: string, filename: string): void {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    console.error('No workspace folder found.');
    return;
  }

  const fullPath = path.join(workspaceFolder.uri.fsPath, `tests/${filename}`);
  fs.writeFile(fullPath, content, (error) => {
    if (error) {
      console.error('Error creating file:', error);
    } else {
      console.log('File created successfully:', fullPath);
    }
  });
}

// Example usage in a VSCode extension command
const generateTestsCommand = vscode.commands.registerCommand('autojester.generateTests', async () => {
  // Get the active text editor
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('No active text editor found.');
    return;
  }

  // Get the selected code snippet
  const codeSnippet = editor.document.getText(editor.selection);
  if (!codeSnippet) {
    vscode.window.showErrorMessage('No code snippet selected.');
    return;
  }

  // Generate unit tests using ChatGPT
  const generatedTests = await generateUnitTests(codeSnippet);

  // Output the generated unit tests in a new file or console
  if (generatedTests.length > 0) {
    // Create a new Untitled document in VSCode to store the generated tests
    const testDocument = await vscode.workspace.openTextDocument({ content: generatedTests.join('\n') });
    await vscode.window.showTextDocument(testDocument);
    await createTestSpecFileFromString(generatedTests.join('\n'), 'generated.spec.js');
  } else {
    vscode.window.showInformationMessage('No unit tests generated.');
  }
});

// Activate the extension
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(generateTestsCommand);
}

export function deactivate() {}



