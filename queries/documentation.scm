; Documentation queries for Alloy Tree-sitter grammar
; This file identifies elements that should have documentation on hover/completion

; Block components (main Alloy components like loki.source.file, prometheus.scrape, etc.)
(block
  name: (identifier) @documentation.component
  label: (string)? @documentation.component.label)

; Attributes within blocks
(attribute
  name: (identifier) @documentation.attribute
  value: (expression))

; String attributes (for specific attribute names)
(attribute
  name: (string) @documentation.attribute.string
  value: (expression))

; Function calls
(function
  name: (identifier) @documentation.function
  arguments: (_))

; Nested blocks (sub-components within main blocks)
(block
  (block
    name: (identifier) @documentation.subcomponent))

; Identifiers that reference other components
(expression
  (identifier) @documentation.reference)

; Special case for common Alloy patterns
; Forward_to references
(attribute
  name: (identifier) @_forward_to_attr
  value: (expression
    (array
      (expression
        (identifier) @documentation.forward_to_reference)))
  (#eq? @_forward_to_attr "forward_to"))

; Targets references  
(attribute
  name: (identifier) @_targets_attr
  value: (expression
    (identifier) @documentation.targets_reference)
  (#eq? @_targets_attr "targets"))

; Component exports (component.label.export pattern)
(identifier) @documentation.export
  (#match? @documentation.export "^[a-zA-Z_][a-zA-Z0-9_]*\\.[a-zA-Z_][a-zA-Z0-9_]*\\.[a-zA-Z_][a-zA-Z0-9_]*$")