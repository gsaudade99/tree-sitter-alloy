# Alloy Language Extension for Zed

This extension provides syntax highlighting, bracket matching, and outline support for [Grafana Alloy](https://grafana.com/docs/alloy/) configuration files in the [Zed editor](https://zed.dev/).

## Features

- **Syntax Highlighting**: Full syntax highlighting for Alloy configuration files
- **Bracket Matching**: Intelligent bracket matching for `{}`, `[]`, `()`, and `""`  
- **Code Outline**: Navigate your configuration with an outline view showing blocks and attributes
- **Auto-indentation**: Smart indentation based on block structure
- **Comment Support**: Proper handling of `//` line comments and `/* */` block comments

## Installation

### Method 1: Manual Installation

1. Clone this repository or download the extension files
2. Copy the entire `zed-extension` directory to your Zed extensions folder:
   ```bash
   cp -r zed-extension ~/.config/zed/extensions/alloy
   ```
3. Restart Zed
4. Open any `.alloy` file to activate the extension

### Method 2: Development Installation

If you're working with the tree-sitter-alloy grammar directly:

1. Navigate to your Zed extensions directory:
   ```bash
   cd ~/.config/zed/extensions
   ```
2. Create a symlink to the extension:
   ```bash
   ln -s /path/to/tree-sitter-alloy/zed-extension alloy
   ```
3. Restart Zed

## Usage

Once installed, the extension will automatically activate when you open files with the `.alloy` extension.

### Syntax Highlighting

The extension provides highlighting for:
- **Components**: `loki.write`, `prometheus.scrape`, etc.
- **Attributes**: Configuration keys within blocks
- **Values**: Strings, numbers, booleans, arrays, and objects
- **Functions**: Built-in functions like `env()`, `concat()`
- **Comments**: Both `//` and `/* */` style comments

### Code Outline

Use Zed's outline panel (Cmd+Shift+O on macOS) to navigate:
- Top-level blocks and their labels
- Nested blocks and configurations
- Key attributes within each block

### Example Configuration

```alloy
// This is a comment
log_level = "info"

loki.source.file "app_logs" {
    targets = [
        {__path__ = "/var/log/app/*.log"}
    ]
    forward_to = [loki.write.grafana_cloud.receiver]
}

loki.write "grafana_cloud" {
    endpoint {
        url = env("LOKI_URL")
        basic_auth {
            username = env("LOKI_USERNAME") 
            password = env("LOKI_PASSWORD")
        }
    }
}

prometheus.scrape "app_metrics" {
    targets = [{"__address__" = "localhost:8080"}]
    forward_to = [prometheus.remote_write.grafana_cloud.receiver]
    scrape_interval = "30s"
}
```

## Tree-sitter Grammar

This extension uses the [tree-sitter-alloy](https://github.com/mattsre/tree-sitter-alloy) grammar to provide accurate parsing and highlighting of Alloy configuration files.

## Configuration

The extension works out of the box, but you can customize syntax highlighting by modifying your Zed theme or creating custom highlight queries.

## Language Server (Optional)

For advanced features like hover documentation, completions, and diagnostics, you can set up a language server. See the main [tree-sitter-alloy documentation](../docs/QUICK_START.md) for language server setup instructions.

## Contributing

This extension is part of the tree-sitter-alloy project. Contributions are welcome!

1. Fork the repository
2. Make your changes to the extension files
3. Test with various Alloy configuration files
4. Submit a pull request

## Issues and Support

If you encounter issues or have suggestions:

1. Check that your `.alloy` files are syntactically correct
2. Restart Zed after installing or updating the extension
3. Report issues on the [tree-sitter-alloy GitHub repository](https://github.com/mattsre/tree-sitter-alloy/issues)

## License

This extension is released under the same license as the tree-sitter-alloy grammar (MIT).