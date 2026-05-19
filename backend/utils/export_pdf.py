import io
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime 

import base64
from PIL import Image as PILImage
import numpy as np
def generate_pdf_report(obstacles: list, units: list, doctrinal_params: dict, terrain_stats: dict, map_image_base64: str = None) -> bytes:
    """
    Generate a PDF report of the tactical plan.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#4b5320'),  # Army green
        alignment=1,  # Center
        spaceAfter=20
    )
    elements.append(Paragraph("Tactical Obstacle Plan", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Doctrinal Parameters
    elements.append(Paragraph("Doctrinal Parameters", styles['Heading2']))
    doctrinal_data = [
        ["Parameter", "Value"],
        ["Target", doctrinal_params.get('target', 'N/A')],
        ["Effect", doctrinal_params.get('effect', 'N/A')],
        ["Relative Location", doctrinal_params.get('relativeLocation', 'N/A')],
        ["Mission", doctrinal_params.get('mission', 'N/A')],
        ["Troops", doctrinal_params.get('troops', 'N/A')],
        ["Time", doctrinal_params.get('time', 'N/A')],
        ["Civil Considerations", doctrinal_params.get('civil', 'N/A')],
    ]
    doctrinal_table = Table(doctrinal_data, colWidths=[2*inch, 3*inch])
    doctrinal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3f4f3f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#e0e0c0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#2e3b2e')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#5a5a3e'))
    ]))
    elements.append(doctrinal_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Terrain Statistics
    if terrain_stats:
        elements.append(Paragraph("Terrain Analysis", styles['Heading2']))
        terrain_data = [
            ["Mobility Class", "Percentage"],
            ["GO", f"{terrain_stats.get('GO', 0):.1f}%"],
            ["SLOW GO", f"{terrain_stats.get('SLOW GO', 0):.1f}%"],
            ["NO GO", f"{terrain_stats.get('NO GO', 0):.1f}%"],
        ]
        terrain_table = Table(terrain_data, colWidths=[2*inch, 2*inch])
        terrain_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3f4f3f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#e0e0c0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#5a5a3e'))
        ]))
        elements.append(terrain_table)
        elements.append(Spacer(1, 0.2*inch))
    
    # Obstacles
    elements.append(Paragraph(f"Obstacles ({len(obstacles)})", styles['Heading2']))
    if obstacles:
        obs_data = [["ID", "Type", "Radius (m)", "Lat", "Lng"]]
        for obs in obstacles[:20]:  # Limit to 20 for PDF readability
            obs_data.append([
                obs['id'][-8:],
                obs['typeName'],
                str(obs['radius']),
                f"{obs['lat']:.5f}",
                f"{obs['lng']:.5f}"
            ])
        if len(obstacles) > 20:
            obs_data.append(["...", f"{len(obstacles)-20} more", "", "", ""])
        
        obs_table = Table(obs_data, colWidths=[0.8*inch, 1.5*inch, 0.8*inch, 1.2*inch, 1.2*inch])
        obs_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3f4f3f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#e0e0c0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#5a5a3e'))
        ]))
        elements.append(obs_table)
    else:
        elements.append(Paragraph("No obstacles placed.", styles['Normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Units
    elements.append(Paragraph(f"Units ({len(units)})", styles['Heading2']))
    if units:
        unit_data = [["ID", "Type", "Affiliation", "Size", "HQ/TF"]]
        for unit in units[:20]:
            hq_tf = []
            if unit.get('modifiers', {}).get('headquarters'):
                hq_tf.append("HQ")
            if unit.get('modifiers', {}).get('taskForce'):
                hq_tf.append("TF")
            unit_data.append([
                unit['id'][-8:],
                unit.get('name', unit['typeCode']),
                unit['affiliation'],
                unit.get('echelon', 'none'),
                ", ".join(hq_tf) if hq_tf else "—"
            ])
        unit_table = Table(unit_data, colWidths=[0.8*inch, 1.2*inch, 1.0*inch, 0.8*inch, 1.0*inch])
        unit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3f4f3f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#e0e0c0')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#5a5a3e'))
        ]))
        elements.append(unit_table)
    else:
        elements.append(Paragraph("No units placed.", styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes