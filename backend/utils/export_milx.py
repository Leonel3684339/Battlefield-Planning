import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime

def generate_milx(obstacles: list, units: list, doctrinal_params: dict, scenario_name: str = "Tactical Plan") -> str:
    """
    Generate MILX (Military XML) format.
    This is a simplified version – real MILX has complex schemas.
    """
    root = ET.Element("MILX")
    root.set("xmlns", "http://www.milstd.org/milx/1.0")
    root.set("version", "1.0")
    
    # Header
    header = ET.SubElement(root, "Header")
    ET.SubElement(header, "Name").text = scenario_name
    ET.SubElement(header, "Time").text = datetime.now().isoformat()
    ET.SubElement(header, "Author").text = "SCOS Planner"
    
    # Doctrinal Parameters
    params = ET.SubElement(root, "DoctrinalParameters")
    for key, value in doctrinal_params.items():
        ET.SubElement(params, key.capitalize()).text = str(value)
    
    # Obstacles
    obs_elem = ET.SubElement(root, "Obstacles")
    for obs in obstacles:
        o = ET.SubElement(obs_elem, "Obstacle")
        o.set("id", obs['id'])
        ET.SubElement(o, "Type").text = obs.get('typeName', obs['typeCode'])
        ET.SubElement(o, "TypeCode").text = obs['typeCode']
        ET.SubElement(o, "Latitude").text = str(obs['lat'])
        ET.SubElement(o, "Longitude").text = str(obs['lng'])
        ET.SubElement(o, "Radius").text = str(obs['radius'])
    
    # Units
    units_elem = ET.SubElement(root, "Units")
    for unit in units:
        u = ET.SubElement(units_elem, "Unit")
        u.set("id", unit['id'])
        ET.SubElement(u, "Type").text = unit.get('name', unit['typeCode'])
        ET.SubElement(u, "TypeCode").text = unit['typeCode']
        ET.SubElement(u, "Affiliation").text = unit['affiliation']
        ET.SubElement(u, "Latitude").text = str(unit['lat'])
        ET.SubElement(u, "Longitude").text = str(unit['lng'])
        if unit.get('echelon') and unit['echelon'] != 'none':
            ET.SubElement(u, "Echelon").text = unit['echelon']
        if unit.get('modifiers'):
            mods = ET.SubElement(u, "Modifiers")
            if unit['modifiers'].get('headquarters'):
                ET.SubElement(mods, "Headquarters").text = "true"
            if unit['modifiers'].get('taskForce'):
                ET.SubElement(mods, "TaskForce").text = "true"
    
    # Pretty print
    rough_string = ET.tostring(root, encoding='utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")