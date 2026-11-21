<div align="center">
  <img src="assets/axe-hero-v2.svg" alt="Axe: compact, readable XML-like UI declarations" width="100%" />
</div>

# Axe

**More intent on screen. Less markup ceremony.**

Axe is an experimental, compile-time syntax for XML-like view declarations. It keeps familiar tags, nesting, text, expressions, and named properties, but removes recurring *spelling* and *single-child nesting* overhead. Its goal is **readable density**, not maximum compression.

> **Status: design reference, not an implemented compiler.** The examples document syntax we explored; the exact grammar, especially `^` reuse across scopes, still needs implementation and verification. Ordinary JSX/TSX parsers do not accept Axe's chain and bare-token syntax unchanged.

## The idea in one glance

~~~tsx
// Familiar JSX
<Box width="100%" height="100%">
  <VBox>
    <Text color="blue">Hello there!</Text>
  </VBox>
</Box>

// Axe: same intended element tree
<B(w=+ h=+)/V/T(c="blue")>Hello there!</B/V/T>
~~~

The vocabulary is optional and shared. You can always write `<Box width="100%">` instead of an alias.

<div align="center">
  <img src="assets/axe-mechanics.svg" alt="How component, property and value indexes combine with chained elements and parent reuse" width="100%" />
</div>

## Five complementary ideas

| Feature | Example | What it removes |
| :-- | :-- | :-- |
| **ComponentIndex** | `<B>` → `<Box>` | Repeated long component names |
| **PropIndex** | `w` → `width` | Repeated long attribute names |
| **ValueIndex** | `w=+` → `width="100%"` | Repeated common literal values |
| **Chained elements** | `<B/V/T>Hi</B/V/T>` | Vertical single-child wrappers |
| **Path reuse** (experimental) | `<^B/^V/T>Hola</B/V/T>` | Redeclaring an existing ancestor |

The first three are **independent indexes** that can live in one repository-wide definition file, be imported from a package, or eventually use an industry-standard vocabulary. Indexes expand at compile time; the runtime components remain unchanged.

~~~xml
<!-- Illustrative central index syntax; not yet a parser format -->
<ComponentIndex>
  B: Box
  V: VBox
  T: Text
</ComponentIndex>
<PropIndex>
  w: width
  h: height
  c: color
</PropIndex>
<ValueIndex>
  +: "100%"
  $: "start"
  .: "end"
</ValueIndex>
~~~

Value tokens are unquoted only when an index lookup is intended: `w=+` expands to `width="100%"`; `w="+"` means a literal plus sign. Braced expressions such as `w={someWidth}` remain ordinary expressions. Bare alphabetic value tokens such as `fd=r` are part of the **proposed compiler grammar**, not existing JSX.

## The new kind of nesting

Single-child chains stay explicit while moving *left to right*:

~~~tsx
<B(w=+ h=+)/V/T(c="blue")>Hello!</B/V/T>
~~~

The inner `T` receives the text; each ancestor may have its own `(...)` attributes. Ordinary nested JSX is still available for branching layouts.

The next idea is **reuse**, not a closing-tag replacement:

~~~tsx
<B(w=+ h=+)/V/T>Hello!</B/V/T>
<^B/V/T>Hola!</B/V/T>       // Same B, NEW V
<^B/^V/T>Bonjour!</B/V/T>  // Same B, same most-recent V
~~~

The `^` prefix is an **experimental reference** to an existing element in a constrained authoring scope; it does **not** mean “pop the stack.” Its precise scoping, ambiguity, and ordering rules are an open design item. See [the syntax reference](docs/SYNTAX.md).

## See the difference

<div align="center">
  <img src="assets/axe-comparison.svg" alt="Visual comparison of an original TSX screen with its experimental Axe rewrite: 166 versus 67 lines" width="100%" />
</div>

An exploratory, formatting-specific screen comparison went from **166 to 67 lines** — **99 lines eliminated, 59.6% less vertical source, or 2.48× as much view declaration visible at a fixed line height**. The same comparison went from **4,874 to 2,425 characters** (about **50.2% smaller**). These numbers describe a *particular authored example*, not a guaranteed reduction. Index files and compiler machinery are not part of that view-only count. To avoid copying private app source into this public repository, the runnable-looking examples here use invented UI and identifiers.

Read the [fully worked, original profile-editor example](examples/profile-editor.original.tsx.txt) beside the [Axe rendering](examples/profile-editor.axe), or visit the [annotated examples](docs/EXAMPLES.md).

## What Axe does **not** do

- It does **not** rename your variables, handlers, or data models.
- It does **not** introduce a `repeat` prop, pipe-separated siblings, or a template loop system. Use the host language's maps/loops.
- It does **not** make indentation or line breaks determine ordinary nesting.
- It does **not** require aliases, or force every prop on one line.
- It does **not** pretend that reducing characters always increases readability.

Axe preserves verbose, well-named markup as an escape hatch *by design*.

## Existing layout declarations can participate

Estragon's existing `layout const` declarations already define reusable named regions, defaults, and grid matrices. Axe indexes can expand inside those declarations **before** Estragon interprets the layout. The grid's source line boundaries intentionally define matrix rows; this is distinct from Axe's whitespace-insensitive element-chain idea.

~~~gogo
layout const <App w=+ h=+ gap="8px" columns={["160px", "1fr"]}>
  <Header /> <Header />
  <Side /> <Body />
  <Side /> <Footer />
</App>
~~~

This is a **proposed integration**, not something currently accepted by Estragon. See [Estragon's actual layout-declaration contract](https://github.com/papercraftgames/Estragon/blob/main/docs/LAYOUT_DECLARATIONS.md).

## Explore the design

- **[Syntax and semantics](docs/SYNTAX.md)** — indexes, chaining, `^` reuse, errors, source order, and host-language boundaries.
- **[Annotated examples](docs/EXAMPLES.md)** — simple branches, shared parents, independent layouts, a form, and Estragon integration.
- **[Design decisions and open questions](docs/DESIGN.md)** — what we tried, rejected, and still need to decide.
- **[Example index file](examples/shared-indexes.axe)** — proposed repo-wide authoring vocabulary.
- **[Measurements](docs/MEASUREMENTS.md)** — transparent, reproducible before/after counts (plus the exploratory complex-screen benchmark).
- **[Profile editor before](examples/profile-editor.original.tsx.txt) / [after](examples/profile-editor.axe)** — self-contained illustrative view snippets.

### Editor possibilities

Because aliases are static, an IDE could offer hover-to-expand, toggle between shorthand/full names, autocomplete for both, navigation to index definitions, and diagnostics mapped back to the authored source. None of those features needs to dictate how the source is written.

**North star:** *Keep the meaning. Lose the ceremony.*
