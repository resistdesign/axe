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

source value suffix:   +   (or explicit =+)
ValueIndex:            + -> "100%"

combined input:        <B w+ />
combined output:       <Box width="100%" />
~~~

Quoted literals and braced expressions bypass indexed-value lookup. Bare symbolic **and** alphabetic ValueIndex names can be concatenated with a property token, so resolution must not rely on punctuation-vs-letter heuristics. `=` is a reserved, optional boundary marker; it may **never** be an alias character.

## Scoped, use-site ambiguity resolution

Do not reject an index just because its names *might* conflict with another index or a native prop in some future context. Build candidate readings **where the attribute appears**, using that source's lexical indexes and the element's actual type/prop metadata:

~~~tsx
// Scope: PropIndex w:width, w+:max_width; ValueIndex +:"100%"
<B w+ />    // whole property 'w+' OR 'w' + indexed value '+':
             // error ONLY if both candidates are legal here
<B w=+ />   // choose the 'w' / '+' boundary explicitly
<B w+=+ />  // choose the 'w+' / '+' boundary explicitly

// Scope: PropIndex x:extend; element has native 'x' and 'extend'
<Positioned x={10} />        // ERROR: native x vs alias x -> extend
<Positioned extend={true} /> // OK; full property name here
~~~

`=` disambiguates **where to split**, not which conflicting property meaning to select when an exact token itself collides. Resolve or report that second conflict at the use site too; never silently prioritize native names or aliases. A different element without an `x` property may use the alias `x` without error.

Algorithm sketch:

1. Resolve all imported/project/local index environments visible at the authored attribute.
2. Enumerate every syntactically possible whole-attribute or property/value split. When `=` is present, only the explicitly separated pair is allowed. Quoted literals and `{expressions}` use existing host interpretation.
3. Apply canonical GGX/host property resolution and type/allowed-value semantics to the candidates, including the component's actual native property and signal tables.
4. If zero candidates remain, report a clear error; if exactly one remains, emit that; if multiple remain, report every conflicting meaning with a concrete escape (`w=+`, `w+=+`, or full property).
5. Reject duplicate canonical props across distinct authored attributes and preserve original token spans and source maps. No implicit runtime precedence, no globally reserved `+`/`# Compiler outline (proposal)

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

source value suffix:   +   (or explicit =+)
ValueIndex:            + -> "100%"

combined input:        <B w+ />
combined output:       <Box width="100%" />
~~~

/`.`/alphabetic alias classes. `=` alone is reserved as the optional separator.

**Open implementation details:** precise token grammar, index format/import precedence and bare-presence interpretation. These must not be used to impose global alias bans.

## Chains: simple static AST transformation

~~~tsx
<B(w+ h+)/V/T(c="blue")>Hello!</B/V/T>
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
- implicit value tokens (symbolic and alphabetic), explicit `=`, and no `=` alias names;
- use-site disambiguation against the element's actual native props and types without global index bans;
- quoted literals unaffected;
- missing, duplicate, and ambiguous aliases fail closed at the authored use site, including native-name collisions;
- path reuse preserves identity, original props, and sibling order;
- hostile nesting/conditional/loop reuse fails with useful diagnostics;
- source maps identify authored lines and columns;
- renderer output and event callbacks match ordinary JSX/GGX;
- layout declarations keep their native area/row semantics.

## Status

There is **no compiler in this repository yet**. This outline exists to keep future implementation faithful to the language-design conversation, not to lock in an untested architecture.
