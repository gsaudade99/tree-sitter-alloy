# Alloy Tree-sitter Documentation Integration Guide

This guide explains how to integrate inline documentation (hover and completion) support for the Alloy Tree-sitter grammar with various editors and language servers.

## Overview

The documentation system consists of:

- **Documentation queries** (`queries/documentation.scm`) - Identifies documentable elements
- **Completion queries** (`queries/completions.scm`) - Identifies completion contexts
- **Documentation database** (`docs/components.json`) - Contains documentation for Alloy components
- **LSP integration helper** (`docs/lsp_integration.js`) - Provides programmatic access to documentation

## Editor Integration

### VS Code Extension

To integrate with a VS Code extension, use the Tree-sitter queries with the documentation provider:

```typescript
import { AlloyDocumentationProvider } from './docs/lsp_integration.js';
import Parser from 'tree-sitter';
import Alloy from 'tree-sitter-alloy';

class AlloyLanguageServer {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Alloy);
    this.docProvider = new AlloyDocumentationProvider();
  }

  provideHover(document, position) {
    const tree = this.parser.parse(document.getText());
    const node = tree.rootNode.descendantForPosition(position);
    
    const context = this.getNodeContext(node);
    const docs = this.docProvider.getHoverDocumentation(
      node.type,
      node.text,
      context
    );
    
    if (docs) {
      return new vscode.Hover(docs.value);
    }
    
    return null;
  }

  provideCompletionItems(document, position) {
    const tree = this.parser.parse(document.getText());
    const node = tree.rootNode.descendantForPosition(position);
    
    const context = this.getCompletionContext(document, position);
    const scope = this.getCurrentScope(node);
    
    const items = this.docProvider.getCompletionItems(context, scope);
    return items.map(item => new vscode.CompletionItem(item.label, item.kind));
  }
}
```

### Neovim with nvim-treesitter

For Neovim integration, you can use the queries directly:

```lua
-- In your Neovim configuration
local ts_utils = require('nvim-treesitter.ts_utils')
local ts_queries = require('nvim-treesitter.query')

-- Load documentation queries
local doc_query = ts_queries.get_query('alloy', 'documentation')

-- Hover function
local function show_hover_docs()
  local node = ts_utils.get_node_at_cursor()
  if not node then return end
  
  local component_name = nil
  local attr_name = nil
  
  -- Extract component and attribute names using the query
  for id, match in doc_query:iter_matches(node:root(), 0) do
    local capture = doc_query.captures[id]
    if capture == "documentation.component" then
      component_name = ts_utils.get_node_text(match[1])[1]
    elseif capture == "documentation.attribute" then
      attr_name = ts_utils.get_node_text(match[1])[1]
    end
  end
  
  -- Look up documentation (you'd implement this based on components.json)
  local docs = get_documentation(component_name, attr_name)
  if docs then
    vim.lsp.util.open_floating_preview({docs}, "markdown")
  end
end

-- Bind to keymap
vim.keymap.set('n', 'K', show_hover_docs)
```

### Language Server Protocol (LSP)

Create a full LSP server using the documentation system:

```javascript
const { createConnection, TextDocuments } = require('vscode-languageserver/node');
const { TextDocument } = require('vscode-languageserver-textdocument');
const Parser = require('tree-sitter');
const Alloy = require('tree-sitter-alloy');
const { AlloyDocumentationProvider } = require('./docs/lsp_integration.js');

class AlloyLanguageServer {
  constructor() {
    this.connection = createConnection();
    this.documents = new TextDocuments(TextDocument);
    this.parser = new Parser();
    this.parser.setLanguage(Alloy);
    this.docProvider = new AlloyDocumentationProvider();
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.connection.onHover((params) => {
      return this.onHover(params);
    });
    
    this.connection.onCompletion((params) => {
      return this.onCompletion(params);
    });
    
    this.documents.onDidChangeContent((change) => {
      this.validateDocument(change.document);
    });
  }
  
  onHover(params) {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return null;
    
    const tree = this.parser.parse(document.getText());
    const position = this.lspPositionToTreeSitter(params.position);
    const node = tree.rootNode.descendantForPosition(position);
    
    const context = this.buildContext(node);
    const docs = this.docProvider.getHoverDocumentation(
      node.type,
      node.text,
      context
    );
    
    return docs ? { contents: docs } : null;
  }
  
  onCompletion(params) {
    const document = this.documents.get(params.textDocument.uri);
    if (!document) return [];
    
    const tree = this.parser.parse(document.getText());
    const position = this.lspPositionToTreeSitter(params.position);
    const node = tree.rootNode.descendantForPosition(position);
    
    const context = document.getText().substring(
      Math.max(0, document.offsetAt(params.position) - 50),
      document.offsetAt(params.position)
    );
    
    const scope = this.buildScope(node);
    return this.docProvider.getCompletionItems(context, scope);
  }
  
  buildContext(node) {
    const context = {};
    
    // Walk up the tree to find relevant context
    let current = node.parent;
    while (current) {
      if (current.type === 'block') {
        const nameNode = current.namedChild(0);
        if (nameNode) {
          context.parentBlock = nameNode.text;
        }
        break;
      } else if (current.type === 'attribute') {
        const nameNode = current.namedChild(0);
        if (nameNode) {
          context.parentAttribute = nameNode.text;
        }
      }
      current = current.parent;
    }
    
    return context;
  }
  
  buildScope(node) {
    const scope = {
      insideBlock: false,
      currentBlock: null,
      availableReferences: []
    };
    
    // Determine current scope
    let current = node.parent;
    while (current) {
      if (current.type === 'block') {
        scope.insideBlock = true;
        const nameNode = current.namedChild(0);
        if (nameNode) {
          scope.currentBlock = nameNode.text;
        }
        break;
      }
      current = current.parent;
    }
    
    // Find available component references in the document
    const tree = node.tree;
    const query = `
      (block
        name: (identifier) @component
        label: (string) @label)
    `;
    
    // This would need proper query parsing implementation
    // scope.availableReferences = parseComponentReferences(tree, query);
    
    return scope;
  }
}

// Start the server
const server = new AlloyLanguageServer();
server.connection.listen();
```

## Extending Documentation

### Adding New Components

To add documentation for new Alloy components, update `docs/components.json`:

```json
{
  "components": {
    "your.new.component": {
      "description": "Description of what this component does",
      "category": "Your Category",
      "attributes": {
        "required_attr": {
          "type": "string",
          "description": "Description of this attribute",
          "required": true
        },
        "optional_attr": {
          "type": "duration",
          "description": "Description with default",
          "default": "30s"
        }
      },
      "blocks": {
        "nested_block": {
          "description": "Description of nested block",
          "attributes": {
            "block_attr": {
              "type": "bool",
              "description": "Block-specific attribute"
            }
          }
        }
      }
    }
  }
}
```

### Adding New Functions

Add function documentation to the `functions` section:

```json
{
  "functions": {
    "your_function": {
      "description": "What this function does",
      "parameters": [
        {
          "name": "param1",
          "type": "string",
          "description": "First parameter"
        },
        {
          "name": "param2", 
          "type": "number",
          "description": "Second parameter"
        }
      ],
      "returns": "string"
    }
  }
}
```

### Customizing Queries

You can extend the documentation and completion queries in `queries/documentation.scm` and `queries/completions.scm` to support additional patterns or contexts specific to your use case.

## Testing the Integration

Create test files to verify documentation works:

```alloy
// test.alloy - Test hover and completion
local.file_match "test" {
  // Hover over 'path_targets' should show documentation
  path_targets = [{"__path__" = "/tmp/test.log"}]
}

loki.source.file "logs" {
  // Completion after 'targets = ' should suggest component references
  targets = local.file_match.test.targets
  
  // Hover over forward_to should show it's a common attribute
  forward_to = [loki.write.local.receiver]
}

// Function completion and hover
prometheus.scrape "metrics" {
  job_name = concat("my", "job") // Hover over 'concat' shows function docs
}
```

## Performance Considerations

- Cache parsed trees and documentation lookups
- Use incremental parsing for large files
- Implement debouncing for hover requests
- Consider lazy-loading documentation for large component sets

## Troubleshooting

### Documentation Not Showing

1. Verify the Tree-sitter grammar is correctly parsing the file
2. Check that the documentation queries match the expected node structure
3. Ensure `components.json` contains the component you're hovering over
4. Debug the context building in your LSP implementation

### Completions Not Working

1. Check that completion queries are correctly identifying completion contexts
2. Verify the scope detection is working properly
3. Ensure completion items are being formatted correctly for your editor
4. Test with simple cases first (component names, then attributes)

### Performance Issues

1. Profile parsing and documentation lookup times
2. Implement caching strategies
3. Use worker threads for heavy parsing operations
4. Consider reducing documentation query complexity