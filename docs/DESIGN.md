# Why Axe exists

## Success criterion: readable density

Axe is not trying to beat a compression algorithm. It is trying to keep **as much UI intent visible at once as possible** while preserving the author's ability to understand and edit a large screen.

We started with a large, complex XML-like layout. Long names and one-prop-per-line formatting made screens tall. Extracting components reduced each file's size but fragmented understanding across files. Folding and inlining files rearranged the navigation problem, rather than solving it.

Our north star: **more intent per screen, fewer meaningless keystrokes, and no mandatory hidden structure**.

## Things we learned, in order

| Experiment | Outcome |
| --- | --- |
| Put siblings/attributes together on one line | Saved height but packed information in ways we disliked |
| Replace closing tags with a symbol | Reduced characters but made boundaries ugly and harder to follow |
| Remove indentation | Technically possible; lost useful visual cues about nesting |
| Flat declarations with parent references | Potentially useful but introduced lots of reference ceremony |
| ComponentIndex | Works with existing hierarchy; abbreviates repeated component names |
| PropIndex | Works independently; abbreviates repeated property names |
| ValueIndex | Abbreviates high-frequency, obvious literal values; composes with PropIndex |
| Estragon layout declarations | Already handle named regions/defaults: don't reinvent those structures |
| Chain single-child paths | Addresses *vertical* ceremony without abandoning explicit nesting |
| Reuse an ancestor with `^` | Potentially removes repeated declarations; requires strict semantic rules |
| Special repeated text/`repeat` prop/`|` separator | Rejected: normal array mapping/host syntax handles repetition better |

## Principles

1. **Opt-in at each occurrence.** Long names remain valid; never force shorthand everywhere.
2. **One authoritative meaning.** An alias resolves to one named component, property, or literal; don't infer from context silently.
3. **Preserve the view tree.** An optimized declaration should result in the same nodes, props, children, handlers, and order.
4. **Keep real complexity visible.** Variables, callbacks, conditionals, and meaningful differences remain in the view.
5. **No decorative compression.** Shorten frequent obvious vocabulary; leave distinctive semantics legible.
6. **Plain text survives without an IDE.** Rich editor assistance is a bonus, not a prerequisite.
7. **Static errors beat implicit guessing.** Ambiguity and duplicate props should be compile-time failures.
8. **Keep compiler expansion separate from runtime behavior.** React/GGX/native components should not need to understand an alias.
9. **Let existing host features work.** Loops, arrays, logic, ref/binding and reusable layouts aren't replaced.

## Index authoring guidelines

A good indexed alias is:
- Frequent across the repository or framework.
- Easy to learn/recognize.
- Meaning-preserving across its intended scope.
- Easy to inspect or expand in an editor.

A poor indexed alias:
- Is used once to save two characters.
- Hides a unique business concept.
- Conflicts with an existing component or prop.
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

**Core:**
- What is the project-wide index file format and import/override precedence?
- When should an alias conflict with a component/prop that already bears the same spelling?
- What exact token grammar supports symbols such as `+` and `.` in unquoted attribute-value position?
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

None of these need to be answered by inventing yet another delimiter. The smallest working compiler with correct diagnostics and a few actual screen examples should decide the next steps.
