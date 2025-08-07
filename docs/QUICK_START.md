# Quick Start: Adding Hover Documentation to Your Editor

This guide shows you how to quickly add hover documentation and completion for Alloy files in popular editors.

## 🚀 Zed Extension

### 1. Create Extension Structure
Create a Zed extension with these files in your extensions directory (`~/.config/zed/extensions/alloy/`):

**extension.toml**
```toml
id = "alloy"
name = "Alloy Language Support"
description = "Grafana Alloy configuration language support"
version = "0.1.0"
schema_version = 1
authors = ["Your Name <your.email@example.com>"]
repository = "https://github.com/your-username/zed-alloy"

[language_servers.alloy-lsp]
name = "alloy-lsp"
language = "alloy"

[grammars.alloy]
repository = "https://github.com/mattsre/tree-sitter-alloy"
commit = "main"

[languages.alloy]
name = "Alloy"
grammar = "alloy"
scope = "source.alloy"
injection_regex = "alloy"
file_types = ["alloy"]
comment_tokens = ["//"]
block_comment_tokens = [{ start = "/*", end = "*/" }]
language_servers = ["alloy-lsp"]
auto_indent_using_last_non_empty_line = true
```

**languages/alloy/brackets.scm**
```scheme
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @bracket
```

**languages/alloy/highlights.scm**
```scheme
; Keywords
"true" @boolean
"false" @boolean
"null" @constant.builtin

; Strings
(string) @string
(string (escape_sequence) @escape)

; Numbers
(number) @number

; Comments
(comment) @comment

; Identifiers
(identifier) @variable

; Functions
(function name: (identifier) @function)

; Block names (components)
(block name: (identifier) @type)

; Attribute names
(attribute name: (identifier) @property)
(attribute name: (string) @property)

; Operators
[
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "!"
] @operator

; Punctuation
[
  "."
  ","
  ";"
  ":"
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket
```

**languages/alloy/outline.scm**
```scheme
; Top-level blocks
(block
  name: (identifier) @context
  label: (string)? @name
) @item

; Attributes as outline items in blocks
(block 
  (attribute 
    name: (identifier) @name
  ) @item
)
```

### 2. Optional: Language Server
For advanced features like hover documentation and completions, create a simple language server:

**src/main.rs** (if using Rust)
```rust
use serde_json::{json, Value};
use std::collections::HashMap;
use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};

#[derive(Debug)]
struct AlloyLanguageServer {
    client: Client,
    docs: HashMap<String, ComponentDoc>,
}

#[derive(Debug, Clone)]
struct ComponentDoc {
    description: String,
    category: String,
}

impl AlloyLanguageServer {
    fn new(client: Client) -> Self {
        let mut docs = HashMap::new();
        
        // Load basic documentation
        docs.insert("loki.write".to_string(), ComponentDoc {
            description: "Receives log entries and forwards them to Loki".to_string(),
            category: "loki".to_string(),
        });
        
        docs.insert("loki.source.file".to_string(), ComponentDoc {
            description: "Reads log entries from files".to_string(),
            category: "loki".to_string(),
        });

        Self { client, docs }
    }
}

#[tower_lsp::async_trait]
impl LanguageServer for AlloyLanguageServer {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            capabilities: ServerCapabilities {
                hover_provider: Some(HoverProviderCapability::Simple(true)),
                completion_provider: Some(CompletionOptions {
                    resolve_provider: Some(false),
                    trigger_characters: Some(vec![".".to_string(), " ".to_string()]),
                    ..Default::default()
                }),
                ..Default::default()
            },
            ..Default::default()
        })
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "Alloy Language Server initialized!")
            .await;
    }

    async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
        // Simple hover implementation
        let contents = HoverContents::Markup(MarkupContent {
            kind: MarkupKind::Markdown,
            value: "Alloy configuration element".to_string(),
        });

        Ok(Some(Hover {
            contents,
            range: None,
        }))
    }

    async fn completion(&self, _: CompletionParams) -> Result<Option<CompletionResponse>> {
        let items = vec![
            CompletionItem {
                label: "loki.write".to_string(),
                kind: Some(CompletionItemKind::CLASS),
                detail: Some("Loki write component".to_string()),
                insert_text: Some("loki.write \"${1:label}\" {\n\t$0\n}".to_string()),
                insert_text_format: Some(InsertTextFormat::SNIPPET),
                ..Default::default()
            },
            CompletionItem {
                label: "loki.source.file".to_string(),
                kind: Some(CompletionItemKind::CLASS),
                detail: Some("Loki file source".to_string()),
                insert_text: Some("loki.source.file \"${1:label}\" {\n\t$0\n}".to_string()),
                insert_text_format: Some(InsertTextFormat::SNIPPET),
                ..Default::default()
            },
        ];

        Ok(Some(CompletionResponse::Array(items)))
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let (service, socket) = LspService::new(|client| AlloyLanguageServer::new(client));
    Server::new(stdin, stdout, socket).serve(service).await;
}
```

### 3. Installation

#### Quick Installation (Recommended)
Use the provided installation script:
```bash
./install-zed-extension.sh
```

#### Manual Installation
1. Clone this repository to `~/.config/zed/extensions/alloy/`
2. Restart Zed
3. Open an `.alloy` file to activate the extension

## 📝 Neovim with Lua

### 1. Using nvim-treesitter

**lua/alloy.lua**
```lua
local ts_utils = require('nvim-treesitter.ts_utils')
local ts_query = require('nvim-treesitter.query')

-- Load documentation data
local function load_docs()
    local docs_path = vim.fn.stdpath('config') .. '/lua/alloy_docs.json'
    local file = io.open(docs_path, 'r')
    if file then
        local content = file:read('*all')
        file:close()
        return vim.json.decode(content)
    end
    return {}
end

local docs = load_docs()

-- Hover function
local function show_hover()
    local node = ts_utils.get_node_at_cursor()
    if not node then return end
    
    local component_name = nil
    local attr_name = nil
    
    -- Walk up to find component or attribute
    local current = node
    while current do
        if current:type() == 'block' then
            local name_node = current:named_child(0)
            if name_node then
                component_name = ts_utils.get_node_text(name_node)[1]
            end
            break
        elseif current:type() == 'attribute' then
            local name_node = current:named_child(0)
            if name_node then
                attr_name = ts_utils.get_node_text(name_node)[1]
            end
        end
        current = current:parent()
    end
    
    local doc_text = nil
    
    -- Look up documentation
    if component_name and docs.components and docs.components[component_name] then
        doc_text = docs.components[component_name].description
    elseif attr_name and docs.attributes and docs.attributes[attr_name] then
        doc_text = docs.attributes[attr_name].description
    end
    
    if doc_text then
        local lines = vim.split(doc_text, '\n')
        vim.lsp.util.open_floating_preview(lines, 'markdown', {
            border = 'rounded',
            focusable = false,
        })
    end
end

-- Setup keybindings
vim.keymap.set('n', 'K', show_hover, { desc = 'Show documentation' })

-- Completion function (basic example)
local function complete_func()
    local node = ts_utils.get_node_at_cursor()
    local completions = {}
    
    if docs.components then
        for name, component in pairs(docs.components) do
            table.insert(completions, {
                label = name,
                kind = vim.lsp.protocol.CompletionItemKind.Class,
                detail = component.category,
                documentation = component.description
            })
        end
    end
    
    return completions
end

return {
    show_hover = show_hover,
    complete_func = complete_func
}
```

### 2. Copy documentation data
```bash
cp docs/components.json ~/.config/nvim/lua/alloy_docs.json
```

## 🔧 Emacs with tree-sitter

### 1. Basic setup

**alloy-mode.el**
```elisp
(require 'treesit)
(require 'json)

(defvar alloy-docs nil
  "Alloy documentation data.")

(defun alloy-load-docs ()
  "Load Alloy documentation from JSON file."
  (when (not alloy-docs)
    (let ((docs-file (expand-file-name "alloy_docs.json" user-emacs-directory)))
      (when (file-exists-p docs-file)
        (setq alloy-docs (json-read-file docs-file))))))

(defun alloy-get-component-doc (component-name)
  "Get documentation for COMPONENT-NAME."
  (alloy-load-docs)
  (when alloy-docs
    (let ((components (cdr (assoc 'components alloy-docs))))
      (cdr (assoc (intern component-name) components)))))

(defun alloy-eldoc-function ()
  "Provide eldoc documentation for Alloy."
  (when (treesit-ready-p 'alloy)
    (let* ((node (treesit-node-at (point)))
           (parent (treesit-node-parent node)))
      (cond
       ((string= (treesit-node-type parent) "block")
        (let* ((name-node (treesit-node-child parent 0))
               (component-name (treesit-node-text name-node)))
          (when component-name
            (let ((doc (alloy-get-component-doc component-name)))
              (when doc
                (cdr (assoc 'description doc)))))))))))

(define-derived-mode alloy-mode prog-mode "Alloy"
  "Major mode for Alloy configuration files."
  (when (treesit-ready-p 'alloy)
    (treesit-parser-create 'alloy)
    (setq-local eldoc-documentation-function #'alloy-eldoc-function)
    (eldoc-mode 1)))

(add-to-list 'auto-mode-alist '("\\.alloy\\'" . alloy-mode))
```

## 🌟 Sublime Text

### 1. Create a plugin

**Alloy.sublime-package/alloy_docs.py**
```python
import sublime
import sublime_plugin
import json
import os

class AlloyDocumentationCommand(sublime_plugin.TextCommand):
    def __init__(self, view):
        super().__init__(view)
        self.docs = self.load_docs()
    
    def load_docs(self):
        package_dir = os.path.dirname(__file__)
        docs_file = os.path.join(package_dir, 'components.json')
        try:
            with open(docs_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def run(self, edit):
        # Get word under cursor
        word_region = self.view.word(self.view.sel()[0])
        word = self.view.substr(word_region)
        
        # Look up documentation
        doc = self.get_documentation(word)
        if doc:
            self.view.show_popup(doc, max_width=600, max_height=400)
    
    def get_documentation(self, word):
        components = self.docs.get('components', {})
        if word in components:
            component = components[word]
            return f"<h3>{word}</h3><p>{component['description']}</p>"
        
        attributes = self.docs.get('attributes', {})
        if word in attributes:
            attr = attributes[word]
            return f"<h3>{word}</h3><p>{attr['description']}</p>"
        
        return None

class AlloyCompletionsListener(sublime_plugin.EventListener):
    def on_query_completions(self, view, prefix, locations):
        if not view.match_selector(locations[0], "source.alloy"):
            return None
        
        # Load documentation
        package_dir = os.path.dirname(__file__)
        docs_file = os.path.join(package_dir, 'components.json')
        try:
            with open(docs_file, 'r') as f:
                docs = json.load(f)
        except:
            return None
        
        completions = []
        components = docs.get('components', {})
        for name, component in components.items():
            if name.startswith(prefix):
                completions.append([
                    f"{name}\t{component.get('category', 'Component')}",
                    f"{name} \"${{1:label}}\" {{\n\t$0\n}}"
                ])
        
        return completions
```

### 2. Key binding

**Default.sublime-keymap**
```json
[
    { "keys": ["f1"], "command": "alloy_documentation", "context": [
        { "key": "selector", "operator": "equal", "operand": "source.alloy" }
    ]}
]
```

## ⚡ Quick Test

Create a test file `test.alloy`:

```alloy
local.file_match "logs" {
    path_targets = [{"__path__" = "/tmp/*.log"}]
}

loki.source.file "reader" {
    targets = local.file_match.logs.targets
    forward_to = [loki.write.local.receiver]
}

loki.write "local" {
    endpoint {
        url = env("LOKI_URL")
    }
}
```

Test features:
1. **Hover** over `loki.source.file` → Should show component documentation
2. **Hover** over `forward_to` → Should show attribute documentation  
3. **Hover** over `env` → Should show function documentation
4. **Type** `loki.` → Should show completions
5. **Type** inside a block → Should show attribute completions

## 📚 Adding More Documentation

Edit `docs/components.json` to add more components:

```json
{
  "components": {
    "your.custom.component": {
      "description": "Your component description",
      "category": "Custom",
      "attributes": {
        "custom_attr": {
          "type": "string",
          "description": "Custom attribute description",
          "required": true
        }
      }
    }
  }
}
```

## 🔗 Next Steps

1. **Extend documentation**: Add more Alloy components to `components.json`
2. **Improve queries**: Modify `queries/documentation.scm` for better context detection
3. **Add validation**: Use Tree-sitter for syntax error highlighting
4. **Create snippets**: Add common Alloy configuration templates
5. **Integrate with LSP**: Create a full language server for advanced features

See `docs/INTEGRATION.md` for detailed implementation guides!