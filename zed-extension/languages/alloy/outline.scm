; Top-level blocks as outline items
(block
  name: (identifier) @context
  label: (string)? @name
) @item

; Attributes as outline items within blocks
(block 
  (attribute 
    name: (identifier) @name
  ) @item
)

; Nested blocks as outline items
(block
  (block
    name: (identifier) @context
    label: (string)? @name
  ) @item
)

; Function calls as outline items
(attribute
  value: (expression
    (function
      name: (identifier) @name
    )
  )
) @item

; Special handling for component references
(attribute
  name: (identifier) @context
  value: (expression
    (identifier) @name
  )
) @item