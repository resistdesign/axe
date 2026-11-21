# Axe syntax reference

> **Experimental design specification, not yet executable.** The examples describe intended output, not claims about a shipped parser. Standard JSX/TSX does not parse all of these forms. Marked **Open** items require explicit decisions before an implementation can be considered conformant.

## 0. Purpose

Axe exists to keep a large, mostly hand-authored view *in front of you*. It preserves the recognizable XML/JSX element tree while compressing repeated vocabulary and linear single-child ancestry. It is not a new runtime, styling language, state model, or templating engine.

The source language can be JSX-like, Estragon GGX, or another XML-like authoring syntax. The host's expressions, callbacks, flow control, and existing components remain intact.

## 1. Three independent indexes

Each index maps *authoring spellings* to established, complete meanings. These are lexical/compile-time substitutions, not runtime component wrappers.

~~~xml
<ComponentIndex>
  B: Box
  V: VBox
  T: Text
  Btn: Button
</ComponentIndex>

<PropIndex>
  w: width
  h: height
  c: color
  onP: onPress
  g: gap
</PropIndex>

<ValueIndex>
  +: "100%"
  $: "start"
  .: "end"
  md: "medium"
</ValueIndex>
~~~

Index resolution may be repository-wide, imported, and/or extended locally. The illustrative declaration format above is *proposed*; the compiler's config discovery, import and conflict rules have not been finalized.

### 1.1 ComponentIndex

~~~tsx
<B><T>Hello!</T></B>
~~~

expands to:

~~~tsx
<Box><Text>Hello!</Text></Box>
~~~

Mixed forms stay valid: `<B><Text>Hello!</Text></B>`. **Full names are never outlawed.**

### 1.2 PropIndex

~~~tsx
<Box w="100%" h="50%" />
~~~

expands to:

~~~tsx
<Box width="100%" height="50%" />
~~~

A component must still support the *expanded* property. Property aliases do not introduce new runtime props.

### 1.3 ValueIndex: implicit suffix first, optional `=` when needed

Axe's compact form combines a property token and an indexed value token **without a mandatory delimiter**:

~~~tsx
<B w+ h+>
  <V gmd>
    <T c="blue">Hello!</T>
  </V>
</B>
~~~

With `w: width`, `h: height`, `g: gap` and `+: "100%"`, `md: "medium"`, these are ordinary `width="100%"`, `height="100%"` and `gap="medium"` assignments after expansion.

`=` is an **optional, explicit boundary between the property token and the value token**. It is always syntax, **never an alias or part of an alias name**. This applies across the three index namespaces. Both symbolic and alphabetic alias names remain available; we do **not** reserve `+`, `$`, `.` or alphabetic names for any one index solely to avoid a possible collision.

| Axe source | Interpretation |
| --- | --- |
| `w+` | `width="100%"` when that is the only valid interpretation |
| `w=+` | `width="100%"`, with property/value boundary made explicit |
| `w+=+` | `max_width="100%"` when `w+` is a PropIndex alias for `max_width` |
| `gmd` | `gap="medium"` when the token split is unambiguous |
| `g=md` | `gap="medium"` with an explicit split |
| `align$` | `align="start"` if unambiguous |
| `align.` | `align="end"` if unambiguous |
| `w="+"` | `width="+"` (ordinary quoted literal; **not** an indexed value) |
| `w={size}` | `width={size}` (ordinary host expression; **not** an indexed value) |
| `w="100%"` | `width="100%"` (ordinary literal) |

No alias lookup occurs **inside quoted values or braced host-language expressions**. Bare alphabetic value tokens are not implicit variable references. A valueless/bare property retains the host's existing rules; whether a shorthand attribute is a whole property or property+indexed value must be resolved as described below. `w$` might parse as a value alias but still fail because `"start"` is invalid for a particular width property.

### 1.4 Resolving aliases and ambiguity at the use site

**Indexes may be freely defined, imported and scoped. Compile-time ambiguity is a property of a particular _use site_, not inherently an error in an index definition.** The compiler must consider the lexical indexes in scope **and** the concrete element's supported properties/type semantics.

For example, a scope may contain:

~~~xml
<PropIndex>
  w: width
  w+: max_width
  x: extend
  g: gap
</PropIndex>
<ValueIndex>
  +: "100%"
  md: "medium"
</ValueIndex>
~~~

The two ways to read `w+` are: (1) a complete PropIndex key `w+` meaning `max_width` (as a bare property), or (2) `w` followed by the ValueIndex key `+` meaning `width="100%"`. **If more than one candidate is legal on that element, reject that authored occurrence as ambiguous.** If exactly one is legal, use it. If none is legal, report a source-mapped error. Never silently choose the longest name, the shortest name, or a preferred index namespace.

~~~tsx
<B w=+ />     // explicitly: width="100%"
<B w+=+ />    // explicitly: max_width="100%"
<B gmd />     // gap="medium" if no competing valid interpretation
<B g=md />    // same expansion; the '=' states the boundary
~~~

The delimiter resolves a **token-boundary** ambiguity; it does **not** override a collision over the **same property spelling**. For example, suppose `<Positioned>` already has a native `x` positioning property *and* `extend`:

~~~tsx
<Positioned x={10} />        // ERROR: 'x' means native x or alias extend
<Positioned extend={true} /> // OK: use the full name of extend here
~~~

The `x: extend` alias remains useful on other element types where `x` is not an existing property. If a particular scope needs to author native `x` as well, it must change the visible conflicting alias (or select a scope without it); **native-name precedence is not an escape hatch**. Similarly, if two authored attributes resolve to the same canonical property, fail at those attributes; do not silently override.

**Resolution contract (design target):**

1. Form candidate exact whole-property names/PropIndex aliases and candidate property-token + ValueIndex-token splits from the syntax used, with lexical index scopes already resolved.
2. Without `=`, consider all valid splits rather than assuming symbols are suffixes or letters are not. With `=`, the explicit boundary forbids alternative splits across it, though the property token itself may still collide.
3. Resolve candidates against the element's real native/imported component metadata, existing GGX/Gogo property rules, types, and allowed bare attributes. Do not create magic runtime props.
4. **0 viable readings:** fail at the authored attribute with candidate/context details. **1 viable reading:** expand deterministically. **2+ viable readings:** fail at that occurrence and suggest an explicit `=`, a different alias/scope, or the complete property name as appropriate.
5. Alias collisions in one imported/index scope do **not** invalidate unrelated elements or globally prohibit spellings. A collision matters only where its competing meanings remain viable.
6. Retain source spans for alias tokens and delimiters so diagnostics and editor tooling can explain the expansion or ambiguity. Reject duplicate resulting canonical properties regardless of their authored spellings.

**Unresolved parser details:** the complete grammar of token boundaries in each host language, scope/import override mechanics, and how bare-presence forms interact with native type validation require implementation decisions. These do not reverse the chosen **optional `=` / use-site error** principle.

## 2. Chained component paths

The syntax `<B/V/T>text</B/V/T>` represents **one element per path segment**, nested in order:

~~~tsx
<B/V/T>Hello!</B/V/T>
~~~

Equivalent conventional markup:

~~~tsx
<B>
  <V>
    <T>Hello!</T>
  </V>
</B>
~~~

When a chain is opened, the last component receives its text or children. Each segment can carry its own attributes using `Segment(...)`:

~~~tsx
<B(w+ h+)/V(g="8px")/T(c="blue")>Hello!</B/V/T>
~~~

Equivalent:

~~~tsx
<B w+ h+>
  <V g="8px">
    <T c="blue">Hello!</T>
  </V>
</B>
~~~

A chain is a convenience for a *linear single-child stretch*. Ordinary nested tags are still the right choice for a branching tree.

### 2.1 Self-closing chains

~~~tsx
<C(t="Pronouns" centerTitle)/Picker(values={pronouns} onChange={onPronounsChange}) />
~~~

means a `C` containing a self-closing `Picker`, with *both* nodes constructed. No separate closing tags are required for the chain's implicit single-child path.

This rule is provisional but consistent with the examples we've been exploring.

### 2.2 Closing a chain

The matching close path names *the components*, not their attributes:

~~~tsx
<B(w+ h+)/V/T>Hello!</B/V/T>
~~~

Open: whether shorter closing paths or partial suffix closes should be allowed. The conservative initial choice is **exact segment-name matching** (excluding the `^` reuse prefix).

## 3. Path reuse with `^` — experimental

The caret now means **reuse a previously declared element**, *not* close an element and *not* copy its props to a new instance.

~~~tsx
<B(w+ h+)/V/T>Hello!</B/V/T>
<^B/V/T>Hola!</B/V/T>
~~~

Intended resulting tree:

~~~tsx
<B w+ h+>
  <V><T>Hello!</T></V>
  <V><T>Hola!</T></V>
</B>
~~~

The second `^B` targets the previously declared `B`; because `V` has **no caret**, it creates a new child.

~~~tsx
<B(w+ h+)/V/T>Hello!</B/V/T>
<^B/^V/T>Hola!</B/V/T>
~~~

Intended resulting tree:

~~~tsx
<B w+ h+>
  <V>
    <T>Hello!</T>
    <T>Hola!</T>
  </V>
</B>
~~~

The first declaration supplies the properties and identity for reused ancestors. Only newly created child nodes need their own attributes. A reused path segment need not repeat the original props.

### 3.1 What counts as “previous”?

This is the hardest unresolved part of Axe. A plausible candidate is **most recent matching element under the currently selected ancestor, inside a bounded lexical render scope**. This gives `^B/^V` an intuitive, local meaning.

However, that rule must account for:

- multiple matching siblings and nested same-name components;
- conditionals/branches, loops, callbacks, fragments and portals;
- a reference across unrelated or dynamic paths;
- authored order vs. eventual sibling order;
- attributes on `^B` (mutate? reject? — recommended: reject for now);
- identifiers/keys and stability when reactive views re-render;
- how the compiler diagnoses a missing or ambiguous reference.

**Until these are specified, `^` is a design experiment, not a settled semantic contract.** It is best demonstrated using immediately adjacent, unambiguous, same-scope paths.

### 3.2 Avoid accidentally duplicating a parent

~~~tsx
<B/Btn>Reset</B/Btn>
<^B/Btn>Save</B/Btn>
~~~

Intended: **one** B with **two** Btn siblings. Repeating `<B/Btn>` *without* the caret would instead create a second B.

## 4. What remains normal markup

~~~tsx
<Screen>
  <Header><Title>Settings</Title></Header>
  <Panel(title="Account")/Input(value={name} onChange={setName}) />
  {errors.length > 0 ? <ErrorSummary errors={errors} /> : null}
</Screen>
~~~

Real content, real expressions, and the host language's map/loop/conditional syntax remain first-class. Axe doesn't add an alternate templating syntax.

Whitespace may remain purely presentational *between* Axe structural tokens. Literal text whitespace keeps the host language's existing rules. Estragon's existing grid-layout *matrix row* syntax is an important exception: the original Estragon layout declaration syntax intentionally treats physical lines as matrix rows; Axe aliases do not erase that contract.

## 5. Estragon layout-declaration integration

Estragon has existing reusable `layout const` / `layout var` declarations with grid regions, defaults, and export/reuse. Axe may expand indexes while parsing those declarations, preserving original source lines as grid matrix rows:

~~~gogo
layout const <App w+ h+ columns={["160px", "1fr"]}>
  <Header /> <Header />
  <Side /> <Body />
  <Side /> <Footer />
</App>
~~~

This is a **future integration example**, not existing Estragon syntax. Real behavior and semantics remain owned by [Estragon layout declarations](https://github.com/papercraftgames/Estragon/blob/main/docs/LAYOUT_DECLARATIONS.md). Do not rewrite the matrix as a free-standing generic list or assume a new layout solver.

## 6. Compilation boundaries

Axe should expand to ordinary host-language markup **before** React, Estragon, or another view runtime sees it. For indexes and chains this can often be a source-to-AST transform. For `^` reuse, the compiler must construct or reconcile an element tree, not merely search-and-replace text.

Editor features may show expanded names on hover, toggle expanded display, preserve source maps, and offer autocomplete from each index.

See [compiler design](COMPILER.md), [worked examples](EXAMPLES.md), and [decisions](DESIGN.md).
