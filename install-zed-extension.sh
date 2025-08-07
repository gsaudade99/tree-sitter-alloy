#!/bin/bash

# Alloy Tree-sitter Extension Installer for Zed
# This script installs the Alloy language extension for the Zed editor

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Zed is installed
check_zed() {
    if ! command -v zed &> /dev/null; then
        print_warning "Zed editor not found in PATH. Make sure Zed is installed."
        print_info "You can download Zed from: https://zed.dev"
        read -p "Continue with installation anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_info "Zed editor found: $(zed --version 2>/dev/null || echo "version unknown")"
    fi
}

# Determine Zed extensions directory
get_zed_extensions_dir() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ZED_EXTENSIONS_DIR="$HOME/.config/zed/extensions"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        ZED_EXTENSIONS_DIR="$HOME/.config/zed/extensions"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows (Git Bash/MSYS2)
        ZED_EXTENSIONS_DIR="$APPDATA/Zed/extensions"
    else
        # Default to Linux-style path
        ZED_EXTENSIONS_DIR="$HOME/.config/zed/extensions"
    fi
    
    print_info "Using Zed extensions directory: $ZED_EXTENSIONS_DIR"
}

# Create extensions directory if it doesn't exist
create_extensions_dir() {
    if [[ ! -d "$ZED_EXTENSIONS_DIR" ]]; then
        print_info "Creating Zed extensions directory..."
        mkdir -p "$ZED_EXTENSIONS_DIR"
    fi
}

# Install the extension
install_extension() {
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
    local source_dir="$script_dir/zed-extension"
    local target_dir="$ZED_EXTENSIONS_DIR/alloy"
    
    # Check if source extension directory exists
    if [[ ! -d "$source_dir" ]]; then
        print_error "Extension source directory not found: $source_dir"
        print_error "Make sure you're running this script from the tree-sitter-alloy root directory."
        exit 1
    fi
    
    # Remove existing extension if present
    if [[ -d "$target_dir" ]]; then
        print_warning "Existing Alloy extension found. Removing..."
        rm -rf "$target_dir"
    fi
    
    # Copy extension files
    print_info "Installing Alloy extension..."
    cp -r "$source_dir" "$target_dir"
    
    # Make sure permissions are correct
    chmod -R 755 "$target_dir"
    
    print_info "Extension installed successfully!"
}

# Create a test file to verify installation
create_test_file() {
    local test_file="$HOME/test-alloy-syntax.alloy"
    
    cat > "$test_file" << 'EOF'
// Test Alloy configuration file
// This file tests syntax highlighting in Zed

log_level = "info"
server_name = "alloy-test"

loki.source.file "app_logs" {
    targets = [
        {__path__ = "/var/log/app/*.log"},
        {__path__ = "/var/log/app/*.json"}
    ]
    
    forward_to = [loki.process.json_parser.receiver]
    
    // Polling configuration
    poll_frequency = "1s"
    ignore_older_than = "24h"
}

loki.process "json_parser" {
    forward_to = [loki.write.grafana_cloud.receiver]
    
    stage.json {
        expressions = {
            level = "level",
            message = "msg",
            timestamp = "timestamp"
        }
    }
    
    stage.labels {
        values = {
            level = "level",
        }
    }
}

loki.write "grafana_cloud" {
    endpoint {
        url = env("LOKI_ENDPOINT")
        basic_auth {
            username = env("LOKI_USERNAME")
            password_file = env("LOKI_PASSWORD_FILE")
        }
    }
    
    external_labels = {
        cluster = "production",
        service = "web-app"
    }
}

prometheus.scrape "app_metrics" {
    targets = [
        {"__address__" = "localhost:8080"},
        {"__address__" = "localhost:8081"}
    ]
    
    forward_to = [prometheus.remote_write.grafana_cloud.receiver]
    scrape_interval = "30s"
    metrics_path = "/metrics"
}

prometheus.remote_write "grafana_cloud" {
    endpoint {
        url = env("PROMETHEUS_ENDPOINT")
        basic_auth {
            username = env("PROMETHEUS_USERNAME") 
            password_file = env("PROMETHEUS_PASSWORD_FILE")
        }
    }
    
    queue_config {
        batch_send_deadline = "5s"
        max_samples_per_send = 1000
    }
}
EOF

    print_info "Test file created: $test_file"
    print_info "Open this file in Zed to verify syntax highlighting is working."
}

# Main installation process
main() {
    echo "=== Alloy Tree-sitter Extension for Zed Installer ==="
    echo
    
    check_zed
    get_zed_extensions_dir
    create_extensions_dir
    install_extension
    
    echo
    print_info "Installation completed successfully!"
    echo
    print_info "Next steps:"
    echo "1. Restart Zed editor"
    echo "2. Open any .alloy file to activate the extension"
    echo "3. Verify syntax highlighting is working"
    echo
    
    read -p "Create a test .alloy file? (Y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        print_info "Skipping test file creation."
    else
        create_test_file
        echo
        print_info "You can now open the test file in Zed: zed $HOME/test-alloy-syntax.alloy"
    fi
    
    echo
    print_info "For advanced features like hover documentation and completions,"
    print_info "see docs/QUICK_START.md for language server setup instructions."
}

# Run main function
main "$@"