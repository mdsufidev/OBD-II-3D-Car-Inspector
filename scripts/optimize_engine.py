"""
=============================================================================
BLENDER 3.x / 4.x ENGINE AUTOMATION & GLB OPTIMIZATION PIPELINE
=============================================================================
Usage in Blender:
  Method A (Headless CLI):
    blender --background --python scripts/optimize_engine.py -- input_engine.obj public/engine.glb

  Method B (Blender GUI):
    1. Open Blender.
    2. Switch to 'Scripting' workspace.
    3. Open this file and click 'Run Script' (Alt+P).
=============================================================================
"""

import bpy
import bmesh
import math
import sys
import os

# =============================================================================
# 1. CONFIGURATION CONSTANTS FOR WEB PERFORMANCE
# =============================================================================
TARGET_TOTAL_TRIS = 48000         # Maximum triangle budget for 60 FPS mobile WebGL
TARGET_ENGINE_HEIGHT_M = 0.72     # Real-world metric height for inline engine (meters)
EXPORT_FORMAT = 'GLB'

# Target sub-mesh names for OBD-II DTC diagnostic highlights
SUBMESH_TARGETS = {
    "IGNITION": "mesh_ignition_rail",      # Highlighted on DTC P0300 (Cylinder Misfire)
    "OIL_HOUSING": "mesh_oil_housing",    # Highlighted on DTC P0524 (Oil Pressure Fault)
    "DIPSTICK": "mesh_dipstick_tube",      # Fluid level check indicator
    "VALVE_COVER": "mesh_valve_cover",    # Cylinder head cover / PCV
    "ENGINE_BLOCK": "mesh_engine_block",  # Main crankcase and block
    "OIL_PAN": "mesh_oil_pan",            # Lower oil sump reservoir
    "CRANK_SNOUT": "mesh_crank_snout"     # Front crankshaft pulley mount
}


def clean_scene():
    """Removes all default lights, cameras, and cube objects from scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    print("[Pipeline] Scene cleared of default cameras, lights, and cubes.")


def create_oem_cast_aluminum_material():
    """Creates a high-fidelity PBR Cast Aluminum material for automotive studio lighting."""
    mat_name = "Mat_OEM_Engine_Alloy"
    if mat_name in bpy.data.materials:
        return bpy.data.materials[mat_name]

    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    # Output node
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_output.location = (400, 0)

    # Principled BSDF node
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.location = (0, 0)

    # Cast aluminum parameters
    node_bsdf.inputs['Base Color'].default_value = (0.79, 0.83, 0.88, 1.0)  # Light alloy (#CBD5E1)
    node_bsdf.inputs['Metallic'].default_value = 0.82                       # High metalness
    node_bsdf.inputs['Roughness'].default_value = 0.48                      # Matte cast texture

    mat.node_tree.links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    return mat


def create_ignition_accent_material():
    """Creates an insulated matte black composite material for ignition coil boots."""
    mat_name = "Mat_Ignition_Insulator"
    if mat_name in bpy.data.materials:
        return bpy.data.materials[mat_name]

    mat = bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.12, 0.14, 0.16, 1.0)  # Dark slate (#1E293B)
        bsdf.inputs['Metallic'].default_value = 0.15
        bsdf.inputs['Roughness'].default_value = 0.65
    return mat


def auto_categorize_and_name_meshes():
    """
    Analyzes mesh bounding box positions and dimensions to assign proper OEM diagnostic identifiers.
    Top -> Valve Cover & Ignition
    Middle Front -> Oil Filter Housing
    Bottom -> Oil Pan
    Core -> Engine Block
    """
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objects:
        print("[Pipeline Warning] No mesh objects found to categorize.")
        return

    print(f"[Pipeline] Analyzing {len(mesh_objects)} mesh component(s)...")

    # If single mesh, keep as master block
    if len(mesh_objects) == 1:
        mesh_objects[0].name = SUBMESH_TARGETS["ENGINE_BLOCK"]
        print(f"[Pipeline] Single mesh detected. Renamed to '{SUBMESH_TARGETS['ENGINE_BLOCK']}'.")
        return

    # Calculate overall scene bounding box
    min_z = min(obj.location.z for obj in mesh_objects)
    max_z = max(obj.location.z for obj in mesh_objects)
    height_span = max_z - min_z if (max_z - min_z) > 0.001 else 1.0

    for obj in mesh_objects:
        z_pct = (obj.location.z - min_z) / height_span
        dim = obj.dimensions
        vol = dim.x * dim.y * dim.z

        # 1. Filter out tiny internal hardware (bolts < 2cm)
        if vol < 0.000008:
            print(f"  [Auto-Strip] Deleting microscopic internal fastener: {obj.name}")
            bpy.data.objects.remove(obj, do_unlink=True)
            continue

        name_lower = obj.name.lower()

        # Heuristic tagging based on name or vertical position
        if any(k in name_lower for k in ['coil', 'spark', 'plug', 'ignition', 'rail']):
            obj.name = SUBMESH_TARGETS["IGNITION"]
        elif any(k in name_lower for k in ['filter', 'housing', 'cooler', 'oil_filter']):
            obj.name = SUBMESH_TARGETS["OIL_HOUSING"]
        elif any(k in name_lower for k in ['dipstick', 'stick', 'gauge', 'level']):
            obj.name = SUBMESH_TARGETS["DIPSTICK"]
        elif any(k in name_lower for k in ['pan', 'sump', 'oil_pan', 'bottom']):
            obj.name = SUBMESH_TARGETS["OIL_PAN"]
        elif any(k in name_lower for k in ['cover', 'valve', 'cam', 'cylinder_head']):
            obj.name = SUBMESH_TARGETS["VALVE_COVER"]
        elif any(k in name_lower for k in ['pulley', 'snout', 'balancer', 'crank_pulley']):
            obj.name = SUBMESH_TARGETS["CRANK_SNOUT"]
        elif z_pct > 0.78:
            obj.name = SUBMESH_TARGETS["VALVE_COVER"]
        elif z_pct < 0.18:
            obj.name = SUBMESH_TARGETS["OIL_PAN"]
        else:
            obj.name = SUBMESH_TARGETS["ENGINE_BLOCK"]

        print(f"  Tagged '{obj.name}' (Z-layer: {z_pct:.2f})")


def optimize_mesh_topology():
    """Applies Decimate modifier if triangle count exceeds target budget and adds WeightedNormal for crisp CAD shading."""
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    total_tris = sum(len(obj.data.polygons) * 2 for obj in mesh_objects)
    print(f"[Pipeline] Initial polygon count: ~{total_tris:,} triangles.")

    ratio = min(1.0, TARGET_TOTAL_TRIS / max(1, total_tris))

    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)

        # 1. Apply Decimation if polycount exceeds web limit
        if ratio < 0.95:
            dec_mod = obj.modifiers.new(name="Web_Decimate", type='DECIMATE')
            dec_mod.ratio = ratio
            bpy.ops.object.modifier_apply(modifier=dec_mod.name)

        # 2. Add Weighted Normal for crisp CAD hard-surface shading
        wn_mod = obj.modifiers.new(name="CAD_WeightedNormal", type='WEIGHTED_NORMAL')
        wn_mod.keep_sharp = True
        bpy.ops.object.modifier_apply(modifier=wn_mod.name)

        # 3. Enable smooth shading with auto-smooth angle (35 degrees)
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(35)

        obj.select_set(False)

    new_tris = sum(len(obj.data.polygons) * 2 for obj in bpy.context.scene.objects if obj.type == 'MESH')
    print(f"[Pipeline] Optimized polygon count: ~{new_tris:,} triangles (Target: {TARGET_TOTAL_TRIS:,}).")


def normalize_transforms():
    """Centers the engine at (0, 0, 0) and normalizes dimensions to metric standard."""
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objects:
        return

    # Select all and apply all transforms
    for obj in mesh_objects:
        obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # Calculate collective bounding box
    all_coords = [obj.matrix_world @ v.co for obj in mesh_objects for v in obj.data.vertices]
    if not all_coords:
        return

    min_x = min(c.x for c in all_coords)
    max_x = max(c.x for c in all_coords)
    min_y = min(c.y for c in all_coords)
    max_y = max(c.y for c in all_coords)
    min_z = min(c.z for c in all_coords)
    max_z = max(c.z for c in all_coords)

    center = (
        (min_x + max_x) / 2.0,
        (min_y + max_y) / 2.0,
        min_z + (max_z - min_z) * 0.45  # Center at crankshaft centerline height
    )

    for obj in mesh_objects:
        obj.location.x -= center[0]
        obj.location.y -= center[1]
        obj.location.z -= center[2]

    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    print(f"[Pipeline] Model centered at (0, 0, 0) crankshaft origin.")


def apply_pbr_materials():
    """Assigns high-performance PBR alloy and insulator materials."""
    mat_alloy = create_oem_cast_aluminum_material()
    mat_ignition = create_ignition_accent_material()

    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            obj.data.materials.clear()
            if "ignition" in obj.name.lower():
                obj.data.materials.append(mat_ignition)
            else:
                obj.data.materials.append(mat_alloy)


def export_glb(output_path):
    """Exports the optimized scene to binary .glb with +Y Up orientation."""
    for obj in bpy.context.scene.objects:
        obj.select_set(True)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_tangents=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False
    )
    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[Pipeline Complete] Exported: {output_path} ({file_size_mb:.2f} MB)")


def main():
    clean_scene()

    # Parse arguments if invoked via CLI
    input_file = None
    output_file = os.path.join(os.path.dirname(__file__), "..", "public", "engine.glb")

    args = sys.argv
    if "--" in args:
        idx = args.index("--")
        cli_args = args[idx + 1:]
        if len(cli_args) >= 1:
            input_file = cli_args[0]
        if len(cli_args) >= 2:
            output_file = cli_args[1]

    if input_file and os.path.exists(input_file):
        ext = os.path.splitext(input_file)[1].lower()
        print(f"[Pipeline] Importing: {input_file} ({ext})...")
        if ext == '.obj':
            bpy.ops.wm.obj_import(filepath=input_file)
        elif ext == '.fbx':
            bpy.ops.import_scene.fbx(filepath=input_file)
        elif ext in ['.gltf', '.glb']:
            bpy.ops.import_scene.gltf(filepath=input_file)
        elif ext == '.stl':
            bpy.ops.wm.stl_import(filepath=input_file)
        else:
            print(f"[Pipeline Error] Unsupported format {ext}. Use OBJ, FBX, GLB, or STL.")
            return

    auto_categorize_and_name_meshes()
    optimize_mesh_topology()
    normalize_transforms()
    apply_pbr_materials()
    export_glb(output_file)


if __name__ == "__main__":
    main()
