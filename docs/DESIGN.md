# Why Axe exists

## Success criterion: readable density

Axe is not trying to beat a compression algorithm. It is trying to keep **as much UI intent visible at once as possible** while preserving the author's ability to understand and edit a large screen.

We started with a large, complex XML-like layout. Long names and one-prop-per-line formatting made screens tall. Extracting components reduced each file's size but fragmented understanding across files. Folding and inlining files rearranged the navigation problem, rather than solving it.

Our north star: **more intent per screen, fewer meaningless keystrokes, and no mandatory hidden structure**.

## The core principle: compress vocabulary, not intent

AXE's strongest readability advantage is **selective compression**. Familiar framework vocabulary repeats throughout a large view; the important, less predictable information is the app-specific meaning carried by handler names, labels, text, expressions, and domain concepts.

~~~jsx
// Familiar XML/JSX
<Button onClick={onSaveForm}>Save</Button>

// Proposed Axe syntax
<Bt(oC={onSaveForm})>Save</Bt>
~~~

Here `Bt` maps to `Button`, and `oC` maps to `onClick`. Those are reusable conventions developers can learn once (or expand in the editor). **`onSaveForm` and `Save` remain untouched.** An author reading this still knows what control it is and what it does. In a real view, that specific meaning matters more than repeatedly spelling out the framework's standard names.

This is not indiscriminate minification, automatic renaming, or an invitation to turn domain identifiers into cryptic initials. **Meaningful application identifiers and user-facing content are not targets for AXE alias expansion.** Component and property aliases are optional, shared vocabulary; developers can use full names whenever shorthand makes a particular view less legible.

**Evaluate AXE by how clearly a reader can find the UI's purpose, behavior, and data, not by how few characters it contains.**

## Fluency: from decoding syntax to recognizing shapes

> **The code becomes less like reading instructions and more like recognizing shapes.**

AXE aims for a learned visual vocabulary. A newcomer may consciously decode `Bt` as `Button` and `oC` as `onClick`; with repeated exposure to stable indexes, those tokens may become familiar units of recognition. The developer's attention can move toward **`onSaveForm`** and **`Save`**, which are the unique, meaningful parts of the view.

**This is a hypothesis about fluency, not a proven performance result.** Readable density and learning cost should ultimately be tested with actual developers: compare reading/comprehension, time-to-locate-behavior, editing mistakes, and use of full-name escape hatches before and after practice. It is possible to abbreviate too aggressively, so stable, understandable aliases and conventional markup remain important.

AXE should support both phases: easy discovery for newcomers (hover-to-expand, full names, static diagnostics) and rapid pattern recognition for practiced authors. **The goal is not to make unfamiliar code cryptic; it is to make familiar code instantly legible.**

## Related work: what AXE borrows and what it proposes

AXE is **not** the first attempt to shorten markup or build muscle memory around shorthand. Its distinction is the *combination* and authoring philosophy, rather than inventing abbreviation itself:

- [Emmet](https://docs.emmet.io/abbreviations/syntax/) has shorthand for nested HTML/XML trees and tag aliases; [Emmet's CSS abbreviations](https://docs.emmet.io/css-abbreviations/) even support delimiter-free property/value combinations such as `m10`. These are primarily **editor/input abbreviations expanded into ordinary source**, rather than a compact XML-like language deliberately retained as the authored source.
- [Haml](https://github.com/haml/haml) and [Slim](https://github.com/slim-template/slim) remove markup ceremony using alternate template syntax, often relying on indentation for nesting. AXE intentionally **retains recognizable XML-like tags and familiar expressions**, with full-length spelling always available.
- [Hiccup](https://cljdoc.org/d/hiccup/hiccup/2.0.0/doc/syntax) represents HTML compactly using Clojure vectors. It is another demonstration that markup need not use verbose XML, but a different authoring model.

AXE proposes **independent, scoped ComponentIndex/PropIndex/ValueIndex vocabularies; optional concatenated value aliases with `=` only for disambiguation; element paths; experimental ancestor reuse; compile-time usage-site ambiguity checks; and intentional preservation of app-specific identifiers and UI content**. These are design proposals, not yet a shipped language or validated comparative advantage.

## Things we learned, in order

| Experiment | Outcome |
| --- | --- |
| Put siblings/attributes together on one line | Saved height but packed information in ways we disliked |
| Replace closing tags with a symbol | Reduced characters but made boundaries ugly and harder to follow |
| Remove indentation | Technically possible; lost useful visual cues about nesting |
| Flat declarations with parent references | Potentially useful but introduced lots of reference ceremony |
| ComponentIndex | Works with existing hierarchy; abbreviates repeated component names |
| PropIndex | Works independently; abbreviates repeated property names |
| ValueIndex | Abbreviates high-frequency literal values; `w+` is the default, `w=+` is an explicit fallback |
| Estragon layout declarations | Already handle named regions/defaults: don't reinvent those structures |
| Chain single-child paths | Addresses *vertical* ceremony without abandoning explicit nesting |
| Reuse an ancestor with `^` | Potentially removes repeated declarations; requires strict semantic rules |
| Optional `=` separator | Preserves arbitrary alias names while letting the author disambiguate token boundaries |
| Special repeated text/`repeat` prop/`|` separator | Rejected: normal array mapping/host syntax handles repetition better |

## Principles

1. **Opt-in at each occurrence.** Long names remain valid; never force shorthand everywhere.
2. **Compress repeated framework vocabulary, never app-specific intent.** Preserve expressive handler names, domain variables, labels, user-visible text, and logic.
3. **No silent interpretation.** Names are flexible across independent indexes and scopes; ambiguous readings fail exactly where authored instead of receiving arbitrary precedence.
4. **Preserve the view tree.** An optimized declaration should result in the same nodes, props, children, handlers, and order.
5. **Keep real complexity visible.** Variables, callbacks, conditionals, and meaningful differences remain in the view.
6. **No decorative compression.** Shorten frequent obvious vocabulary; leave distinctive semantics legible.
7. **Plain text survives without an IDE.** Rich editor assistance is a bonus, not a prerequisite.
8. **Static errors at the use site beat implicit guessing.** Don't globally reject a useful alias because it might collide elsewhere; if multiple meanings are viable on this element, fail there.
9. **Keep compiler expansion separate from runtime behavior.** React/GGX/native components should not need to understand an alias.
10. **Let existing host features work.** Loops, arrays, logic, ref/binding and reusable layouts aren't replaced.

## Index authoring guidelines

A good indexed alias is:
- Frequent across the repository or framework.
- Easy to learn/recognize.
- Meaning-preserving across its intended scope.
- Easy to inspect or expand in an editor.

A poor indexed alias:
- Is used once to save two characters.
- Hides a unique business concept.
- Creates widespread, hard-to-read usage-site collisions (not a reason for a global prohibition).
- Depends on undocumented context.
- Turns the file into an unreadable collection of one-letter puzzles.

All three index categories should support imports and centralized project vocabulary. A future community-standard vocabulary could exist, but standardization isn't required to prove the idea.

## Why chains work differently than closing-symbol experiments

Normal nesting expresses depth **vertically**:

~~~jsx
<B>
  <V>
    <T>Hello!</T>
  </V>
</B>
~~~

Chains express the same depth **horizontally** with recognizable component names:

~~~jsx
<B/V/T>Hello!</B/V/T>
~~~

The boundary remains spelled in terms of *real component names*, and the long form remains available. It particularly helps a series of single-child wrappers or when component properties already live inside a stable chain.

## Measurements: explain what is being measured

In our original development discussion, a real mobile-app profile editor render block was measured (not published here, as its source is private):

| Metric | Original | Experimental Axe rewrite |
| --- | ---: | ---: |
| Visible render lines | 166 | 67 |
| Characters (with whitespace) | 4,874 | 2,425 |
| Characters (without whitespace) | 2,731 | 1,738 |

That is **99 fewer lines** (~59.6% less vertical length at a fixed line height), so approximately **2.48× as much source can fit in a viewport**. Character reduction is ~50.2%. Layout, font, wrap-width and formatting conventions affect these results; this is an exploratory example, not a performance study.

Axe's indexed and chained comparison assumes shared indexes whose declarations are not counted in the local render block. Estragon layout declarations are a separate integration opportunity, not part of this specific TSX measurement.

## Open decisions before a parser

**Settled authoring principles (compiler implementation is not shipped):**

- `<B w+ h+ />` is the preferred form; it may use **any** symbolic or alphabetic ValueIndex name when the property/value split is unambiguous.
- `=` is an **optional, reserved separator**, forbidden inside alias keys. `w=+` selects `w` + `+`; `w+=+` selects a `w+` property alias + `+`.
- Collisions are checked **per lexical scope, per component, at the actual authored usage site**—not rejected globally and not resolved by an invisible precedence rule.
- A PropIndex alias `x: extend` is unusable as `x` on a component that already has native `x`; write `extend` there. No automatic native-name preference.
- Full names, old conventional `=` assignments, and all other AXE features remain optional and mixable.

**Core implementation details still open:**
- What is the project-wide index file format and import/override precedence?
- What exact host-aware token grammar handles punctuation, alphabetic suffixes, bare-presence attributes and invalid tokens without losing source maps?
- Must chain closures match the entire path verbatim?
- How does authored source formatting interact with JSX text whitespace?

**Especially `^` reuse:**
- Which earlier element does a reused segment resolve to, and within what scope?
- Does reuse require a prior sibling declaration in the same syntactic block?
- Are conditional, loop, and function boundaries hard barriers?
- Can a reference be reused after an intervening declaration?
- How are duplicates and ambiguous matches reported?
- Is a reused element reconfigurable later or strictly a reference?
- How does a compiler preserve ordering/identity through reactivity?

**Tooling:**
- How do autocomplete, hover expansion, and navigation work?
- Does the IDE display expanded source without rewriting the file?
- How are source maps and errors tied to original Axe spans?

These decisions should not reintroduce mandatory delimiters, global bans on otherwise useful aliases, or a silent precedence rule. A small working compiler and real-view diagnostics should resolve the remaining grammar details.
