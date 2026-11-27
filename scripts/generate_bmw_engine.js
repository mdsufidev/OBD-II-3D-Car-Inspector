/**
 * =============================================================================
 * PROCEDURAL BMW OEM INLINE ENGINE 3D GLB GENERATOR
 * =============================================================================
 * Generates an accurate, web-optimized 3D GLB model based on the BMW OEM
 * technical schematic (media_1795804142264_fcf2ff00.jpg).
 *
 * Output: public/engine.glb
 * Includes all 7 named OBD-II diagnostic sub-meshes:
 *   1. mesh_engine_block
 *   2. mesh_valve_cover
 *   3. mesh_ignition_rail (targets DTC P0300 Misfire)
 *   4. mesh_oil_housing (targets DTC P0524 Oil Pressure)
 *   5. mesh_dipstick_tube
 *   6. mesh_oil_pan
 *   7. mesh_crank_snout
 * =============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js GLTFExporter binary export
class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
}
globalThis.FileReader = NodeFileReader;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputPath = path.resolve(__dirname, '../public/engine.glb');

console.log('[Engine Generator] Building high-precision 3D BMW inline engine...');

// =============================================================================
// 1. OEM PBR MATERIALS SPECIFICATION
// =============================================================================
// A. Cast Aluminum Alloy (Engine Block, Cylinder Head, Oil Sump)
const matCastAlloy = new THREE.MeshStandardMaterial({
  name: 'Mat_OEM_Cast_Alloy',
  color: new THREE.Color('#CBD5E1'),
  metalness: 0.82,
  roughness: 0.46,
});

// B. Dark Cast Iron / Ribbed Core
const matCastIron = new THREE.MeshStandardMaterial({
  name: 'Mat_Cast_Iron_Core',
  color: new THREE.Color('#94A3B8'),
  metalness: 0.86,
  roughness: 0.52,
});

// C. Automotive Thermoplastic Composite (DOHC Valve Cover, Filter Cap)
const matCompositeCover = new THREE.MeshStandardMaterial({
  name: 'Mat_Composite_Valve_Cover',
  color: new THREE.Color('#1E293B'),
  metalness: 0.22,
  roughness: 0.58,
});

// D. Ignition Coil Pack Insulators & Connectors (Targets DTC P0300 Misfire)
const matIgnitionCoil = new THREE.MeshStandardMaterial({
  name: 'Mat_Ignition_Coil',
  color: new THREE.Color('#0F172A'),
  emissive: new THREE.Color('#000000'),
  emissiveIntensity: 0,
  metalness: 0.35,
  roughness: 0.42,
});

// E. Polished Steel & Machine Fasteners
const matSteel = new THREE.MeshStandardMaterial({
  name: 'Mat_Polished_Steel',
  color: new THREE.Color('#E2E8F0'),
  metalness: 0.94,
  roughness: 0.22,
});

// F. OEM High-Visibility Yellow (Dipstick Handle Loop)
const matDipstickYellow = new THREE.MeshStandardMaterial({
  name: 'Mat_Dipstick_Yellow',
  color: new THREE.Color('#F59E0B'),
  metalness: 0.1,
  roughness: 0.4,
});

// G. Rubber / Serpentine Drive Belt
const matRubberBelt = new THREE.MeshStandardMaterial({
  name: 'Mat_Serpentine_Belt',
  color: new THREE.Color('#0F172A'),
  metalness: 0.05,
  roughness: 0.85,
});

// =============================================================================
// 2. ROOT ENGINE SCENE & ASSEMBLY GROUPS
// =============================================================================
const engineRoot = new THREE.Group();
engineRoot.name = 'BMW_Inline_Engine_Assembly';

// -----------------------------------------------------------------------------
// SUB-MESH 1: ENGINE BLOCK WITH STRUCTURAL STIFFENING RIBS (mesh_engine_block)
// -----------------------------------------------------------------------------
const groupEngineBlock = new THREE.Group();
groupEngineBlock.name = 'mesh_engine_block';

// Main Cylinder Block Core
const blockCoreGeo = new THREE.BoxGeometry(0.36, 0.34, 0.54);
const blockCoreMesh = new THREE.Mesh(blockCoreGeo, matCastAlloy);
blockCoreMesh.position.set(0, 0.08, 0);
groupEngineBlock.add(blockCoreMesh);

// Cylinder Head Mid-Section
const headGeo = new THREE.BoxGeometry(0.35, 0.12, 0.55);
const headMesh = new THREE.Mesh(headGeo, matCastAlloy);
headMesh.position.set(0, 0.31, 0);
groupEngineBlock.add(headMesh);

// BMW Characteristic Structural Stiffening Rib Grid (Side Reinforcements)
for (let side of [-1, 1]) {
  const xPos = side * 0.185;

  // 4 Horizontal Stiffening Ribs
  for (let r = 0; r < 4; r++) {
    const yPos = -0.05 + r * 0.08;
    const hRibGeo = new THREE.BoxGeometry(0.014, 0.012, 0.50);
    const hRib = new THREE.Mesh(hRibGeo, matCastIron);
    hRib.position.set(xPos, yPos, 0);
    groupEngineBlock.add(hRib);
  }

  // 6 Vertical Stiffening Ribs (Between Cylinder Barrels)
  for (let c = 0; c < 6; c++) {
    const zPos = -0.22 + c * 0.088;
    const vRibGeo = new THREE.BoxGeometry(0.014, 0.28, 0.012);
    const vRib = new THREE.Mesh(vRibGeo, matCastIron);
    vRib.position.set(xPos, 0.07, zPos);
    groupEngineBlock.add(vRib);
  }
}

// 4 Cylinder Bank Barrel Outlines (Organic Cast Curvature)
for (let c = 0; c < 4; c++) {
  const zPos = -0.18 + c * 0.12;
  const cylinderBulgeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.30, 16);
  cylinderBulgeGeo.rotateZ(Math.PI / 2);

  const leftBulge = new THREE.Mesh(cylinderBulgeGeo, matCastAlloy);
  leftBulge.position.set(-0.13, 0.08, zPos);
  groupEngineBlock.add(leftBulge);

  const rightBulge = new THREE.Mesh(cylinderBulgeGeo, matCastAlloy);
  rightBulge.position.set(0.13, 0.08, zPos);
  groupEngineBlock.add(rightBulge);
}

// Rear Bellhousing Transmission Mount Flange (Flywheel Ring)
const bellhousingGeo = new THREE.CylinderGeometry(0.24, 0.25, 0.035, 32);
bellhousingGeo.rotateX(Math.PI / 2);
const bellhousingMesh = new THREE.Mesh(bellhousingGeo, matCastIron);
bellhousingMesh.position.set(0, 0.05, -0.285);
groupEngineBlock.add(bellhousingMesh);

// Starter Motor Cutout & Flange Pocket on Bellhousing
const starterPocketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.07, 16);
starterPocketGeo.rotateX(Math.PI / 2);
const starterPocket = new THREE.Mesh(starterPocketGeo, matCastIron);
starterPocket.position.set(0.15, -0.02, -0.28);
groupEngineBlock.add(starterPocket);

// Water Outlet Neck (Front Thermostat Flange)
const waterNeckGeo = new THREE.CylinderGeometry(0.03, 0.032, 0.09, 16);
waterNeckGeo.rotateX(Math.PI / 2);
const waterNeck = new THREE.Mesh(waterNeckGeo, matCastAlloy);
waterNeck.position.set(-0.08, 0.28, 0.30);
groupEngineBlock.add(waterNeck);

engineRoot.add(groupEngineBlock);

// -----------------------------------------------------------------------------
// SUB-MESH 2: SCULPTED DOHC VALVE COVER & OIL CAP (mesh_valve_cover)
// -----------------------------------------------------------------------------
const groupValveCover = new THREE.Group();
groupValveCover.name = 'mesh_valve_cover';

// Main Slanted Valve Cover Body (Slightly tilted forward like BMW M-Power engines)
const coverBaseGeo = new THREE.BoxGeometry(0.33, 0.07, 0.56);
const coverBase = new THREE.Mesh(coverBaseGeo, matCompositeCover);
coverBase.position.set(0, 0.40, 0);
coverBase.rotation.x = -0.035; // Characteristic forward rake
groupValveCover.add(coverBase);

// Dual Overhead Camshaft Humps (Left & Right Bulges along top)
for (let side of [-0.09, 0.09]) {
  const camHumpGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.54, 16);
  camHumpGeo.rotateX(Math.PI / 2);
  const camHump = new THREE.Mesh(camHumpGeo, matCompositeCover);
  camHump.position.set(side, 0.435, 0);
  camHump.rotation.x = -0.035;
  groupValveCover.add(camHump);
}

// Center Spark Plug / Ignition Coil Valley Channel
const valleyGeo = new THREE.BoxGeometry(0.09, 0.03, 0.50);
const valleyMesh = new THREE.Mesh(valleyGeo, matCompositeCover);
valleyMesh.position.set(0, 0.415, 0);
valleyMesh.rotation.x = -0.035;
groupValveCover.add(valleyMesh);

// OEM Oil Filler Neck & Cap (Front-Left)
const oilNeckGeo = new THREE.CylinderGeometry(0.04, 0.042, 0.045, 16);
const oilNeck = new THREE.Mesh(oilNeckGeo, matCompositeCover);
oilNeck.position.set(-0.095, 0.46, 0.19);
groupValveCover.add(oilNeck);

// Rectangular Oil Filler Cap with Top Grips
const oilCapGeo = new THREE.BoxGeometry(0.065, 0.02, 0.065);
const oilCap = new THREE.Mesh(oilCapGeo, matCompositeCover);
oilCap.position.set(-0.095, 0.485, 0.19);
groupValveCover.add(oilCap);

// Oil Cap Logo Ridge (Simulates oil can icon)
const oilLogoGeo = new THREE.BoxGeometry(0.04, 0.006, 0.02);
const oilLogo = new THREE.Mesh(oilLogoGeo, matSteel);
oilLogo.position.set(-0.095, 0.496, 0.19);
groupValveCover.add(oilLogo);

// Perimeter Valve Cover Fastener Bosses (10 Bolt heads around edge)
for (let i = 0; i < 5; i++) {
  const zPos = -0.24 + i * 0.12;
  for (let side of [-0.165, 0.165]) {
    const boltGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.018, 8);
    const bolt = new THREE.Mesh(boltGeo, matSteel);
    bolt.position.set(side, 0.435, zPos);
    groupValveCover.add(bolt);
  }
}

engineRoot.add(groupValveCover);

// -----------------------------------------------------------------------------
// SUB-MESH 3: 4X IGNITION COILS & HARNESS RAIL (mesh_ignition_rail)
// Targets DTC P0300 (Cylinder Misfire) with animated emissive warning glow!
// -----------------------------------------------------------------------------
const groupIgnitionRail = new THREE.Group();
groupIgnitionRail.name = 'mesh_ignition_rail';

// Wiring Harness Cable Conduit Channel
const conduitGeo = new THREE.BoxGeometry(0.025, 0.015, 0.48);
const conduit = new THREE.Mesh(conduitGeo, matIgnitionCoil);
conduit.position.set(0.025, 0.445, 0);
groupIgnitionRail.add(conduit);

// 4 Individual High-Voltage Ignition Coil Units
for (let c = 0; c < 4; c++) {
  const zPos = -0.18 + c * 0.12;

  // Coil Pack Head (Top square module)
  const coilHeadGeo = new THREE.BoxGeometry(0.042, 0.03, 0.042);
  const coilHead = new THREE.Mesh(coilHeadGeo, matIgnitionCoil);
  coilHead.position.set(0, 0.45, zPos);
  groupIgnitionRail.add(coilHead);

  // Electrical Harness 3-Pin Connector Plug
  const connectorGeo = new THREE.BoxGeometry(0.018, 0.016, 0.022);
  const connector = new THREE.Mesh(connectorGeo, matIgnitionCoil);
  connector.position.set(0.028, 0.45, zPos);
  groupIgnitionRail.add(connector);

  // Spark Plug Well Rubber Boot Stem (Descending into cylinder head)
  const bootStemGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.07, 12);
  const bootStem = new THREE.Mesh(bootStemGeo, matIgnitionCoil);
  bootStem.position.set(0, 0.395, zPos);
  groupIgnitionRail.add(bootStem);

  // Retention Torx Fastener
  const coilBoltGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 6);
  const coilBolt = new THREE.Mesh(coilBoltGeo, matSteel);
  coilBolt.position.set(-0.018, 0.468, zPos);
  groupIgnitionRail.add(coilBolt);
}

engineRoot.add(groupIgnitionRail);

// -----------------------------------------------------------------------------
// SUB-MESH 4: ANGLED OIL FILTER HOUSING & COOLER (mesh_oil_housing)
// Targets DTC P0524 (Engine Oil Pressure / Filter Sensor)
// -----------------------------------------------------------------------------
const groupOilHousing = new THREE.Group();
groupOilHousing.name = 'mesh_oil_housing';

// Base Mounting Bracket emerging from right front of block
const bracketGeo = new THREE.BoxGeometry(0.09, 0.09, 0.08);
const bracket = new THREE.Mesh(bracketGeo, matCastAlloy);
bracket.position.set(0.19, 0.10, 0.16);
groupOilHousing.add(bracket);

// Diagonal Filter Assembly Pivot Group (Tilted ~35° forward and ~20° right)
const filterPivot = new THREE.Group();
filterPivot.position.set(0.20, 0.12, 0.18);
filterPivot.rotation.set(-0.45, 0, -0.35);

// Main Cylindrical Oil Filter Canister Body
const canisterGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.15, 24);
const canister = new THREE.Mesh(canisterGeo, matCompositeCover);
canister.position.set(0, 0.075, 0);
filterPivot.add(canister);

// Hexagonal Top Cap for 27mm Service Socket
const hexNutGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.024, 6);
const hexNut = new THREE.Mesh(hexNutGeo, matCompositeCover);
hexNut.position.set(0, 0.162, 0);
filterPivot.add(hexNut);

// Oil Pressure Sensor Probe & Wiring Pigtail
const sensorGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 8);
sensorGeo.rotateZ(Math.PI / 2);
const sensor = new THREE.Mesh(sensorGeo, matSteel);
sensor.position.set(-0.04, 0.02, 0);
filterPivot.add(sensor);

groupOilHousing.add(filterPivot);
engineRoot.add(groupOilHousing);

// -----------------------------------------------------------------------------
// SUB-MESH 5: CURVED DIPSTICK TUBE & YELLOW PULL LOOP (mesh_dipstick_tube)
// -----------------------------------------------------------------------------
const groupDipstick = new THREE.Group();
groupDipstick.name = 'mesh_dipstick_tube';

// Create a realistic smooth sweeping 3D tube curve
const dipstickCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.18, -0.16, 0.08),  // Anchored in oil pan sump
  new THREE.Vector3(0.22, -0.06, 0.14),
  new THREE.Vector3(0.24, 0.08, 0.20),
  new THREE.Vector3(0.23, 0.22, 0.22),
  new THREE.Vector3(0.21, 0.36, 0.22),   // Rises to top of cylinder head
]);

const tubeGeo = new THREE.TubeGeometry(dipstickCurve, 24, 0.007, 10, false);
const tubeMesh = new THREE.Mesh(tubeGeo, matSteel);
groupDipstick.add(tubeMesh);

// Support Clamp Bracket to Engine Block
const clampGeo = new THREE.BoxGeometry(0.04, 0.012, 0.015);
const clamp = new THREE.Mesh(clampGeo, matSteel);
clamp.position.set(0.21, 0.15, 0.20);
groupDipstick.add(clamp);

// High-Visibility OEM Yellow Finger Pull Handle Loop
const handleLoopGeo = new THREE.TorusGeometry(0.022, 0.0055, 12, 24);
const handleLoop = new THREE.Mesh(handleLoopGeo, matDipstickYellow);
handleLoop.position.set(0.21, 0.385, 0.22);
handleLoop.rotation.y = Math.PI / 4;
groupDipstick.add(handleLoop);

engineRoot.add(groupDipstick);

// -----------------------------------------------------------------------------
// SUB-MESH 6: BOTTOM TAPERED OIL SUMP PAN (mesh_oil_pan)
// -----------------------------------------------------------------------------
const groupOilPan = new THREE.Group();
groupOilPan.name = 'mesh_oil_pan';

// Perimeter Gasket Flange
const panFlangeGeo = new THREE.BoxGeometry(0.36, 0.022, 0.54);
const panFlange = new THREE.Mesh(panFlangeGeo, matCastAlloy);
panFlange.position.set(0, -0.10, 0);
groupOilPan.add(panFlange);

// Deep Oil Reservoir Basin (Lower sump body with front bevel)
const panBodyGeo = new THREE.BoxGeometry(0.32, 0.14, 0.48);
const panBody = new THREE.Mesh(panBodyGeo, matCastIron);
panBody.position.set(0, -0.18, 0.02);
groupOilPan.add(panBody);

// Deep Sump Baffle (Deepest reservoir pocket)
const deepSumpGeo = new THREE.BoxGeometry(0.26, 0.07, 0.26);
const deepSump = new THREE.Mesh(deepSumpGeo, matCastIron);
deepSump.position.set(0, -0.27, -0.06);
groupOilPan.add(deepSump);

// Magnetic Drain Plug
const drainPlugGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.016, 6);
drainPlugGeo.rotateZ(Math.PI / 2);
const drainPlug = new THREE.Mesh(drainPlugGeo, matSteel);
drainPlug.position.set(0.135, -0.27, -0.06);
groupOilPan.add(drainPlug);

engineRoot.add(groupOilPan);

// -----------------------------------------------------------------------------
// SUB-MESH 7: FRONT PULLEYS & SERPENTINE BELT (mesh_crank_snout)
// -----------------------------------------------------------------------------
const groupCrankSnout = new THREE.Group();
groupCrankSnout.name = 'mesh_crank_snout';

// 1. Lower Crankshaft Harmonic Dampener Pulley
const crankPulleyGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.042, 32);
crankPulleyGeo.rotateX(Math.PI / 2);
const crankPulley = new THREE.Mesh(crankPulleyGeo, matSteel);
crankPulley.position.set(0, -0.05, 0.29);
groupCrankSnout.add(crankPulley);

// Central Crankshaft Snout Retaining Bolt
const centerBoltGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 6);
centerBoltGeo.rotateX(Math.PI / 2);
const centerBolt = new THREE.Mesh(centerBoltGeo, matSteel);
centerBolt.position.set(0, -0.05, 0.315);
groupCrankSnout.add(centerBolt);

// 2. Upper Water Pump Pulley
const waterPulleyGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.038, 28);
waterPulleyGeo.rotateX(Math.PI / 2);
const waterPulley = new THREE.Mesh(waterPulleyGeo, matSteel);
waterPulley.position.set(0, 0.16, 0.29);
groupCrankSnout.add(waterPulley);

// 3. Right-Side Alternator Pulley
const altPulleyGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.038, 24);
altPulleyGeo.rotateX(Math.PI / 2);
const altPulley = new THREE.Mesh(altPulleyGeo, matSteel);
altPulley.position.set(0.15, 0.08, 0.29);
groupCrankSnout.add(altPulley);

// 4. Belt Tensioner Idler Pulley
const idlerGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.035, 20);
idlerGeo.rotateX(Math.PI / 2);
const idler = new THREE.Mesh(idlerGeo, matSteel);
idler.position.set(-0.12, 0.06, 0.29);
groupCrankSnout.add(idler);

// 5. Serpentine Drive Belt Path (Continuous Looped Ribbon around Pulleys)
const beltPoints = [
  new THREE.Vector3(0, -0.138, 0.29),
  new THREE.Vector3(0.088, -0.05, 0.29),
  new THREE.Vector3(0.198, 0.08, 0.29),
  new THREE.Vector3(0.15, 0.128, 0.29),
  new THREE.Vector3(0, 0.228, 0.29),
  new THREE.Vector3(-0.158, 0.06, 0.29),
  new THREE.Vector3(-0.088, -0.05, 0.29),
];
const beltCurve = new THREE.CatmullRomCurve3(beltPoints, true);
const beltGeo = new THREE.TubeGeometry(beltCurve, 48, 0.008, 8, true);
const beltMesh = new THREE.Mesh(beltGeo, matRubberBelt);
groupCrankSnout.add(beltMesh);

engineRoot.add(groupCrankSnout);

// =============================================================================
// 3. EXPORT TO HIGH-FIDELITY WEB GLB
// =============================================================================
console.log('[Engine Generator] Converting scene to binary GLB...');

const exporter = new GLTFExporter();
exporter.parse(
  engineRoot,
  (glbBuffer) => {
    fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
    const fileSizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
    console.log(`[Engine Generator] Success! Wrote: ${outputPath} (${fileSizeKB} KB)`);
    console.log(`[Engine Generator] Diagnostic sub-meshes verified:`);
    engineRoot.children.forEach((child) => {
      console.log(`  - ${child.name} (${child.children.length} geometric parts)`);
    });
  },
  (error) => {
    console.error('[Engine Generator Error]', error);
    process.exit(1);
  },
  { binary: true }
);
