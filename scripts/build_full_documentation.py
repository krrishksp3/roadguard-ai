import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# Import generators
from generate_documentation import build_cover_page, add_header_footer
from doc_sections_part1 import render_section_1_to_7
from doc_sections_part1_b import render_section_8_to_15
from doc_sections_part2 import render_section_16_to_28
from doc_sections_part3 import render_section_29_to_39

def main():
    print("=================================================================")
    print("  ROADGUARD AI — COMPREHENSIVE PROJECT DOCUMENTATION GENERATOR   ")
    print("=================================================================")
    
    doc = Document()
    
    # Configure global styling and margins
    add_header_footer(doc)
    
    print("[1/5] Building Cover Page...")
    build_cover_page(doc)
    
    print("[2/5] Building Sections 2 to 7 (TOC, Exec Summary, Problem, Objectives)...")
    render_section_1_to_7(doc)
    
    print("[3/5] Building Sections 8 to 15 (Features, Roles, Arch, Stack, DB, APIs)...")
    render_section_8_to_15(doc)
    
    print("[4/5] Building Sections 16 to 28 (AI, Risk Engine, Health, PWA, UI)...")
    render_section_16_to_28(doc)
    
    print("[5/5] Building Sections 29 to 39 (Deployment, Tests, Impact, Roadmap)...")
    render_section_29_to_39(doc)
    
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "documentation"))
    os.makedirs(out_dir, exist_ok=True)
    
    docx_path = os.path.join(out_dir, "ROADGUARD_AI_Project_Documentation.docx")
    pdf_path = os.path.join(out_dir, "ROADGUARD_AI_Project_Documentation.pdf")
    
    print(f"\nSaving Word Document to:\n  {docx_path}")
    doc.save(docx_path)
    print(f"Successfully generated DOCX ({os.path.getsize(docx_path):,} bytes).")
    
    # Export to PDF via Microsoft Word COM
    print(f"\nInitiating native PDF conversion via Microsoft Word...")
    try:
        import win32com.client
        word = win32com.client.Dispatch('Word.Application')
        word.Visible = False
        doc_obj = word.Documents.Open(os.path.abspath(docx_path))
        
        # Update fields (TOC, page numbers)
        try:
            doc_obj.Fields.Update()
        except Exception as e_field:
            print(f"Note on field update: {e_field}")
            
        page_count = doc_obj.ComputeStatistics(2) # 2 = wdStatisticPages
        
        # Save as PDF (Format 17 = wdFormatPDF)
        doc_obj.SaveAs(os.path.abspath(pdf_path), FileFormat=17)
        doc_obj.Close()
        word.Quit()
        
        print(f"Successfully exported native PDF ({os.path.getsize(pdf_path):,} bytes)!")
        print(f"Total Document Pages Calculated by Word Engine: {page_count} pages.")
    except Exception as e:
        print(f"Warning: Word COM PDF export encountered an error: {e}")
        print("DOCX file is intact and ready.")

if __name__ == "__main__":
    main()
