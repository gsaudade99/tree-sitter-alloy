; Completion queries for Alloy Tree-sitter grammar
; This file identifies contexts where completions should be provided

; Component name completions at the start of blocks
(block
  name: (identifier) @completion.component)

; Attribute name completions inside blocks
(block
  (attribute
    name: (identifier) @completion.attribute))

; Function name completions in function calls
(function
  name: (identifier) @completion.function)

; Identifier completions for references
(identifier) @completion.identifier

; String completions for block labels
(block
  label: (string) @completion.block_label)

; Array elements that could be completions
(array
  (expression
    (identifier) @completion.array_element))

; Object attribute names
(object
  (attribute
    name: (identifier) @completion.object_attribute))

(object
  (attribute
    name: (string) @completion.object_attribute_string))

; Forward_to specific completions - looking for array contexts
(attribute
  name: (identifier) @_attr_name
  value: (expression
    (array
      (expression
        (identifier) @completion.forward_to)))
  (#eq? @_attr_name "forward_to"))

; Targets specific completions
(attribute
  name: (identifier) @_attr_name
  value: (expression) @completion.targets
  (#eq? @_attr_name "targets"))

; String value completions for specific attributes
(attribute
  name: (identifier) @_attr_name
  value: (expression
    (string) @completion.string_value)
  (#match? @_attr_name "^(role|encoding|method|scheme|log_level)$"))

; Duration value context
(attribute
  name: (identifier) @_attr_name
  value: (expression) @completion.duration
  (#match? @_attr_name ".*(timeout|interval|period|duration).*"))

; Boolean value context
(attribute
  name: (identifier) @_attr_name
  value: (expression
    (boolean) @completion.boolean)
  (#match? @_attr_name ".*(enable|disable|tail_from_end|follow_symlinks).*"))

; URL/endpoint completions
(attribute
  name: (identifier) @_attr_name
  value: (expression
    (string) @completion.url)
  (#match? @_attr_name ".*(url|endpoint|address).*"))

; File path completions
(attribute
  name: (identifier) @_attr_name
  value: (expression
    (string) @completion.file_path)
  (#match? @_attr_name ".*path.*"))

; Environment variable function calls
(function
  name: (identifier) @_func_name
  arguments: (expression
    (string) @completion.env_var)
  (#eq? @_func_name "env"))

; Common component patterns
(block
  name: (identifier) @completion.loki_component
  (#match? @completion.loki_component "^loki\\..*"))

(block
  name: (identifier) @completion.prometheus_component  
  (#match? @completion.prometheus_component "^prometheus\\..*"))

(block
  name: (identifier) @completion.local_component
  (#match? @completion.local_component "^local\\..*"))

; Nested block contexts
(block
  (block
    name: (identifier) @completion.nested_block))