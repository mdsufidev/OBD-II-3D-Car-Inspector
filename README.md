# OBD-II-3D-Car-Inspector

A 100% client-side, interactive **OBD-II 3D Automotive Showroom & Diagnostic Inspector** built with React, Three.js, React Three Fiber (R3F), and Tailwind CSS.

## 🚀 Key Features
- **2-Model 3D Architecture:** Loads a high-detail real sports car model (`/car.glb`) and an internal engine assembly (`/engine.glb`).
- **Transparent X-Ray Car Mode (Default):** The outer car body panels use a transparent automotive glass shader (`transmission: 0.85, opacity: 0.22, depthWrite: false`) so the engine and internal mechanics are visible from every 360° angle.
- **OBD-II Fault Simulation (P0300 Misfire):** One-click toggle to simulate a live diagnostic trouble code (DTC). Pulses the engine with a red emissive glow (`#EF4444`) and renders a floating 3D HTML annotation badge.
- **Inspect Engine Mode:** Hides the car, isolates the engine at showroom center, and smoothly animates the camera in for close-up component inspection.
- **Zero-Scroll Viewport:** Rigid single-screen touch lock (`100vw x 100dvh`) without vertical/horizontal overflow or mobile bounce.

## 🛠️ Tech Stack
- **Framework:** React 18 + Vite 6 + TypeScript
- **3D Graphics:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## 📦 Installation & Local Run
```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
npm run preview
```
