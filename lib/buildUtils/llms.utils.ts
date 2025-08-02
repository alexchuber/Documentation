import { writeFileSync, mkdirSync } from "fs";
import { sep, join, resolve, dirname } from "path";

const llmstxtHeader = `
# Babylon.js

> Babylon.js is a powerful, beautiful, simple, and open game and rendering engine packed into a friendly TypeScript library for creating rich 3D experiences in web browsers.

Key Features:
- Scene Management: Multiple canvases, offscreen rendering, optimization
- Meshes & Geometry: Primitive shapes, CSG operations, mesh manipulation
- Materials & Textures: PBR materials, shaders, procedural textures
- Lighting: Various light types, shadows, global illumination
- Cameras: Arc rotate, free camera, VR cameras
- Animation: Keyframe animation, skeletal animation, morph targets
- Physics: Havok, Cannon.js, Ammo.js integration
- Audio: 3D spatial audio, music playback, microphone input
- Particles: GPU particles, particle systems, effects
- GUI System: 2D and 3D user interfaces
- WebGPU Support: Next-generation graphics API
- WebXR: Virtual and Augmented Reality
- Post-Processing: Screen effects, render pipelines
- Custom Shaders: GLSL programming, node materials
- Babylon Viewer: Embeddable 3D model viewer HTML component
- File formats: glTF, OBJ, STL, Babylon (.babylon), PNG, JPG, DDS, KTX, WEBP, MP3, WAV, OGG, M4A
- Cross-platform: Babylon Native library for native applications
`;

const basePath = join(process.cwd(), `.${sep}public`);
const hostPath = `https://doc.babylonjs.com`;

const llmsTxtCache: { [key: string]: string[] } = {};
const mdCache = [];
let timeout: NodeJS.Timeout;

const debounceEvent = (callback, time) => {
    let interval;
    return (...args) => {
        clearTimeout(interval);
        interval = setTimeout(() => {
            interval = null;
            callback(...args);
        }, time);
    };
};

export const addToLlms = (url: string, content: string, metadata: any) => {
    // Categorize for llms.txt
    const section = metadata.llmstxtSection ?? "optional";
    if (section !== "none") {
        const hostedUrl = `${hostPath}${url}/index.html.md`;
        llmsTxtCache[section] ??= [];
        llmsTxtCache[section].push(`- [${metadata.title}](${hostedUrl}) - ${metadata.description}`);
    }

    // Track markdown files to write
    mdCache.push({
        url,
        content
    });

    if (timeout) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
        writeMarkdownFiles();
        writeLlmstxt();
        mdCache.length = 0;
        // Don't clear llmsTxtCache here, as we might need to rewrite full file if we're lazy loading pages like in dev environment
    }, 10);
};

const writeMarkdownFiles = () => {
    mdCache.forEach(({url, content}) => {
        try {
            // Convert URL to file path: /features/audio -> /features/audio/index.html.md
            const markdownPath = join(basePath, url, "index.html.md");
            const markdownDir = dirname(markdownPath);
            
            mkdirSync(markdownDir, { recursive: true });
            writeFileSync(markdownPath, content, { encoding: "utf-8" });
            
            console.log(`Created markdown file: ${markdownPath}`);
        } catch (e) {
            console.error(`Error creating markdown file for ${url}:`, e);
        }
    });
};

export const writeLlmstxt = debounceEvent(() => {
    const llmsTxtFile = resolve(basePath, `llms.txt`);

    // Order sections for consistency with other llms.txt implementations
    const order = {
        "docs": 1,
        "optional": 3,
    };
    const getOrder = (key: string): number => order[key] || 2;
    const sections = Object.keys(llmsTxtCache).sort((a, b) => {
        return getOrder(a) - getOrder(b);
    });

    // Built the llms.txt content
    const content = sections
        .map((name) => {
            const sectionContent = llmsTxtCache[name].join("\n");
            const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
            return `## ${capitalizedName}\n\n${sectionContent}`;
        })
        .join("\n\n");

    const fullContent = `${llmstxtHeader}\n\n${content}`;

    try {
        writeFileSync(llmsTxtFile, fullContent, { encoding: "utf-8" });
        console.log(`Created llms.txt file: ${llmsTxtFile} with ${sections.length} sections`);
    } catch (e) {
        console.error(`Error creating llms.txt file:`, e);
    }
}, 100);
