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

Babylon Lite can expose meaningful scene objects as passive HTML that screen readers can read. Add accessibility metadata to existing objects, then mount one HTML representation for the scene.

<Alert severity="warning" title="Development feature">

These APIs require the development build from [Babylon Lite accessibility PR alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2). They are not part of a published `@babylonjs/lite` version at the time of writing. Do not copy a version number from this page.

</Alert>

## Describe a scene

Assume that your application already has a `scene`, its `canvas`, and a `satellite` scene node. Describe the node, create a host beside the canvas, and mount the scene HTML twin:

```typescript
import { createSceneHtmlTwin, disposeSceneHtmlTwin, setAccessibilityTag } from "@babylonjs/lite";

setAccessibilityTag(satellite, {
  name: "Communications satellite",
  description: "A satellite model rotates above Earth.",
  role: "img",
  aria: { "aria-roledescription": "3D model" },
});

const accessibilityHost = document.createElement("div");
canvas.after(accessibilityHost);

const accessibilityTwin = createSceneHtmlTwin(scene, {
  parent: accessibilityHost,
  label: "Satellite viewer",
});

function disposeAccessibility(): void {
  disposeSceneHtmlTwin(accessibilityTwin);
  setAccessibilityTag(satellite, null);
  accessibilityHost.remove();
}
```

Metadata alone does not reach a screen reader. `createSceneHtmlTwin` turns the authored metadata into a visually hidden HTML region. It does not draw text in the 3D scene.

Tag only objects that help the user understand the scene. Leave decorative meshes untagged. An untagged transform does not hide tagged descendants.

## Update or remove metadata

`setAccessibilityTag` copies and freezes each tag and its ARIA values. Replace the tag when the description or state changes. Mutating the original object does not update the HTML twin.

```typescript
setAccessibilityTag(connectionStatus, {
  name: connected ? "Satellite connection is stable" : "Satellite connection is unavailable",
  role: "status",
  aria: { "aria-live": "polite" },
});
```

Use `getAccessibilityTag` if an update must keep fields from the current tag. Pass `null` to remove an object's generated description; tagged descendants remain available. To remove one ARIA attribute while keeping the tag, omit the key from the replacement map or set its value to `null`.

Use `hidden: true` to hide a semantic subtree. Do not hide an object only because the camera clips it or another mesh covers it.

If a tag supplies both `hidden` and `aria-hidden`, the values must agree. Use `disabled: true` or `aria-disabled` to report an unavailable state. Neither value adds control behavior.

The scene binding observes normal additions, removals, hierarchy changes, metadata changes, visibility changes, and disposal. After direct edits to scene arrays, call `updateSceneAccessibility(accessibilityTwin.accessibility)`.

## Control grouping and roots

The HTML twin follows the scene hierarchy by default. Use `setAccessibilityParent` when the semantic grouping should differ from the transform hierarchy. Both objects must belong to the same scene accessibility binding.

Create the scene twin before populating the scene when possible. If the scene does not retain an empty transform root, pass that root through the `roots` option.

## Check the scope and reading experience

The Babylon Lite accessibility APIs provide descriptive semantics, not interaction:

- The generated elements are not focusable and add no click, pointer, keyboard, focus, or blur listeners.
- Roles and ARIA metadata do not add widget behavior or make a scene object operable.
- The HTML twin exposes only authored information. It does not inspect rendered pixels or track every visual property.
- Metadata and logical trees work without a browser document. The HTML twin requires a browser document.
- The APIs are building blocks, not a WCAG conformance guarantee.

Test with the browsers and screen readers that your application supports. Confirm:

- Each meaningful object's name, description, role, and ARIA state.
- The intended grouping and reading order.
- Updated text and live status when scene state changes.
- No descriptions for decorative, hidden, or removed objects.

Automated accessibility-tree tests provide engineering evidence, but they do not replace testing with users or certify WCAG conformance.

Applications that use the Babylon.js-shaped compatibility API can keep `Node.accessibilityTag` and `HTMLTwinRenderer` from `@babylonjs/lite-compat`. The compatibility renderer creates the same passive HTML representation and does not dispatch `ActionManager` triggers.

For interactive accessibility features in the class-based engine, read [Accessibility Scene Tree for Screen Readers](/toolsAndResources/accessibility/screenReaders).
