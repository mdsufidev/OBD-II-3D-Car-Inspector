export interface CarPart {
  id: string;
  name: string;
  system: string;
  isInternal: boolean;
  targetPosition: [number, number, number];
  cameraPosition: [number, number, number];
  hotspotPosition: [number, number, number];
  description: string;
  obdStatus: string;
  statusType: 'nominal' | 'warning' | 'fault';
  faultCodePlaceholder?: string;
  specs: { label: string; value: string }[];
}

// Default 3/4 lowered hero camera framing
export const DEFAULT_CAMERA_POS: [number, number, number] = [4.2, 1.68, 4.2];
export const DEFAULT_TARGET_POS: [number, number, number] = [0, 0.78, 0];

export const CAR_PARTS: CarPart[] = [
  {
    id: 'engine',
    name: '4.5L V8 Engine Block',
    system: 'Powertrain & Combustion',
    isInternal: true,
    targetPosition: [0, 0.45, 0.55],
    cameraPosition: [1.75, 1.15, 1.65],
    hotspotPosition: [0, 0.75, 0.55],
    description: 'High-revving naturally aspirated 90° V8 with direct injection, dual overhead camshafts, and dry sump lubrication.',
    obdStatus: 'Ready for OBD-II Scan',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0300',
    specs: [
      { label: 'Displacement', value: '4,497 cc' },
      { label: 'Configuration', value: '90° V8' },
      { label: 'Redline', value: '9,000 RPM' },
    ],
  },
  {
    id: 'battery',
    name: '12V Auxiliary / Power Module',
    system: 'Electrical & Power Distribution',
    isInternal: true,
    targetPosition: [0.45, 0.48, -0.92],
    cameraPosition: [1.35, 1.12, -1.75],
    hotspotPosition: [0.45, 0.68, -0.92],
    description: 'High-amperage AGM battery powering ignition coils, fuel delivery modules, and electronic control units (ECU).',
    obdStatus: 'Ready for OBD-II Scan',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0562',
    specs: [
      { label: 'Voltage', value: '12.6 V DC' },
      { label: 'Capacity', value: '75 Ah' },
      { label: 'CCA', value: '800 A' },
    ],
  },
  {
    id: 'brakes',
    name: 'Front-Left Brake Assembly',
    system: 'Chassis & Braking Dynamics',
    isInternal: false,
    targetPosition: [-0.85, 0.36, -1.15],
    cameraPosition: [-1.95, 0.52, -1.15],
    hotspotPosition: [-0.92, 0.42, -1.15],
    description: 'Cross-drilled carbon-ceramic brake rotor coupled with a Brembo monobloc 6-piston aluminum caliper and ABS sensor.',
    obdStatus: 'Ready for OBD-II Scan',
    statusType: 'nominal',
    faultCodePlaceholder: 'C0035',
    specs: [
      { label: 'Rotor Type', value: 'Carbon-Ceramic' },
      { label: 'Diameter', value: '398 mm' },
      { label: 'Caliper', value: '6-Piston Monobloc' },
    ],
  },
  {
    id: 'exhaust',
    name: 'Exhaust & Catalytic System',
    system: 'Emissions & Exhaust Manifold',
    isInternal: true,
    targetPosition: [0, 0.30, 1.85],
    cameraPosition: [0, 0.70, 3.10],
    hotspotPosition: [0, 0.42, 1.95],
    description: 'Dual close-coupled 3-way catalytic converters with heated upstream and downstream oxygen sensors (O2S) and triple exhaust outlets.',
    obdStatus: 'Ready for OBD-II Scan',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0420',
    specs: [
      { label: 'Catalyst Type', value: 'Dual 3-Way Ceramic' },
      { label: 'Sensors', value: '4x Heated O2S' },
      { label: 'Outlets', value: 'Triple Center Exit' },
    ],
  },
];

export const getPartById = (id: string | null): CarPart | undefined => {
  if (!id) return undefined;
  return CAR_PARTS.find((p) => p.id === id);
};
