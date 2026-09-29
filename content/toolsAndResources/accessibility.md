---
title: Accessibility
image:
description: Accessibility guidance for Babylon.js and Babylon Lite applications
keywords: babylon.js, babylon lite, tools, resources, accessibility, a11y
further-reading:
video-overview:
video-content:
---

Babylon.js applications render visual content inside a canvas, so you must expose the meaningful parts of the experience through HTML, keyboard input, and assistive-technology semantics.

Choose the guide that matches your engine:

- [Support screen readers and keyboard navigation in Babylon.js](/toolsAndResources/accessibility/screenReaders) with accessibility tags and `HTMLTwinRenderer`.
- [Add accessible controls to Babylon Lite](/toolsAndResources/accessibility/babylonLite) with plain-data tags, semantic HTML twins, native browser controls, live DOM overlays, and motion and audio hooks.

The Babylon Lite guide covers development APIs from [alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2), not a published `@babylonjs/lite` release.

These APIs help you build an accessible experience, but they do not certify conformance with the [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/). Test the complete application with your target browsers, keyboards, screen readers, zoom settings, contrast modes, and input methods.
