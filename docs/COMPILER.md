# Compiler outline (proposal)

Axe aims for **compile-time expansion**, not runtime wrappers.

## Pipeline

~~~text
Axe source
  |
  +-- discover shared indexes and imports
  |
  +-- lex/parse tag chains, attributes, and host expressions
  |
  +-- expand ComponentIndex / PropIndex / ValueIndex
  |
  +-- desugar single-child element paths into ordinary element AST
  |
  +-- resolve ^ path references to existing AST nodes (experimental)
  |
  +-- validate canonical tree, attrs, sibling order, and host semantics
  |
  +-- emit ordinary JSX/TSX, GGX or compatible target AST + source maps
  v
Existing framework compiler and runtime (unchanged)
~~~

## Three independent namespaces

An alias expansion should not create new component behavior. At compile time:

~~~text
source segment:        B
ComponentIndex:        B -> Box

source property:       w
PropIndex:             w -> width

source bare value:     +
ValueIndex:            + -> "100%"

combined output:       <Box width="100%" />
~~~

Quoted literals and braced expressions bypass value lookup. The parser distinguishes indexed values from host-language expressions rather than trying to infer them afterward.

## Chains: simple static AST transformation

~~~tsx
<B(w=+ h=+)/V/T(c="blue")>Hello!</B/V/T>
~~~

can be lowered as:

~~~tsx
<Box width="100%" height="100%">
  <VBox>
    <Text color="blue">Hello!</Text>
  </VBox>
</Box>
~~~

A compiler should only expand *actual syntax nodes*, not string literals, comments, or attributes containing slashes.

## Reuse requires more than text substitution

~~~tsx
<B/V/T>Hello!</B/V/T>
<^B/^V/T>Hola!</B/V/T>
~~~

should build **one** B node with **one** V node and two ordered Text children. Expanding each line into an independent tree and concatenating them would be incorrect.

A sensible implementation sketch:

1. Maintain a construction scope and authored-order list of nodes.
2. New chain segments allocate canonical element descriptions.
3. Reused segments resolve to an existing element in a *well-defined* scope.
4. Append newly constructed descendants to that element in original source order.
5. Emit a single canonical tree after all references are resolved.
6. Reject references across scopes that can't be proven to refer to a uniquely constructed element.

The final resolution rule remains open. Do not implement “closest matching tag anywhere” or a global mutable node pointer; either would make large screens unpredictable.

## Diagnostics and source maps

For each Axe authoring token, keep its original span and resolved meaning. Diagnostics should say things such as:

~~~text
profile.axe:18:6
Ambiguous ^B: two eligible Box ancestors in this scope.
Use an explicit parent or restructure the path.

profile.axe:21:8
Unknown ValueIndex token: ?
This is not a quoted literal or a braced expression.
~~~

Some diagnostics above are examples of desired behavior, not actual output from a compiler.

## Static conformance targets

An implementation should prove:
- full names and aliases generate identical element trees;
- arbitrary nesting and mixed long/short tags;
- chained props attached to the correct path segment;
- value aliases only in intended positions;
- quoted literals unaffected;
- missing, duplicate, and ambiguous aliases fail closed;
- path reuse preserves identity, original props, and sibling order;
- hostile nesting/conditional/loop reuse fails with useful diagnostics;
- source maps identify authored lines and columns;
- renderer output and event callbacks match ordinary JSX/GGX;
- layout declarations keep their native area/row semantics.

## Status

There is **no compiler in this repository yet**. This outline exists to keep future implementation faithful to the language-design conversation, not to lock in an untested architecture.
