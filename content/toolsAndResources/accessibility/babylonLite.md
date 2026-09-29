---
title: Accessibility in Babylon Lite
image:
description: Describe Babylon Lite scene objects to screen readers with ARIA metadata and semantic HTML
keywords: babylon.js, babylon lite, accessibility, a11y, screen reader, aria, html twin
further-reading:
video-overview:
video-content:
---

# Accessibility in Babylon Lite

Babylon Lite can expose meaningful scene objects as passive semantic HTML that screen readers can read. You choose which objects matter and describe their names, roles, states, and relationships.

<Alert severity="warning" title="Development feature">

These APIs require the development build from [Babylon Lite accessibility PR alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2). They are not part of a published `@babylonjs/lite` version at the time of writing. Do not copy a version number from this page.

</Alert>

## Describe a scene

Use `setAccessibilityTag` to describe meaningful scene objects. Then mount one scene HTML twin outside the canvas. The twin creates a real HTML representation that assistive technology can read.

The HTML twin does not draw text in the 3D scene. It adds a separate semantic region to the document.

```typescript
import { createSceneHtmlTwin, disposeSceneHtmlTwin, setAccessibilityTag } from "@babylonjs/lite";
import type { SceneContext, SceneNode } from "@babylonjs/lite";

export function mountSceneDescriptions(scene: SceneContext, canvas: HTMLCanvasElement, model: SceneNode, status: SceneNode): () => void {
  const host = document.createElement("section");
  canvas.after(host);

  setAccessibilityTag(model, {
    name: "Communications satellite",
    description: "A satellite model rotates above Earth.",
    role: "img",
  });

  setAccessibilityTag(status, {
    name: "Satellite connection is stable",
    role: "status",
    aria: { "aria-live": "polite" },
  });

  const twin = createSceneHtmlTwin(scene, {
    parent: host,
    label: "Satellite viewer",
  });

  return () => {
    disposeSceneHtmlTwin(twin);
    setAccessibilityTag(model, null);
    setAccessibilityTag(status, null);
    host.remove();
  };
}
```

Tag only objects that help the user understand the scene. Leave decorative meshes untagged. An untagged transform does not hide tagged descendants.

The generated elements are not focusable. The HTML twin does not add click, pointer, keyboard, focus, or blur listeners.

## Update or remove metadata

`setAccessibilityTag` copies and freezes the tag and its ARIA values. Replace the tag when a name, description, role, or state changes. Mutating the original object does not update the HTML twin.

```typescript
import { getAccessibilityTag, setAccessibilityTag } from "@babylonjs/lite";
import type { SceneNode } from "@babylonjs/lite";

export function reportConnection(status: SceneNode, connected: boolean): void {
  const previous = getAccessibilityTag(status);
  setAccessibilityTag(status, {
    ...(previous ?? {}),
    name: connected ? "Satellite connection is stable" : "Satellite connection is unavailable",
    aria: {
      ...(previous?.aria ?? {}),
      "aria-live": "polite",
    },
  });
}
```

Pass `null` to remove an object's generated description. Tagged descendants remain available. To remove one ARIA attribute while keeping the tag, omit the old key from the replacement map or set that key to `null`.

Use `hidden: true` to hide a semantic subtree. Do not hide an object only because the camera clips it or another mesh covers it.

If a tag supplies both `hidden` and `aria-hidden`, the values must agree. Use `disabled: true` or `aria-disabled` to report an unavailable state. Neither value adds control behavior.

The scene binding observes normal scene additions, removals, hierarchy changes, metadata changes, visibility changes, and disposal. It does not infer descriptions from rendered pixels or track every visual property. After direct edits to scene arrays, call `updateSceneAccessibility(twin.accessibility)`.

## Organize the semantic hierarchy

The HTML twin follows the scene hierarchy by default. Use `setAccessibilityParent` when the semantic grouping should differ from the transform hierarchy. Both objects must belong to the same scene accessibility binding.

Create the scene twin before populating the scene when possible. If the scene does not retain an empty transform root, pass that root through the `roots` option.

## Port existing Babylon.js metadata

The `@babylonjs/lite-compat` package retains `Node.accessibilityTag` and `HTMLTwinRenderer` for applications that use the Babylon.js-shaped API. The compatibility renderer creates the same passive HTML representation and does not dispatch `ActionManager` triggers.

## Know the boundaries

The Babylon Lite accessibility APIs provide descriptive semantics, not interaction:

- ARIA metadata does not add keyboard behavior or make a scene object operable.
- The HTML twin exposes authored information. It does not describe the rendered image automatically.
- Metadata and logical trees work without a browser document. The HTML twin requires a browser document.
- The APIs do not add canvas controls, focus management, GUI twins, interactive overlays, motion controls, or audio controls.
- The APIs are building blocks, not a WCAG conformance guarantee.

For the class-based engine's broader accessibility features, read [Accessibility Scene Tree for Screen Readers](/toolsAndResources/accessibility/screenReaders).

## Test the descriptions

Use the browsers and screen readers that your application supports. Confirm that assistive technology reads:

- Each meaningful object's name, description, role, and ARIA state.
- The intended grouping and reading order.
- Updated text and live status when scene state changes.
- No descriptions for decorative, hidden, or removed objects.

Automated accessibility-tree tests provide engineering evidence, but they do not replace testing with users or certify WCAG conformance.
