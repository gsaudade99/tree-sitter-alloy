/**
 * LSP Integration Helper for Alloy Tree-sitter Grammar
 * Provides documentation lookup for hover and completion features
 */

const fs = require('fs');
const path = require('path');

class AlloyDocumentationProvider {
  constructor() {
    this.componentsDoc = null;
    this.loadDocumentation();
  }

  loadDocumentation() {
    try {
      const docPath = path.join(__dirname, 'components.json');
      const docContent = fs.readFileSync(docPath, 'utf8');
      this.componentsDoc = JSON.parse(docContent);
    } catch (error) {
      console.error('Failed to load documentation:', error);
      this.componentsDoc = { components: {}, functions: {}, attributes: {} };
    }
  }

  /**
   * Get hover documentation for a given node
   * @param {string} nodeType - Type of node from tree-sitter
   * @param {string} nodeText - Text content of the node
   * @param {Object} context - Additional context (parent nodes, etc.)
   * @returns {Object|null} Documentation object with markdown content
   */
  getHoverDocumentation(nodeType, nodeText, context = {}) {
    switch (nodeType) {
      case 'block':
        return this.getComponentDocumentation(nodeText);
      case 'attribute':
        return this.getAttributeDocumentation(nodeText, context.parentBlock);
      case 'function':
        return this.getFunctionDocumentation(nodeText);
      case 'identifier':
        // Handle component references like component.label.export
        if (this.isComponentReference(nodeText)) {
          return this.getComponentReferenceDocumentation(nodeText);
        }
        return this.getIdentifierDocumentation(nodeText, context);
      default:
        return null;
    }
  }

  /**
   * Get completion items for a given position
   * @param {string} context - Context string (what's being typed)
   * @param {Object} scope - Current scope information
   * @returns {Array} Array of completion items
   */
  getCompletionItems(context, scope = {}) {
    const completions = [];

    // Component completions
    if (this.isComponentContext(context)) {
      completions.push(...this.getComponentCompletions());
    }

    // Attribute completions
    if (this.isAttributeContext(context, scope)) {
      completions.push(...this.getAttributeCompletions(scope.currentBlock));
    }

    // Function completions
    if (this.isFunctionContext(context)) {
      completions.push(...this.getFunctionCompletions());
    }

    // Reference completions (for forward_to, targets, etc.)
    if (this.isReferenceContext(context)) {
      completions.push(...this.getReferenceCompletions(scope));
    }

    return completions;
  }

  getComponentDocumentation(componentName) {
    const component = this.componentsDoc.components[componentName];
    if (!component) return null;

    const markdown = this.formatComponentMarkdown(componentName, component);
    return {
      kind: 'markdown',
      value: markdown
    };
  }

  getAttributeDocumentation(attributeName, parentBlock) {
    // First check if it's a common attribute
    const commonAttr = this.componentsDoc.attributes[attributeName];
    if (commonAttr) {
      return {
        kind: 'markdown',
        value: this.formatAttributeMarkdown(attributeName, commonAttr, true)
      };
    }

    // Then check component-specific attributes
    if (parentBlock) {
      const component = this.componentsDoc.components[parentBlock];
      if (component && component.attributes && component.attributes[attributeName]) {
        const attr = component.attributes[attributeName];
        return {
          kind: 'markdown',
          value: this.formatAttributeMarkdown(attributeName, attr, false)
        };
      }
    }

    return null;
  }

  getFunctionDocumentation(functionName) {
    const func = this.componentsDoc.functions[functionName];
    if (!func) return null;

    const markdown = this.formatFunctionMarkdown(functionName, func);
    return {
      kind: 'markdown',
      value: markdown
    };
  }

  getComponentReferenceDocumentation(reference) {
    const parts = reference.split('.');
    if (parts.length >= 3) {
      const componentType = `${parts[0]}.${parts[1]}`;
      const component = this.componentsDoc.components[componentType];
      if (component) {
        return {
          kind: 'markdown',
          value: `**Component Reference**: \`${reference}\`\n\n${component.description}`
        };
      }
    }
    return null;
  }

  getIdentifierDocumentation(identifier, context) {
    // Handle special cases like forward_to references
    if (context.parentAttribute === 'forward_to') {
      return {
        kind: 'markdown',
        value: `**Forward Target**: \`${identifier}\`\n\nThis component will receive data from the current component.`
      };
    }

    if (context.parentAttribute === 'targets') {
      return {
        kind: 'markdown',
        value: `**Target Reference**: \`${identifier}\`\n\nReference to targets exported by another component.`
      };
    }

    return null;
  }

  getComponentCompletions() {
    return Object.entries(this.componentsDoc.components).map(([name, component]) => ({
      label: name,
      kind: 'Class', // LSP CompletionItemKind.Class
      detail: component.category,
      documentation: {
        kind: 'markdown',
        value: component.description
      },
      insertText: `${name} "label" {\n\t$0\n}`,
      insertTextFormat: 'Snippet'
    }));
  }

  getAttributeCompletions(currentBlock) {
    const completions = [];

    // Add common attributes
    Object.entries(this.componentsDoc.attributes).forEach(([name, attr]) => {
      if (attr.common) {
        completions.push({
          label: name,
          kind: 'Property',
          detail: `${attr.type} (common)`,
          documentation: {
            kind: 'markdown',
            value: attr.description
          },
          insertText: `${name} = $0`
        });
      }
    });

    // Add component-specific attributes
    if (currentBlock) {
      const component = this.componentsDoc.components[currentBlock];
      if (component && component.attributes) {
        Object.entries(component.attributes).forEach(([name, attr]) => {
          completions.push({
            label: name,
            kind: 'Property',
            detail: attr.type + (attr.required ? ' (required)' : ''),
            documentation: {
              kind: 'markdown',
              value: attr.description + (attr.default ? `\n\n**Default**: \`${attr.default}\`` : '')
            },
            insertText: `${name} = $0`
          });
        });
      }
    }

    return completions;
  }

  getFunctionCompletions() {
    return Object.entries(this.componentsDoc.functions).map(([name, func]) => ({
      label: name,
      kind: 'Function',
      detail: `${name}(${func.parameters.map(p => p.name).join(', ')}) -> ${func.returns}`,
      documentation: {
        kind: 'markdown',
        value: this.formatFunctionMarkdown(name, func)
      },
      insertText: `${name}($0)`
    }));
  }

  getReferenceCompletions(scope) {
    // This would need to be populated with actual component instances
    // from the current configuration
    return [];
  }

  // Helper methods for context detection
  isComponentContext(context) {
    // Simple heuristic: if we're at the beginning of a line or after whitespace
    return /^\s*[a-zA-Z_]*$/.test(context);
  }

  isAttributeContext(context, scope) {
    return scope.insideBlock && /^\s*[a-zA-Z_]*\s*=?\s*$/.test(context);
  }

  isFunctionContext(context) {
    return /[a-zA-Z_]*\($/.test(context);
  }

  isReferenceContext(context) {
    return /forward_to\s*=\s*\[|targets\s*=/.test(context);
  }

  isComponentReference(text) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*/.test(text);
  }

  // Formatting helpers
  formatComponentMarkdown(name, component) {
    let markdown = `## ${name}\n\n${component.description}`;
    
    if (component.category) {
      markdown += `\n\n**Category**: ${component.category}`;
    }

    if (component.attributes) {
      markdown += '\n\n### Attributes\n';
      Object.entries(component.attributes).forEach(([attrName, attr]) => {
        const required = attr.required ? ' *(required)*' : '';
        const defaultVal = attr.default ? ` (default: \`${attr.default}\`)` : '';
        markdown += `\n- **${attrName}** (\`${attr.type}\`)${required}${defaultVal}: ${attr.description}`;
      });
    }

    if (component.blocks) {
      markdown += '\n\n### Blocks\n';
      Object.entries(component.blocks).forEach(([blockName, block]) => {
        markdown += `\n- **${blockName}**: ${block.description}`;
      });
    }

    return markdown;
  }

  formatAttributeMarkdown(name, attribute, isCommon) {
    const commonText = isCommon ? ' *(common attribute)*' : '';
    let markdown = `**${name}**${commonText}\n\n${attribute.description}`;
    
    if (attribute.type) {
      markdown += `\n\n**Type**: \`${attribute.type}\``;
    }
    
    if (attribute.default) {
      markdown += `\n**Default**: \`${attribute.default}\``;
    }
    
    if (attribute.required) {
      markdown += '\n\n*This attribute is required.*';
    }

    return markdown;
  }

  formatFunctionMarkdown(name, func) {
    let markdown = `## ${name}()\n\n${func.description}`;
    
    if (func.parameters && func.parameters.length > 0) {
      markdown += '\n\n### Parameters\n';
      func.parameters.forEach(param => {
        markdown += `\n- **${param.name}** (\`${param.type}\`): ${param.description}`;
      });
    }
    
    if (func.returns) {
      markdown += `\n\n### Returns\n\`${func.returns}\``;
    }

    return markdown;
  }
}

module.exports = { AlloyDocumentationProvider };