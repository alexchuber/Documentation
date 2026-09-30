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

Describe meaningful scene objects with accessibility metadata, then create an HTML twin for the scene. An HTML twin is a generated, visually hidden HTML copy of your descriptions, not a copy of the rendered scene.

You can add names, descriptions, roles, and ARIA attributes. ARIA (Accessible Rich Internet Applications) adds names, roles, and states that assistive technologies can read from HTML.

<Alert severity="warning" title="Development feature">

Use the development build from [Babylon Lite accessibility PR alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2). No published `@babylonjs/lite` version includes these APIs yet.

</Alert>

## Describe an object

Assume that your application already has a `scene`, its `canvas`, and a `satellite` scene node. Add a tag to the node, create an HTML container beside the canvas, and create one HTML twin for the scene:

```typescript
import { createSceneHtmlTwin, disposeSceneHtmlTwin, setAccessibilityTag, updateSceneAccessibility } from "@babylonjs/lite";

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

`createSceneHtmlTwin` adds a labeled, visually hidden HTML region inside `accessibilityHost`. The `label` names that region for screen reader users. The function does not draw text in the 3D scene.

Tag objects that help a user understand the scene. Leave decorative meshes untagged. A tagged child still appears when its parent has no tag.

Call `disposeAccessibility()` when the viewer closes. It removes the generated HTML, disconnects scene updates, clears the satellite tag, and removes the container.

## Update a description

`setAccessibilityTag` stores a read-only copy of the tag and its ARIA values. Later edits to your original tag object or its `aria` object do not affect the HTML twin. Call `setAccessibilityTag` again with the new values.

For example, assume that `connectionStatus` is an existing scene node. This function updates its description from the current `connected` value:

```typescript
function updateConnectionStatus(connected: boolean): void {
  setAccessibilityTag(connectionStatus, {
    name: connected ? "Satellite connection is stable" : "Satellite connection is unavailable",
    role: "status",
    aria: { "aria-live": "polite" },
  });
}
```

`getAccessibilityTag` returns the current read-only tag, or `null` when the object has no tag. Use the returned values to build a replacement tag instead of trying to edit them.

## Remove or hide a description

Pass `null` to `setAccessibilityTag` to remove an object's generated description. Tagged children remain available:

```typescript
setAccessibilityTag(satellite, null);
```

To remove one ARIA attribute but keep the tag, omit that attribute from the replacement `aria` object or set its value to `null`.

Use `hidden: true` to hide an object and all its children from the generated HTML. Use this state when those descriptions should not be exposed. Do not hide an object only because the camera clips it or another mesh covers it.

If a tag supplies both `hidden` and `aria-hidden`, the values must agree. Use `disabled: true` or `aria-disabled` to report an unavailable state.

The HTML twin watches normal object additions, removals, parent changes, tag changes, visibility changes, and disposal. If you edit `scene.meshes` or `scene.lights` directly, synchronize the HTML yourself:

```typescript
updateSceneAccessibility(accessibilityTwin.accessibility);
```

## Change the description hierarchy

The generated HTML follows the scene's parent-child hierarchy by default. Use `setAccessibilityParent` when descriptions need different grouping or reading order. This function changes only the generated description hierarchy, not the scene transforms.

Both objects must be part of the same scene HTML twin. Pass `undefined` as the parent to restore the scene hierarchy.

Create the HTML twin before you add objects to the scene when possible. If an empty transform node serves only as a description group, the scene might not retain it. Include that node in the `roots` option when you create the twin:

```typescript
const accessibilityTwin = createSceneHtmlTwin(scene, {
  parent: accessibilityHost,
  label: "Satellite viewer",
  roots: [descriptionGroup],
});
```

## Test the result

The HTML twin uses the metadata that you provide. It does not inspect rendered pixels or infer descriptions from visual properties. You can create and test the metadata without a browser document, but creating the HTML twin requires one.

Test with each browser and screen reader that your application supports. These APIs can support an accessible experience, but using them does not by itself establish WCAG conformance.

Check that:

- Each meaningful object has the intended name, description, role, and ARIA state.
- Objects appear in the intended groups and reading order.
- Text and `aria-live` status stay current when scene state changes.
- Decorative, hidden, and removed objects do not appear.
