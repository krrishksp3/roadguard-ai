import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

from doc_helpers import (
    set_cell_background,
    set_cell_margins,
    set_table_borders,
    add_callout,
    format_row,
    add_custom_heading,
    add_body_p,
    add_bullet_p,
    add_code_block,
)

def render_section_1_to_7(doc):
    # SECTION 2: TABLE OF CONTENTS
    add_custom_heading(doc, "2. Table of Contents", level=1)
    
    toc_entries = [
        ("1. Cover Page & Project Overview", "1"),
        ("2. Table of Contents", "2"),
        ("3. Executive Summary", "3"),
        ("4. Problem Statement (SIH MB-04)", "4"),
        ("5. Existing System & Conventional Gaps", "5"),
        ("6. Proposed Solution – ROADGUARD AI", "7"),
        ("7. Core Engineering & Civic Objectives", "8"),
        ("8. Key Features & Implementation Matrix", "9"),
        ("9. User Roles & Access Control", "11"),
        ("10. End-to-End System Architecture", "12"),
        ("11. Comprehensive Technology Stack", "14"),
        ("12. Frontend Architecture (React, Vite, PWA, Leaflet)", "16"),
        ("13. Backend Architecture (Express, TypeScript, Prisma)", "19"),
        ("14. Relational Database Design (Prisma Data Models)", "22"),
        ("15. REST API Documentation & Endpoints", "26"),
        ("16. Authentication, Role Security & Data Protection", "30"),
        ("17. AI / Intelligence Module & Multi-Provider Architecture", "32"),
        ("18. Dynamic Road Risk Prioritization Engine", "34"),
        ("19. Duplicate Detection & Incident Spatial Clustering", "36"),
        ("20. Road Segment Health & Lifecycle Deterioration Tracking", "38"),
        ("21. AI-Assisted Repair Verification & Human-in-the-Loop Audit", "40"),
        ("22. Public Tender Intelligence & Contractor Accountability", "42"),
        ("23. Geospatial Intelligence & Interactive Mapping System", "44"),
        ("24. Progressive Web Application (PWA) & Offline Capability", "46"),
        ("25. End-to-End Civic Data Flow Pipeline", "48"),
        ("26. Complete User Journeys (Citizen & Municipal Authority)", "50"),
        ("27. Comprehensive User Interface & Screen Specifications", "52"),
        ("28. Meerut Regional Context & Authentic Demonstration Dataset", "56"),
        ("29. Deployment Architecture & Infrastructure Topology", "58"),
        ("30. Verification, Testing & Build Validation Matrix", "60"),
        ("31. System Performance, Scalability & Resilience", "62"),
        ("32. Multidimensional Feasibility Analysis", "64"),
        ("33. Socio-Economic Impact & Civic Value Proposition", "66"),
        ("34. Core Innovation & Key Differentiators (USP)", "68"),
        ("35. Technical Limitations & Operational Constraints", "70"),
        ("36. Future Roadmap & Advanced Research Enhancements", "71"),
        ("37. Concluding Engineering Evaluation", "73"),
        ("38. Academic Literature & Technical References", "74"),
        ("39. Technical Appendix (Repository Tree, Config & Environment)", "76"),
    ]
    
    tbl_toc = doc.add_table(rows=len(toc_entries) + 1, cols=2)
    tbl_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl_toc.autofit = False
    
    # Header
    hdr = tbl_toc.rows[0]
    hdr.cells[0].width = Inches(5.3)
    hdr.cells[1].width = Inches(1.2)
    hdr.cells[0].paragraphs[0].text = "Section Title / Document Chapter"
    hdr.cells[1].paragraphs[0].text = "Section No."
    format_row(hdr, is_header=True)
    
    for idx, (title, page) in enumerate(toc_entries):
        row = tbl_toc.rows[idx + 1]
        row.cells[0].width = Inches(5.3)
        row.cells[1].width = Inches(1.2)
        row.cells[0].paragraphs[0].text = title
        row.cells[1].paragraphs[0].text = page
        format_row(row, is_header=False, is_alt=(idx % 2 == 1))
        
    set_table_borders(tbl_toc, "CBD5E1")
    doc.add_page_break()

    # SECTION 3: EXECUTIVE SUMMARY
    add_custom_heading(doc, "3. Executive Summary", level=1)
    add_body_p(doc, "ROADGUARD AI is an advanced, production-grade civic intelligence and road asset management platform designed to solve the chronic road degradation, unsafe transit corridors, and fragmented grievance redressing mechanisms across Indian municipalities. Developed specifically for Smart India Hackathon (SIH) Internal Hackathon under Problem Statement MB-04 ('Smart Infrastructure & Logistics') by Team YuvaTech, the platform transitions municipal road maintenance from reactive, complaint-driven patching to predictive, evidence-based, and contractor-accountable lifecycle management.")
    
    add_body_p(doc, "Traditional civic grievance portals function as simple digital suggestion boxes. They suffer from complaint duplicates, unverified submissions, subjective severity ratings, absence of spatial clustering, and total disconnection from municipal public works contracts and Defect Liability Periods (DLP). ROADGUARD AI completely eliminates these structural gaps through an integrated six-stage technological pipeline:")
    
    add_bullet_p(doc, "Empowers citizens to capture photographic evidence, auto-harvest GPS coordinates, select damage classifications, and submit grievances with instant client-side AI image quality feedback.", bold_prefix="Mobile-First PWA Reporting: ")
    add_bullet_p(doc, "Ensures zero citizen report loss during connectivity blackouts via IndexedDB caching and background sync draining upon network re-establishment.", bold_prefix="Resilient Offline Synchronization: ")
    add_bullet_p(doc, "Employs an intelligent multi-provider architecture (supporting heuristic Indian Roads Congress rules, Google Gemini Vision, and OpenAI GPT-4o) to classify pavement distress (potholes, structural cracking, waterlogging, edge erosion) and assess collision hazard.", bold_prefix="Computer Vision Road Damage Analysis: ")
    add_bullet_p(doc, "Replaces raw citizen anger with an objective mathematical prioritization index (0–100) weighing Pavement Severity (25%), Direct Hazard (20%), Road Transit Importance (20%), Spatial Incident Density (15%), Historical Recurrence (10%), and SLA Urgency (10%).", bold_prefix="Dynamic 6-Factor Risk Prioritization Engine: ")
    add_bullet_p(doc, "Uses Haversine spatial calculations to identify co-located complaints within an 80-meter radius, merging repetitive submissions into a single municipal work order while escalating priority density scores within a 150-meter radius.", bold_prefix="Spatial Deduplication & Incident Clustering: ")
    add_bullet_p(doc, "Cross-references damage coordinates against active civil engineering tenders, surfacing contractor identities, defect liability warranty periods (DLP), and public expenditure details to prevent duplicate billing for under-warranty roads.", bold_prefix="Public Tender Intelligence & DLP Tracking: ")
    add_bullet_p(doc, "Enforces strict dual-photo proof where municipal engineers upload post-repair imagery evaluated by visual comparison algorithms before closing complaints.", bold_prefix="Before/After AI Repair Verification: ")

    add_callout(doc, "ROADGUARD AI is fully implemented in the current repository using React 18, Vite 6, Tailwind CSS, Leaflet, Node.js, Express, TypeScript, and Prisma ORM. It is calibrated with realistic geographic data from the Meerut municipal zone (Uttar Pradesh). To respect academic integrity, all demo records, simulated tenders, and heuristic analysis outputs are explicitly marked throughout this document.", title="FACTUAL COMPLIANCE & REPOSITORY CALIBRATION", box_type="info")

    # SECTION 4: PROBLEM STATEMENT (SIH MB-04)
    add_custom_heading(doc, "4. Problem Statement (SIH MB-04)", level=1)
    add_body_p(doc, "Road networks constitute the primary logistical backbone of economic mobility in India, facilitating over 85% of passenger transit and 70% of freight traffic. However, Indian urban roads suffer from severe structural premature degradation triggered by intense monsoon precipitation, inadequate drainage, excessive axle loading, poor compaction, and rapid asphalt binder oxidization.")
    
    add_body_p(doc, "According to official annual reports published by the Ministry of Road Transport and Highways (MoRTH), road accidents caused by potholes, severe road surface ruts, and unmaintained transit corridors claim thousands of innocent civilian lives annually and leave tens of thousands permanently incapacitated. Two-wheeler riders and non-motorized transport users bear the disproportionate brunt of this crisis.")
    
    add_body_p(doc, "In the context of Smart India Hackathon Problem Statement MB-04 ('Smart Infrastructure & Logistics'), the challenge is not merely detecting a pothole, but creating a transparent, accountable, and closed-loop civic infrastructure workflow. Municipalities currently struggle with:")
    
    add_bullet_p(doc, "Citizens abandon municipal portals because complaint forms are cumbersome, lack offline support, and provide zero visibility into repair progress.", bold_prefix="Fragmented & Disconnected Grievance Channels: ")
    add_bullet_p(doc, "Authorities receive hundreds of disparate complaints without automated risk scoring, causing critical arterial hazards to languish while low-traffic residential issues receive arbitrary attention.", bold_prefix="Lack of Explainable Prioritization: ")
    add_bullet_p(doc, "A single hazardous pothole on a major route can trigger dozens of separate complaints from different motorists, overwhelming field staff with duplicate paperwork.", bold_prefix="Duplicate Grievance Floods: ")
    add_bullet_p(doc, "Roads repaired under public contracts often deteriorate within months due to substandard execution. Because complaints are not mapped to tender contracts, public funds are repeatedly spent repairing roads that are still legally protected by contractor defect liability warranties.", bold_prefix="Contractor Immunity & Missing DLP Enforcement: ")
    add_bullet_p(doc, "Reports are routinely marked 'Resolved' on municipal portals without verifiable evidence, leading to widespread public distrust.", bold_prefix="Unverifiable 'Paper Resolutions': ")

    # SECTION 5: EXISTING SYSTEM / CURRENT CHALLENGES
    add_custom_heading(doc, "5. Existing System & Conventional Gaps", level=1)
    add_body_p(doc, "Civic bodies currently operate centralized citizen grievance portals such as CPGRAMS, state-level CM HelpLine systems (e.g., Jansunwai UP), municipal WhatsApp helplines, and Swachhata apps. While these systems represent commendable digital governance milestones, an objective technical analysis reveals distinct functional and structural bottlenecks:")
    
    gap_table = doc.add_table(rows=7, cols=3)
    gap_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    gap_table.autofit = False
    
    gaps_data = [
        ("Parameter", "Conventional Municipal System", "ROADGUARD AI Platform"),
        ("Grievance Routing", "Manual triage by municipal clerical staff based on user-typed text descriptions.", "Automated geospatial snapping to road segments and responsible department (PWD, Nagar Nigam, NHAI)."),
        ("Prioritization", "Static First-In-First-Out (FIFO) queue or subjective VIP escalation.", "Dynamic 6-Factor Risk Score (0-100) based on severity, hazard, traffic corridor, and SLA urgency."),
        ("Duplicate Handling", "No automated duplicate detection; multiple officers assigned to the same pothole.", "Automated Haversine spatial deduplication (<=80m) clustering identical incidents within 14 days."),
        ("Pavement Diagnostics", "None; relies on vague text ('bada gaddha hai').", "AI-assisted damage classification conforming to Indian Roads Congress (IRC:67 & IRC:SP:72) defect taxonomies."),
        ("Contractor Accountability", "Zero link between public works tenders, contractors, and citizen complaints.", "Public Tender Intelligence linking road segments to contractors and Defect Liability Periods (DLP)."),
        ("Repair Verification", "Self-certified text status update ('Work done') without photo verification.", "Compulsory dual-photo visual improvement comparison with AI match scoring and authority audit trail."),
    ]
    
    for idx, (col0, col1, col2) in enumerate(gaps_data):
        row = gap_table.rows[idx]
        row.cells[0].width = Inches(1.5)
        row.cells[1].width = Inches(2.5)
        row.cells[2].width = Inches(2.5)
        row.cells[0].paragraphs[0].text = col0
        row.cells[1].paragraphs[0].text = col1
        row.cells[2].paragraphs[0].text = col2
        format_row(row, is_header=(idx == 0), is_alt=(idx % 2 == 1 and idx > 0))
        
    set_table_borders(gap_table, "CBD5E1")
    add_body_p(doc, "", space_after=4)

    # SECTION 6: PROPOSED SOLUTION – ROADGUARD AI
    add_custom_heading(doc, "6. Proposed Solution – ROADGUARD AI", level=1)
    add_body_p(doc, "ROADGUARD AI introduces a cohesive, closed-loop civic intelligence architecture. It unifies citizens, municipal engineers, and public procurement records into a single transparent operational ecosystem. The platform enforces an unambiguous, verifiable lifecycle from initial distress capture to final maintenance sign-off:")
    
    add_code_block(doc, 
"""+---------------------------------------------------------------------------------------------------------+
|                                    ROADGUARD AI END-TO-END WORKFLOW                                     |
+---------------------------------------------------------------------------------------------------------+
  [Citizen] 
      │
      ├──> Live Camera / Photo Selection (Image Quality Pre-Check: Blur, Darkness, Road Visibility)
      ├──> Auto GPS Acquisition (Latitude, Longitude + Accuracy Snapping + Interactive Draggable Pin)
      └──> Damage Description & Damage Type Selection (Pothole, Crack, Surface, Edge, Drainage)
      │
      ▼
  [AI Road Damage Diagnostic Service]
      │
      ├──> Evaluates pavement failure classification & hazard severity (Low, Medium, High, Critical)
      ├──> Generates IRC-aligned remedial action recommendations (IRC:67, asphalt patch compaction)
      └──> Quantifies Direct Road Safety Collision Risk (0 - 100)
      │
      ▼
  [Geospatial Clustering & Deduplication Engine]
      │
      ├──> Haversine Proximity Check (<= 80m + matching damage type in past 14 days = DUPLICATE)
      └──> Radius Incident Density (<= 150m = Cluster Density Increment)
      │
      ▼
  [Dynamic Road Risk Prioritization Engine]
      │
      └──> Dynamic Score = 25% Severity + 20% Hazard + 20% Road Class + 15% Density + 10% Recur + 10% SLA
      │
      ▼
  [Administrative Jurisdiction & Tender Linkage]
      │
      ├──> Snaps coordinates to responsible administrative department (UP PWD, Nagar Nigam, NHAI)
      └──> Maps road segment to active/awarded Public Works Tender & Defect Liability Period (DLP)
      │
      ▼
  [Municipal Authority Operational Dashboard]
      │
      ├──> Prioritized Worklist ordered by Dynamic Risk Score (CRITICAL, HIGH, MEDIUM, LOW)
      ├──> SLA Countdown Monitoring (24h Critical, 48h High, 120h Medium, 240h Low)
      └──> Work Allocation & Field Dispatch to Contractor / Maintenance Crew
      │
      ▼
  [Physical Repair & Evidence Capture]
      │
      └──> Field Engineer uploads 'After-Repair' Photographic Evidence
      │
      ▼
  [AI-Assisted Repair Verification & Audit]
      │
      ├──> Computes Location Match Confidence & Visible Surface Improvement Score
      └──> Generates Recommendation (PASS / NEEDS_REINSPECTION / INCONCLUSIVE)
      │
      ▼
  [Executive Authority Final Sign-Off & Road Health Recalculation]
      │
      ├──> Executive Engineer approves closure or orders contractor re-inspection
      └──> Road Segment Health Score (0-100) and Chronic Hotspot Registry automatically updated
+---------------------------------------------------------------------------------------------------------+""")

    # SECTION 7: CORE OBJECTIVES
    add_custom_heading(doc, "7. Core Engineering & Civic Objectives", level=1)
    add_body_p(doc, "The ROADGUARD AI platform was engineered to satisfy eight measurable civic and technological objectives:")
    
    add_bullet_p(doc, "Provide a zero-friction, mobile-optimized progressive web application enabling citizens to report road hazards in under 30 seconds with automatic GPS geocoding and live optical quality feedback.", bold_prefix="1. Streamlined Citizen Participation: ")
    add_bullet_p(doc, "Replace subjective human triage with an explainable multi-factor algorithmic risk score that directs municipal resources to the most dangerous hazards first.", bold_prefix="2. Objective Hazard Prioritization: ")
    add_bullet_p(doc, "Eliminate redundant municipal work orders through automated spatial clustering, aggregating multi-citizen complaints into unified incident tickets.", bold_prefix="3. Automated Duplicate Mitigation: ")
    add_bullet_p(doc, "Cross-reference municipal grievances with public civil tenders, identifying roads under Defect Liability Periods to enforce contractor warranty rectifications without spending public funds.", bold_prefix="4. Public Procurement Accountability: ")
    add_bullet_p(doc, "Establish transparent, severity-calibrated Service Level Agreement (SLA) timers with visual overdue warnings to hold executive officers accountable.", bold_prefix="5. Enforced SLA Governance: ")
    add_bullet_p(doc, "Prevent fake complaint closures through dual-photo before/after visual verification analyzed by computer vision and signed off by authorized engineers.", bold_prefix="6. Evidence-Based Verification: ")
    add_bullet_p(doc, "Continuously compute a dynamic health index (0–100) for every arterial road, enabling city administrations to transition from reactive patching to scheduled preventive resurfacing.", bold_prefix="7. Preventive Road Asset Management: ")
    add_bullet_p(doc, "Ensure high platform usability in rural and low-bandwidth urban transit pockets via full offline IndexedDB draft storage and background sync.", bold_prefix="8. Inclusive Offline-First Architecture: ")

print("Section 1-7 renderer ready.")
