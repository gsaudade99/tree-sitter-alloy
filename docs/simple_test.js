/**
 * Simple test for Alloy documentation system (no external dependencies)
 * This demonstrates how the documentation provider works
 */

const { AlloyDocumentationProvider } = require('./lsp_integration.js');

class SimpleAlloyTest {
  constructor() {
    this.docProvider = new AlloyDocumentationProvider();
  }

  // Test hover documentation for different node types
  testHoverDocumentation() {
    console.log('=== Testing Hover Documentation ===\n');

    // Test component documentation
    console.log('1. Component hover for "loki.source.file":');
    const componentHover = this.docProvider.getHoverDocumentation(
      'block', 
      'loki.source.file',
      {}
    );
    console.log(componentHover ? componentHover.value : 'No documentation found');
    console.log('\n' + '─'.repeat(60) + '\n');

    // Test attribute documentation
    console.log('2. Common attribute hover for "forward_to":');
    const attrHover = this.docProvider.getHoverDocumentation(
      'attribute',
      'forward_to',
      {}
    );
    console.log(attrHover ? attrHover.value : 'No documentation found');
    console.log('\n' + '─'.repeat(60) + '\n');

    // Test component-specific attribute
    console.log('3. Component-specific attribute "tail_from_end" in loki.source.file:');
    const specificAttrHover = this.docProvider.getHoverDocumentation(
      'attribute',
      'tail_from_end',
      { parentBlock: 'loki.source.file' }
    );
    console.log(specificAttrHover ? specificAttrHover.value : 'No documentation found');
    console.log('\n' + '─'.repeat(60) + '\n');

    // Test function documentation
    console.log('4. Function hover for "env":');
    const funcHover = this.docProvider.getHoverDocumentation(
      'function',
      'env',
      {}
    );
    console.log(funcHover ? funcHover.value : 'No documentation found');
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  // Test completion suggestions
  testCompletionItems() {
    console.log('=== Testing Completion Items ===\n');

    // Test component completions
    console.log('1. Component completions (showing first 5):');
    const componentCompletions = this.docProvider.getComponentCompletions();
    componentCompletions.slice(0, 5).forEach(item => {
      console.log(`  • ${item.label} (${item.detail})`);
      console.log(`    ${item.documentation.value.split('\n')[0]}`);
      console.log('');
    });
    console.log(`    ... and ${componentCompletions.length - 5} more components\n`);

    // Test attribute completions
    console.log('2. Attribute completions for "loki.source.file":');
    const attrCompletions = this.docProvider.getAttributeCompletions('loki.source.file');
    attrCompletions.slice(0, 5).forEach(item => {
      console.log(`  • ${item.label} (${item.detail})`);
      console.log(`    ${item.documentation.value.split('\n')[0]}`);
      console.log('');
    });
    console.log('\n' + '─'.repeat(60) + '\n');

    // Test function completions
    console.log('3. Function completions:');
    const funcCompletions = this.docProvider.getFunctionCompletions();
    funcCompletions.forEach(item => {
      console.log(`  • ${item.detail}`);
      console.log(`    ${item.documentation.value.split('\n')[0]}`);
      console.log('');
    });
    console.log('');
  }

  // Test specific Alloy configuration scenarios
  testAlloyScenarios() {
    console.log('=== Testing Common Alloy Components ===\n');

    const scenarios = [
      {
        name: 'Log Collection Pipeline',
        components: ['local.file_match', 'loki.source.file', 'loki.process', 'loki.write']
      },
      {
        name: 'Prometheus Monitoring',
        components: ['prometheus.scrape', 'prometheus.remote_write', 'discovery.kubernetes']
      },
      {
        name: 'OpenTelemetry Pipeline',
        components: ['otelcol.receiver.otlp', 'otelcol.exporter.otlp']
      }
    ];
    
    scenarios.forEach(scenario => {
      console.log(`${scenario.name}:`);
      scenario.components.forEach(component => {
        const doc = this.docProvider.getComponentDocumentation(component);
        if (doc) {
          const description = doc.value.split('\n')[2]; // Get description line
          console.log(`  • ${component}: ${description}`);
        } else {
          console.log(`  • ${component}: (no documentation available)`);
        }
      });
      console.log('');
    });
  }

  // Test context-aware features
  testContextAwareFeatures() {
    console.log('=== Testing Context-Aware Features ===\n');

    // Test forward_to context
    console.log('1. Forward_to reference context:');
    const forwardToDoc = this.docProvider.getIdentifierDocumentation(
      'loki.write.local.receiver',
      { parentAttribute: 'forward_to' }
    );
    console.log(forwardToDoc ? forwardToDoc.value : 'No context-specific docs');
    console.log('');

    // Test targets context
    console.log('2. Targets reference context:');
    const targetsDoc = this.docProvider.getIdentifierDocumentation(
      'local.file_match.logs.targets',
      { parentAttribute: 'targets' }
    );
    console.log(targetsDoc ? targetsDoc.value : 'No context-specific docs');
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  // Show example markdown formatting
  testMarkdownFormatting() {
    console.log('=== Example Markdown Documentation ===\n');
    
    console.log('Full component documentation for "loki.process":');
    const fullDoc = this.docProvider.getComponentDocumentation('loki.process');
    if (fullDoc) {
      console.log(fullDoc.value);
    }
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  // Show statistics about the documentation
  showStatistics() {
    console.log('=== Documentation Statistics ===\n');
    
    const stats = {
      components: Object.keys(this.docProvider.componentsDoc.components || {}).length,
      functions: Object.keys(this.docProvider.componentsDoc.functions || {}).length,
      commonAttributes: Object.keys(this.docProvider.componentsDoc.attributes || {}).length
    };
    
    console.log(`📊 Documentation Coverage:`);
    console.log(`  • Components documented: ${stats.components}`);
    console.log(`  • Functions documented: ${stats.functions}`);
    console.log(`  • Common attributes: ${stats.commonAttributes}`);
    console.log('');
    
    if (stats.components > 0) {
      console.log('🔧 Component categories:');
      const categories = {};
      Object.values(this.docProvider.componentsDoc.components).forEach(comp => {
        const cat = comp.category || 'Other';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      
      Object.entries(categories).forEach(([category, count]) => {
        console.log(`  • ${category}: ${count} component${count > 1 ? 's' : ''}`);
      });
    }
    console.log('');
  }

  // Run all tests
  runAllTests() {
    console.log('🧪 Alloy Documentation System - Simple Test Suite\n');
    console.log('=' .repeat(60) + '\n');
    
    try {
      this.showStatistics();
      this.testHoverDocumentation();
      this.testCompletionItems();
      this.testAlloyScenarios();
      this.testContextAwareFeatures();
      this.testMarkdownFormatting();
      
      console.log('✅ All tests completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('  1. Integrate with your editor using the LSP helper');
      console.log('  2. Add more components to docs/components.json as needed');
      console.log('  3. Customize queries in queries/ directory for your use case');
      console.log('  4. See docs/INTEGRATION.md for detailed setup instructions');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error.stack);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new SimpleAlloyTest();
  tester.runAllTests();
}

module.exports = { SimpleAlloyTest };