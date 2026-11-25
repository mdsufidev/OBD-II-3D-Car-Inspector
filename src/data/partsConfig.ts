export interface DiagnosticPID {
  code: string;
  label: string;
  value: string;
  unit?: string;
  status: 'nominal' | 'warning' | 'fault';
}

export interface CarPart {
  id: string;
  zoneNumber: string;
  name: string;
  system: string;
  ecuAddress: string;
  oemCode: string;
  isInternal: boolean;
  targetPosition: [number, number, number];
  cameraPosition: [number, number, number];
  hotspotPosition: [number, number, number];
  description: string;
  obdStatus: string;
  statusType: 'nominal' | 'warning' | 'fault';
  faultCodePlaceholder: string;
  pids: DiagnosticPID[];
  specs: { label: string; value: string }[];
}

// Default 3/4 lowered hero camera framing
export const DEFAULT_CAMERA_POS: [number, number, number] = [4.2, 1.68, 4.2];
export const DEFAULT_TARGET_POS: [number, number, number] = [0, 0.78, 0];

export const CAR_PARTS: CarPart[] = [
  {
    id: 'engine',
    zoneNumber: '01',
    name: '4.5L V8 F136 Powertrain',
    system: 'POWERTRAIN & COMBUSTION',
    ecuAddress: '0x7E8 (ECM)',
    oemCode: 'BOSCH MED17.3.1',
    isInternal: true,
    targetPosition: [0, 0.45, 0.55],
    cameraPosition: [1.75, 1.15, 1.65],
    hotspotPosition: [0, 0.72, 0.55],
    description: 'High-revving 90° naturally aspirated V8 with flat-plane crankshaft, gasoline direct injection (GDI), and dry sump scavenging.',
    obdStatus: 'SYSTEM NOMINAL // DTC 0',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0300',
    pids: [
      { code: 'PID 0x0C', label: 'Engine RPM', value: '0', unit: 'RPM', status: 'nominal' },
      { code: 'PID 0x05', label: 'Coolant Temp', value: '89.4', unit: '°C', status: 'nominal' },
      { code: 'PID 0x0B', label: 'MAP Sensor', value: '101.3', unit: 'kPa', status: 'nominal' },
      { code: 'PID 0x0E', label: 'Ignition Timing', value: '+12.0', unit: '°BTDC', status: 'nominal' },
    ],
    specs: [
      { label: 'Displacement', value: '4,497 cc' },
      { label: 'Compression', value: '12.5:1' },
      { label: 'Max Output', value: '562 HP @ 9,000' },
    ],
  },
  {
    id: 'battery',
    zoneNumber: '02',
    name: '12V Auxiliary Power Module',
    system: 'ELECTRICAL & POWER DISTRIBUTION',
    ecuAddress: '0x7E2 (BCM)',
    oemCode: 'OEM-AGM-800CCA',
    isInternal: true,
    targetPosition: [0.45, 0.48, -0.92],
    cameraPosition: [1.35, 1.12, -1.75],
    hotspotPosition: [0.45, 0.65, -0.92],
    description: 'Absorbent Glass Mat (AGM) power storage feeding high-pressure direct fuel pumps, ignition coils, and CAN-bus gateway controller.',
    obdStatus: 'SYSTEM NOMINAL // DTC 0',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0562',
    pids: [
      { code: 'PID 0x42', label: 'Control Voltage', value: '12.64', unit: 'V', status: 'nominal' },
      { code: 'PID 0x5B', label: 'State of Charge', value: '94.2', unit: '%', status: 'nominal' },
      { code: 'PID 0x5C', label: 'Alternator Load', value: '0.0', unit: '%', status: 'nominal' },
      { code: 'PID 0x1F', label: 'Bus Terminal 30', value: '12.58', unit: 'V', status: 'nominal' },
    ],
    specs: [
      { label: 'Technology', value: 'AGM Sealed' },
      { label: 'Capacity', value: '75 Ah' },
      { label: 'Cold Cranking', value: '800 CCA' },
    ],
  },
  {
    id: 'brakes',
    zoneNumber: '03',
    name: 'CCM-R Carbon-Ceramic Assembly',
    system: 'CHASSIS & BRAKING DYNAMICS',
    ecuAddress: '0x7B0 (ABS/ESC)',
    oemCode: 'BREMBO 6P-CCM',
    isInternal: false,
    targetPosition: [-0.85, 0.36, -1.15],
    cameraPosition: [-1.95, 0.52, -1.15],
    hotspotPosition: [-0.92, 0.40, -1.15],
    description: 'Front-left ventilated carbon-ceramic composite rotor with aluminum monobloc 6-piston fixed caliper and Hall-effect wheel speed sensor.',
    obdStatus: 'SYSTEM NOMINAL // DTC 0',
    statusType: 'nominal',
    faultCodePlaceholder: 'C0035',
    pids: [
      { code: 'PID 0x2B', label: 'Wheel Speed FL', value: '0.0', unit: 'km/h', status: 'nominal' },
      { code: 'PID 0x31', label: 'Brake Line Press', value: '0.8', unit: 'bar', status: 'nominal' },
      { code: 'PID 0x34', label: 'Pad Wear Ratio', value: '18.5', unit: '%', status: 'nominal' },
      { code: 'PID 0x38', label: 'Rotor Surface T', value: '24.2', unit: '°C', status: 'nominal' },
    ],
    specs: [
      { label: 'Rotor Size', value: '398 x 36 mm' },
      { label: 'Caliper Type', value: 'Monobloc 6-Piston' },
      { label: 'Material', value: 'Carbon-Silicon Carbide' },
    ],
  },
  {
    id: 'exhaust',
    zoneNumber: '04',
    name: 'Dual Catalytic & O2S System',
    system: 'EMISSIONS & EXHAUST PURIFICATION',
    ecuAddress: '0x7E8 (ECM-CAT)',
    oemCode: 'CAT-3WAY-O2S',
    isInternal: true,
    targetPosition: [0, 0.30, 1.85],
    cameraPosition: [0, 0.70, 3.10],
    hotspotPosition: [0, 0.38, 1.95],
    description: 'Close-coupled dual three-way metallic substrate catalytic converters with pre-cat wideband zirconia and post-cat switching oxygen sensors.',
    obdStatus: 'SYSTEM NOMINAL // DTC 0',
    statusType: 'nominal',
    faultCodePlaceholder: 'P0420',
    pids: [
      { code: 'PID 0x3C', label: 'Cat Temp B1S1', value: '642.0', unit: '°C', status: 'nominal' },
      { code: 'PID 0x3E', label: 'Cat Temp B2S1', value: '638.5', unit: '°C', status: 'nominal' },
      { code: 'PID 0x14', label: 'O2 Sensor B1S1', value: '0.725', unit: 'V', status: 'nominal' },
      { code: 'PID 0x15', label: 'O2 Sensor B2S1', value: '0.718', unit: 'V', status: 'nominal' },
    ],
    specs: [
      { label: 'Substrate', value: 'Metallic Matrix' },
      { label: 'Sensors', value: '4x Heated O2S' },
      { label: 'Emissions Standard', value: 'Euro 5 / LEV-II' },
    ],
  },
];

export const getPartById = (id: string | null): CarPart | undefined => {
  if (!id) return undefined;
  return CAR_PARTS.find((p) => p.id === id);
};
