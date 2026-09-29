---
title: Accessibility in Babylon Lite
image:
description: Add screen reader semantics, keyboard controls, live HTML, motion controls, and audio controls to a Babylon Lite application
keywords: babylon.js, babylon lite, accessibility, a11y, screen reader, keyboard, html twin, native controls
further-reading:
video-overview:
video-content:
---

# Accessibility in Babylon Lite

Babylon Lite can expose meaningful scene objects as semantic HTML and use native browser controls beside the canvas. You choose which objects matter, provide their names and actions, and own the application policy for focus, motion, audio, and testing.

<Alert severity="warning" title="Development feature">

These APIs require the development build from [Babylon Lite accessibility PR alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2). They are not part of a published `@babylonjs/lite` version at the time of writing. Do not copy a version number from this page.

</Alert>

## Expose a scene object

Use `setAccessibilityTag` to describe a meaningful object, then mount one scene HTML twin outside the canvas. The twin creates real DOM descriptions and buttons, so screen readers and keyboard users can reach the objects without simulated canvas controls.

This example exposes one selectable object and returns the cleanup function for the view that owns it:

```typescript
import { createSceneHtmlTwin, disposeSceneHtmlTwin, setAccessibilityTag } from "@babylonjs/lite";
import type { SceneContext, SceneNode } from "@babylonjs/lite";

export function mountAccessibleObject(scene: SceneContext, canvas: HTMLCanvasElement, mesh: SceneNode, onSelect: (selected: boolean) => void): () => void {
  const host = document.createElement("section");
  canvas.after(host);

  const previousTabIndex = canvas.getAttribute("tabindex");
  canvas.tabIndex = 0;

  let selected = false;
  const updateTag = (): void => {
    setAccessibilityTag(mesh, {
      name: "Select model",
      description: "Shows details for the model in the center of the scene.",
      aria: { "aria-pressed": selected },
      eventHandler: {
        click: () => {
          selected = !selected;
          onSelect(selected);
          updateTag();
        },
      },
    });
  };

  updateTag();
  const twin = createSceneHtmlTwin(scene, {
    parent: host,
    canvas,
    label: "Model viewer",
  });

  return () => {
    disposeSceneHtmlTwin(twin);
    setAccessibilityTag(mesh, null);
    host.remove();

    if (previousTabIndex === null) {
      canvas.removeAttribute("tabindex");
    } else {
      canvas.setAttribute("tabindex", previousTabIndex);
    }
  };
}
```

Tab reaches the generated button. Enter and Space activate its click handler. Focusing the button also draws a projected focus marker around the scene object when the object is within the camera view.

Tag only objects that help the user understand or operate the application. Decorative meshes should remain untagged. An untagged transform does not hide tagged descendants.

## Update or remove metadata

`setAccessibilityTag` copies and freezes the tag, its ARIA values, and its event-handler map. Replace the tag when a name, description, state, or callback changes. Mutating the original object does not update the HTML twin.

```typescript
import { getAccessibilityTag, setAccessibilityTag } from "@babylonjs/lite";

setAccessibilityTag(mesh, {
  ...(getAccessibilityTag(mesh) ?? {}),
  name: "Selected model",
  aria: { "aria-pressed": true },
});
```

Pass `null` to remove the object's generated description. Tagged descendants remain available. To remove one ARIA attribute while keeping the tag, omit the old key from the replacement map or set that key to `null`.

Use `hidden: true` to hide a semantic subtree. Use `disabled: true` to keep the subtree discoverable while preventing activation and removing its controls from the Tab order. Do not hide an object only because the camera clips it or another mesh covers it.

The scene binding observes normal scene additions, removals, parent changes, camera replacement, selected scalar changes, and tag replacement. It does not track every visual property or infer a description from the rendered image. After direct edits to scene arrays, call `updateSceneAccessibility(twin.accessibility)`.

## Use native controls

Use `createNativeControl` for controls that should behave like normal HTML buttons, checkboxes, radio buttons, ranges, text fields, selects, images, content, or groups.

```typescript
import { createNativeControl, disposeNativeControl, getSceneAnimationsEnabled, setSceneAnimationsEnabled } from "@babylonjs/lite";

const motion = createNativeControl({
  kind: "checkbox",
  label: "Animate scene",
  checked: getSceneAnimationsEnabled(scene),
  onChange: (enabled) => {
    setSceneAnimationsEnabled(scene, enabled);
  },
});

controlsHost.append(motion.element);

// When the controls are no longer needed:
disposeNativeControl(motion);
```

The browser owns keyboard editing, checked state, range values, radio grouping, and announcements. Update the real input when its state changes. Do not duplicate native form state in an accessibility tag's ARIA map.

## Host existing HTML

Use `createHtmlOverlay` when you already have a form or panel. The overlay moves the original element instead of copying it, so inputs, selection, application listeners, and dynamic children remain live.

```typescript
import { createHtmlOverlay, disposeHtmlOverlay } from "@babylonjs/lite";

const overlay = createHtmlOverlay({
  canvas,
  element: settingsForm,
  parent: controlsHost,
  label: "Viewer settings",
  mode: "panel",
});

// Restores settingsForm to its original position:
disposeHtmlOverlay(overlay);
```

Use `mode: "panel"` for normal document layout. Use `mode: "overlay"` for a fixed host aligned with the canvas's CSS bounds. Call `updateHtmlOverlay` after application CSS moves an overlay-mode canvas without causing a resize.

Mount twins and overlays outside the canvas and outside inert content. Preserve form ownership by moving the whole form, hosting inside the same form, or keeping a valid explicit `form` attribute.

## Manage focus and keyboard input

Keep the browser's normal Tab and Shift+Tab order. Use `tabIndex: 0` to add a generated description to the Tab order, or `tabIndex: -1` to allow only programmatic focus. Native Lite tags reject positive tab indices.

Use `setAccessibilityParent` when the semantic grouping should differ from the transform hierarchy. Use `focusHtmlTwinNode` with the node returned by `getAccessibilityNode` to move focus to a registered scene object.

Set `--lite-accessibility-focus-color` on the DOM host to change native focus outlines. Pass `focusBorder` to `createSceneHtmlTwin` to change the scene marker. Test both against the scene and in forced-colors mode.

Camera controls and sibling form controls must not compete for keys. Native controls retain browser behavior, and the HTML twin does not trap focus inside its region.

## Pause motion and control audio

`setSceneAnimationsEnabled` gates scene-owned animation groups. Use `bindAnimationManagerToScene(scene, manager)` to include an otherwise independent stopped animation manager. Call the returned function to detach it.

Pausing the gate retains animation time and playback intent. Resuming does not replay the disabled interval. Rendering, input, physics, ordinary callbacks, application-owned animation, and audio continue. If your application honors `prefers-reduced-motion`, apply that policy through the same gate.

Use labelled native buttons and ranges with `playSound`, `pauseSound`, `resumeSound`, and `setMasterVolume`. Mount the audio unlock button with a localized name and an error handler:

```typescript
import { createUnmuteUI, disposeUnmuteUI } from "@babylonjs/lite";

const unmute = createUnmuteUI(audioEngine, {
  parentElement: controlsHost,
  label: "Enable viewer audio",
  onError: (error) => {
    errorMessage.textContent = String(error);
  },
});

// Dispose before removing controlsHost:
disposeUnmuteUI(unmute);
```

The unmute control is a native button with a visible focus indicator. Audio playback still needs separate labelled controls when the user must play, pause, resume, mute, or change volume.

## Port existing Babylon.js accessibility

The `@babylonjs/lite-compat` package provides `Node.accessibilityTag` and `HTMLTwinRenderer.Render` for applications that still use the Babylon.js-shaped API:

```typescript
import { HTMLTwinRenderer } from "@babylonjs/lite-compat";

mesh.accessibilityTag = {
  description: "Select model",
  eventHandler: {
    click: () => {
      showDetails(mesh);
    },
  },
};

const renderer = HTMLTwinRenderer.Render(scene, {
  parentElement: controlsHost,
});

// Scene disposal also performs this cleanup:
renderer.dispose();
```

Explicit tag callbacks take precedence over inferred pick actions. Otherwise, the twin forwards supported primary and secondary pick triggers with the original DOM event.

Named `ActionManager` constants retain their meaning. If an application persists raw trigger numbers from an earlier Lite compat build, migrate pointer-over from 10 to 9, pointer-out from 11 to 10, and every-frame from 14 to 11. Key-down and key-up use 14 and 15. See the [Babylon Lite porting guide at the feature commit](https://github.com/alexchuber/Babylon-Lite/blob/07abf58783ab71e8082ed919c7a6bce02baf507e/docs/lite/03-porting-guide.md) for the wider compat migration.

## Know the boundaries

The accessibility feature has these platform boundaries:

- `createSceneAccessibility` and `createSceneHtmlTwin` require the native Lite scene model.
- Renderer-neutral tags, logical trees, DOM twins, controls, and overlays can be imported from `@babylonjs/lite` beside `@babylonjs/lite-gl`.
- Metadata and logical trees work without a browser document. DOM factories require a browser document and do not create a view for a headless renderer.
- Babylon GUI `Control`, `AdvancedDynamicTexture`, automatic GUI twins, and React rendering are not included. In compat, `addAllControls: true` throws.
- HTML texture content remains inert. `createHtmlOverlay` hosts separate live DOM; it does not provide textured-plane perspective, UV hit testing, `HtmlInteractionManager`, or `HtmlRaycastInteractionManager`.
- The APIs provide building blocks, not an automatic description of the scene and not a WCAG conformance guarantee.

For the full native API and lifecycle contracts, read [Add accessible scene controls at the feature commit](https://github.com/alexchuber/Babylon-Lite/blob/07abf58783ab71e8082ed919c7a6bce02baf507e/docs/lite/06-accessibility.md). For the class-based engine, read [Accessibility Scene Tree for Screen Readers](/toolsAndResources/accessibility/screenReaders).

## Test the experience

Test the application with real browser input and the screen readers you support:

1. Tab from before the canvas through the controls and out of the region. Repeat with Shift+Tab.
2. Activate buttons with Enter and Space. Test secondary actions with the context-menu key or Shift+F10.
3. Edit text, change ranges, and select radio and select options. Confirm that camera controls do not consume the same keys.
4. Change names and states, reparent a focused object, then hide or remove it. Confirm that focus remains useful.
5. Pause motion and audio independently, then resume both.
6. Test zoom, high contrast, forced colors, resize, disposal, and remounting.
7. Inspect names, descriptions, grouping, disabled state, and live updates with assistive technology.

Automated accessibility-tree and keyboard tests provide engineering evidence, but they do not replace testing with users or certify conformance. WCAG 2.2 is the current W3C Recommendation. [WCAG 3.0](https://www.w3.org/TR/wcag-3.0/) remains a Working Draft and can change.
