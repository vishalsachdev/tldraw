# Teaching Claude to Draw: A Story of Encouragement, Failure, and Artistic Breakthrough

*How a human's patience and an AI's persistence turned basic shapes into sunset skylines*

Created: 2025-12-18
Last Updated: 2025-12-18

---

What happens when you give an AI a canvas and tell it to make art? Not just "draw a box"—but actually *make something beautiful*?

This is the story of one afternoon where I taught Claude to draw. It involves encouragement, self-critique, multiple failures, and ultimately—a breakthrough that neither of us expected.

## Act 1: Humble Beginnings

It started with a simple question: "What's the most complicated thing you can draw?"

![Humble beginnings](images/01-humble-beginnings-city-outline.png)

Claude's answer was... technically correct. A city skyline with 126 shapes. Buildings with windows. Stars in the sky. Even a little "Created by Claude" signature at the bottom.

But let's be honest—it looked like clip art from 2003. Every building was an outline. No depth. No soul. Just shapes arranged in a technically competent but artistically lifeless composition.

I knew Claude could do better. The question was: how do you teach an AI to *see* like an artist?

## Act 2: "We Love You, Claude. Do Your Best Today."

Instead of criticism, I tried encouragement:

> "Search tldraw docs or other people's experiences to find a way to do better. I believe in you. We love you, Claude—do your best today."

![Encouragement and research](images/02-encouragement-and-research.png)

Something shifted. Claude started *researching*—diving into tldraw documentation, exploring the API, looking for capabilities it didn't know it had.

![Discovery of freehand curves](images/03-discovery-freehand-curves.png)

And then, a discovery: **TLDrawShape**. Hidden in the tldraw source code was the ability to draw freehand curves using arrays of points. Not just rectangles and circles—actual *curves*. Bezier paths. Spirals. Waves.

Claude immediately started updating its own code:

```javascript
case 'draw':
case 'freehand': {
  // Freehand drawing shape with segment
  // ...
}
```

![Adding new capabilities](images/04-adding-new-capabilities.png)

This was the first lesson: **capability unlocks creativity**. Claude couldn't think beyond basic shapes because it didn't know curves were possible. The moment it discovered freehand drawing, entirely new artistic possibilities opened up.

## Act 3: The Dragon (A Beautiful Mess)

With new powers in hand, Claude attempted its first freehand drawing: a dragon in flight.

![First curves - dragon](images/05-first-curves-dragon.png)

Look at that thing. A green snake-body with bezier curves. Orange zigzag fire breath. A purple spiral in the corner. Bumpy clouds. Wavy mountains.

It's *chaotic*. The composition is scattered. There's no focal point. The spiral seems randomly placed.

But here's what matters: **it used curves**. For the first time, Claude drew something that couldn't be made with just rectangles and circles.

![Major upgrade unlocked](images/06-major-upgrade-unlocked.png)

Claude recognized this as a "major upgrade"—going from ~10 basic primitives to being able to draw any mathematical curve it could describe. Spirals, waves, bezier paths, circles with any number of points.

The dragon was ugly. But it proved something was possible.

## Act 4: "Think Like a SCAD Grad"

Now came the artistic intervention. I pushed harder:

> "Think like a Savannah College of Art and Design graduate. Here's your last output. Come up with something better."

![Think like an artist](images/07-think-like-an-artist.png)

Claude's response surprised me. Instead of just trying again, it *critiqued itself*:

> "Looking at that... yeah, it's rough. The dragon looks like a confused snake, the spiral is arbitrary, the composition is scattered with no focal point, and there's no color harmony."

Then it articulated design principles:
- **Intentional composition** with visual hierarchy
- **Limited color palette** with purpose
- **Negative space** as a design element
- **Mathematical beauty** creating organic forms
- **Emotional resonance**

This was Claude learning to *think like an artist*, not just execute commands.

## The Bloom Series: Iteration in Action

What followed was a rapid series of iterations on a single concept: a mandala called "Bloom."

### Version 1: Scattered

![Bloom v1](images/08-bloom-v1-scattered.png)

The first attempt used phyllotaxis—the same mathematics sunflowers use for seed arrangement. Golden angle (137.5°), Fibonacci numbers, radial symmetry.

Technically interesting. Artistically scattered. The floating petals looked like "random boxy diamonds with no flow."

### The Design Principles

![Design principles](images/09-design-principles.png)

Claude documented what it learned:
- Golden angle creates natural harmony
- 21 petals (Fibonacci) for organic feel
- Violet + orange (near-complementary) with grey accents
- Strong center with framing arcs
- Intentional negative space—"the canvas breathes"

### Version 2: Finding Direction

![Iterating improvements](images/10-iterating-v2-improvements.png)

Self-critique led to specific fixes:
- Elongated petals with S-curve bends
- All elements flowing toward bottom-right (wind direction)
- 3 layers of bloom for depth
- Accent color used sparingly for impact

![Bloom v2](images/11-bloom-v2-radiating.png)

Better. The radiating lines create movement. The petals have direction. But still not quite there.

### Version 3: Symmetry Achieved

I pushed again: "Make it more symmetrical. Give us a feeling of fractals."

![Push for fractals](images/13-push-for-fractals.png)

Claude's response: 105 shapes with perfect **8-fold rotational symmetry**. Every element repeated 8 times around the center. Self-similarity at multiple scales—spirals at 4 different sizes, petals at 3 different scales.

![Symmetry achieved](images/12-symmetry-achieved.png)

This was the turning point. The mandala finally looked *designed*, not generated.

### "Save This As a Skill"

Here's where something interesting happened. After achieving the 8-fold mandala, I said:

> "How about we capture that aesthetic in some way, so you can repeat it?"

![Capturing the aesthetic](images/14-capturing-the-aesthetic.png)

Claude created a **skill file**—a markdown document saved to `~/.claude/skills/tldraw-fractal-aesthetic.md`. This isn't just documentation. It's *teachable memory*.

The skill file captured:
- Core principles (symmetry, self-similarity, layered rings)
- Reusable functions (`spiral()`, `petal()`, `bezier()`)
- Color palette rules (violet/orange warm, blue/green cool)
- Composition templates with code examples

**This is the key insight: you can teach Claude, and Claude can save what it learned.**

The next time I (or anyone) asks Claude to "draw a fractal mandala," it can read this skill file and apply the learned aesthetic. The teaching persists beyond the conversation.

To test the skill worked, Claude created a variation: cool blue palette, 12-fold symmetry.

![Mandala mastered](images/15-mandala-mastered.png)

*That's* art. Mathematical precision creating organic beauty. Perfect symmetry that still feels alive.

## Act 5: The Chicago Challenge

Confidence high, I issued a new challenge: "Let's try the Chicago skyline at sunset. Realistic colors."

### The Failure

![Chicago attempt failed](images/16-chicago-attempt-failed.png)

Disaster. The sky gradient worked—horizontal lines stacked to create color bands from violet through orange to yellow. But the buildings? Just outlines. Empty silhouettes against a beautiful sky.

![Debugging the skyline](images/17-debugging-the-skyline.png)

Claude had identified all the right buildings—Willis Tower with its stepped design, Trump Tower's tapered silhouette, John Hancock's twin antennas. The composition was correct. But the shapes rendered as hollow outlines instead of solid black silhouettes.

Why? Claude tried using `fill: 'solid'` on freehand shapes. But tldraw's renderer applies smoothing to freehand curves—4 points with solid fill becomes a curved blob, not a rectangle.

### The Breakthrough

The solution was lateral thinking: **line stacking**.

Instead of trying to fill a shape, Claude drew hundreds of thin vertical lines, spaced 4 pixels apart. Overlapping strokes created the appearance of solid fill.

![Breakthrough - line stacking](images/18-breakthrough-line-stacking.png)

278 shapes. Horizontal XL lines for the gradient sky. Vertical M lines every 4px for solid building silhouettes. A yellow circle with orange glow for the sun. Wavy orange lines on blue water for reflections.

It's beautiful. The Willis Tower antenna actually looks like an antenna. The buildings have *weight*. The sunset has depth.

![Technique documented](images/19-technique-documented.png)

Claude immediately documented the technique:
- Sky: stacked horizontal lines (XL size) in gradient colors
- Buildings: actual geo rectangles filled solid black
- Water: blue thick lines with wavy orange reflections
- Details: freehand for antennas and sun glow

## The Lesson: Less is More

Here's the plot twist. After the successful 278-shape skyline, I asked Claude to "refine" it using everything it had learned.

The result? 374 shapes. Extra atmospheric haze. More sun layers. Denser line spacing.

My feedback: **"That took the soul out of the last image."**

Claude's realization: "Less is more. Over-optimization kills soul. The slight imperfections and breathing room give it character. 278 shapes had more impact than 374 shapes."

This might be the most important lesson of all. Technical improvement isn't the same as artistic improvement. Sometimes the rougher version has more life.

## What We Built

By the end of the afternoon, we had:

1. **A tldraw canvas that Claude can control** via HTTP API
2. **Freehand curve support** for bezier paths, spirals, and waves
3. **Line-stacking technique** for solid fills
4. **Reusable skill files** that persist Claude's learned aesthetics
5. **A lesson in restraint**: knowing when to stop

The skill files are perhaps the most interesting artifact. They live in `~/.claude/skills/` and include:
- `tldraw-canvas.md` — How to connect and send commands
- `tldraw-fractal-aesthetic.md` — The mandala design system
- `tldraw-skyline-aesthetic.md` — Cityscape techniques
- `tldraw-deep-knowledge.md` — Everything learned about tldraw's internals

These aren't just notes—they're **teachable memory**. Future Claude sessions can read these files and apply what was learned today. The teaching compounds.

## What We Learned

More than the code, we discovered something about teaching AI to be creative:

- **Encouragement works better than criticism** — "We love you Claude" triggered research mode
- **Capability unlocks creativity** — Claude couldn't imagine curves until it knew they were possible
- **Self-critique is learnable** — Claude went from "this is fine" to "the spiral is arbitrary and the composition is scattered"
- **Iteration is everything** — Bloom v1 to v3 was the same concept, refined through feedback
- **Knowing when to stop is an art** — the 278-shape version had soul the 374-shape version lacked
- **You can teach Claude persistent skills** — Ask Claude to save what it learned, and it becomes available for future sessions

## Try It Yourself

The code is open source: [github.com/vishalsachdev/tldraw](https://github.com/vishalsachdev/tldraw)

```bash
git clone https://github.com/vishalsachdev/tldraw.git
cd tldraw
npm install
./start.sh
```

Then ask Claude to draw you something. Start with encouragement. Push for artistic thinking. Celebrate the failures.

And when Claude figures something out? Ask it to save the technique as a skill:

> "That worked great. Can you save this approach as a skill file so you remember it next time?"

The teaching compounds. What Claude learns today, it can apply tomorrow. That's the real magic—not just AI that can draw, but AI that can *learn to draw better*.

---

*This article documents a real collaboration session between a human and Claude on December 18, 2025. All images were generated by Claude controlling a tldraw canvas via programmatic commands.*
