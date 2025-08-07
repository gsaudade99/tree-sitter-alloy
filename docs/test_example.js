/**
 * Test example demonstrating the Alloy documentation system
 * This file shows how to use the documentation provider programmatically
 */

const { AlloyDocumentationProvider } = require('./lsp_integration.js');
const Parser = require('tree-sitter');

// Mock tree-sitter-alloy for testing (in real usage, import the actual module)
const mockAlloyLanguage = {
  name: 'alloy'
};

class AlloyDocumentationTest {
  constructor() {
    this.docProvider = new AlloyDocumentationProvider();
    this.parser = new Parser();
    // this.parser.setLanguage(mockAlloyLanguage);
  }

  // Test hover documentation for different node types
  testHoverDocumentation() {
    console.log('=== Testing Hover Documentation ===\n');

    // Test component documentation
    console.log('1. Component hover:');
    const componentHover = this.docProvider.getHoverDocumentation(
      'block', 
      'loki.source.file',
      {}
    );
    console.log(componentHover ? componentHover.value : 'No documentation found');
    console.log('\n');

    // Test attribute documentation
    console.log('2. Attribute hover (common):');
    const attrHover = this.docProvider.getHoverDocumentation(
      'attribute',
      'forward_to',
      {}
    );
    console.log(attrHover ? attrHover.value : 'No documentation found');
    console.log('\n');

    // Test component-specific attribute
    console.log('3. Component-specific attribute hover:');
    const specificAttrHover = this.docProvider.getHoverDocumentation(
      'attribute',
      'tail_from_end',
      { parentBlock: 'loki.source.file' }
    );
    console.log(specificAttrHover ? specificAttrHover.value : 'No documentation found');
    console.log('\n');

    // Test function documentation
    console.log('4. Function hover:');
    const funcHover = this.docProvider.getHoverDocumentation(
      'function',
      'env',
      {}
    );
    console.log(funcHover ? funcHover.value : 'No documentation found');
    console.log('\n');

    // Test component reference
    console.log('5. Component reference hover:');
    const refHover = this.docProvider.getHoverDocumentation(
      'identifier',
      'local.file_match.logs.targets',
      {}
    );
    console.log(refHover ? refHover.value : 'No documentation found');
    console.log('\n');
  }

  // Test completion suggestions
  testCompletionItems() {
    console.log('=== Testing Completion Items ===\n');

    // Test component completions
    console.log('1. Component completions:');
    const componentCompletions = this.docProvider.getCompletionItems('loki', {});
    componentCompletions.slice(0, 3).forEach(item => {
      console.log(`- ${item.label}: ${item.detail}`);
      console.log(`  ${item.documentation.value.split('\n')[0]}`);
    });
    console.log(`... and ${componentCompletions.length - 3} more\n`);

    // Test attribute completions
    console.log('2. Attribute completions for loki.source.file:');
    const attrCompletions = this.docProvider.getCompletionItems(
      'targets = ',
      { 
        insideBlock: true, 
        currentBlock: 'loki.source.file' 
      }
    );
    attrCompletions.slice(0, 3).forEach(item => {
      console.log(`- ${item.label}: ${item.detail}`);
      console.log(`  ${item.documentation.value.split('\n')[0]}`);
    });
    console.log('\n');

    // Test function completions
    console.log('3. Function completions:');
    const funcCompletions = this.docProvider.getFunctionCompletions();
    funcCompletions.slice(0, 3).forEach(item => {
      console.log(`- ${item.label}: ${item.detail}`);
    });
    console.log('\n');
  }

  // Test specific Alloy configuration scenarios
  testAlloyScenarios() {
    console.log('=== Testing Alloy Configuration Scenarios ===\n');

    // Scenario 1: Setting up a basic log pipeline
    console.log('1. Basic log pipeline components:');
    const logComponents = [
      'local.file_match',
      'loki.source.file', 
      'loki.process',
      'loki.write'
    ];
    
    logComponents.forEach(component => {
      const doc = this.docProvider.getComponentDocumentation(component);
      if (doc) {
        console.log(`${component}: ${doc.value.split('\n')[2]}`); // Get description line
      }
    });
    console.log('\n');

    // Scenario 2: Prometheus monitoring setup
    console.log('2. Prometheus monitoring components:');
    const promComponents = [
      'prometheus.scrape',
      'prometheus.remote_write',
      'discovery.kubernetes'
    ];
    
    promComponents.forEach(component => {
      const doc = this.docProvider.getComponentDocumentation(component);
      if (doc) {
        console.log(`${component}: ${doc.value.split('\n')[2]}`);
      }
    });
    console.log('\n');

    // Scenario 3: OpenTelemetry pipeline
    console.log('3. OpenTelemetry components:');
    const otelComponents = [
      'otelcol.receiver.otlp',
      'otelcol.exporter.otlp'
    ];
    
    otelComponents.forEach(component => {
      const doc = this.docProvider.getComponentDocumentation(component);
      if (doc) {
        console.log(`${component}: ${doc.value.split('\n')[2]}`);
      }
    });
    console.log('\n');
  }

  // Test context-aware completions
  testContextAwareCompletions() {
    console.log('=== Testing Context-Aware Features ===\n');

    // Test forward_to context
    console.log('1. Forward_to reference context:');
    const forwardToDoc = this.docProvider.getIdentifierDocumentation(
      'loki.write.local.receiver',
      { parentAttribute: 'forward_to' }
    );
    console.log(forwardToDoc ? forwardToDoc.value : 'No context-specific docs');
    console.log('\n');

    // Test targets context
    console.log('2. Targets reference context:');
    const targetsDoc = this.docProvider.getIdentifierDocumentation(
      'local.file_match.logs.targets',
      { parentAttribute: 'targets' }
    );
    console.log(targetsDoc ? targetsDoc.value : 'No context-specific docs');
    console.log('\n');
  }

  // Test documentation formatting
  testDocumentationFormatting() {
    console.log('=== Testing Documentation Formatting ===\n');

    // Test component with full details
    console.log('1. Full component documentation:');
    const fullDoc = this.docProvider.getComponentDocumentation('loki.process');
    if (fullDoc) {
      console.log(fullDoc.value);
    }
    console.log('\n');

    // Test function with parameters
    console.log('2. Function with parameters:');
    const funcDoc = this.docProvider.getFunctionDocumentation('format');
    if (funcDoc) {
      console.log(funcDoc.value);
    }
    console.log('\n');
  }

  // Run all tests
  runAllTests() {
    console.log('🧪 Alloy Documentation System Test Suite\n');
    console.log('=' .repeat(50));
    
    try {
      this.testHoverDocumentation();
      this.testCompletionItems();
      this.testAlloyScenarios();
      this.testContextAwareCompletions();
      this.testDocumentationFormatting();
      
      console.log('✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new AlloyDocumentationTest();
  tester.runAllTests();
}

module.exports = { AlloyDocumentationTest };