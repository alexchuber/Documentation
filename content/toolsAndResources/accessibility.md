---
title: Accessibility
image:
description: Accessibility guidance for Babylon.js and Babylon Lite applications
keywords: babylon.js, babylon lite, tools, resources, accessibility, a11y
further-reading:
video-overview:
video-content:
---

Babylon.js and Babylon Lite applications render visual content inside a canvas. A screen reader cannot discover meaningful scene objects unless the application also exposes them through HTML.

Choose the guide that matches your engine:

- [Support screen readers and keyboard navigation in Babylon.js](/toolsAndResources/accessibility/screenReaders) with accessibility tags and `HTMLTwinRenderer`.
- [Describe Babylon Lite scenes for screen readers](/toolsAndResources/accessibility/babylonLite) with accessibility tags and a passive semantic HTML representation.

The Babylon Lite guide covers development APIs from [alexchuber/Babylon-Lite#2](https://github.com/alexchuber/Babylon-Lite/pull/2), not a published `@babylonjs/lite` release.

These APIs help you expose scene information, but they do not certify conformance with the [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/). Test the complete application with your target browsers and screen readers.
