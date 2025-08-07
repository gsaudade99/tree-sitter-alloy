; Completion queries for Alloy Tree-sitter grammar
; This file identifies contexts where completions should be provided

; Component name completions (at top level or inside blocks)
(source_file
  . (ERROR) @completion.component)

(block
  "{" 
  . (ERROR) @completion.component)

; Attribute name completions inside blocks
(block
  "{"
  (attribute)* 
  . (ERROR) @completion.attribute)

; Attribute value completions
(attribute
  name: (identifier)
  "="
  . (ERROR) @completion.value)

(attribute
  name: (string) 
  "="
  . (ERROR) @completion.value)

; Function name completions in expressions
(expression
  . (ERROR) @completion.function
  (#match? @completion.function ".*\\($"))

; Array element completions
(array
  "["
  . (ERROR) @completion.array_element)

(array
  "["
  (expression)*
  ","
  . (ERROR) @completion.array_element)

; Object attribute completions
(object
  "{"
  . (ERROR) @completion.object_attribute)

(object
  "{"
  (attribute)*
  ","
  . (ERROR) @completion.object_attribute)

; Block label completions (string after component name)
(block
  name: (identifier)
  . (ERROR) @completion.block_label
  (#not-match? @completion.block_label "^\\{"))

; Nested block completions
(block
  name: (identifier)
  label: (string)?
  "{"
  . (ERROR) @completion.nested_block)

; Reference completions (for component.label.export patterns)
(identifier
  (ERROR) @completion.reference
  (#match? @completion.reference "\\.$"))

; Forward_to specific completions
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    (array
      "["
      . (ERROR) @completion.forward_to))
  (#eq? @_attr_name "forward_to"))

(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    (array
      "["
      (expression)*
      ","
      . (ERROR) @completion.forward_to))
  (#eq? @_attr_name "forward_to"))

; Targets specific completions  
(attribute
  name: (identifier) @_attr_name
  "="
  . (ERROR) @completion.targets
  (#eq? @_attr_name "targets"))

; String value completions (for enums, file paths, etc.)
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    . (ERROR) @completion.string_value)
  (#match? @_attr_name "^(role|encoding|method|scheme)$"))

; Duration value completions
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    . (ERROR) @completion.duration)
  (#match? @_attr_name ".*(timeout|interval|period|duration).*"))

; Boolean value completions
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    . (ERROR) @completion.boolean)
  (#match? @_attr_name ".*(enable|disable|tail_from_end|follow_symlinks).*"))

; URL/endpoint completions
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    . (ERROR) @completion.url)
  (#match? @_attr_name ".*(url|endpoint|address).*"))

; File path completions
(attribute
  name: (identifier) @_attr_name
  "="
  (expression
    . (ERROR) @completion.file_path)
  (#match? @_attr_name ".*path.*"))