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

; Special highlighting for Alloy-specific patterns
(block label: (string) @string.special)
(array) @collection
(object) @collection

; Environment variables and references
(identifier) @variable.other.member
  (#match? @variable.other.member "^[A-Z_][A-Z0-9_]*$")