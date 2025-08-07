[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @bracket

; String delimiters for bracket matching
(string "\"" @bracket)

; Block delimiters
(block "{" @bracket)
(block "}" @bracket)

; Array delimiters
(array "[" @bracket)
(array "]" @bracket)

; Function call delimiters
(function "(" @bracket)
(function ")" @bracket)