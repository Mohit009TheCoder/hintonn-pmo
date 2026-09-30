#!/usr/bin/env python3
"""Generate Hintonn AI Daily Working Report PDF with the official logo."""
import re
from datetime import date
from PIL import Image as PILImage
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    Image, HRFlowable, PageBreak, KeepTogether
)

# ---- Brand colors (NeLabs / Hintonn AI, LIGHT-first) ----
BRAND_BLUE = colors.HexColor("#2563EB")     # action/system
BRAND_VIOLET = colors.HexColor("#9333EA")   # AI accent
BRAND_LIGHT_BLUE = colors.HexColor("#1683FF")
INK = colors.HexColor("#111827")
MUTED = colors.HexColor("#4B5563")
LINE = colors.HexColor("#D1D5DB")
BG_SOFT = colors.HexColor("#EFF6FF")        # light blue tint
BG_SOFT2 = colors.HexColor("#F5F3FF")       # light violet tint
ROW_ALT = colors.HexColor("#F9FAFB")
WHITE = colors.white

LOGO_PATH = "/Users/mohitjain/Desktop/HINTONN PMO/assets/hintonn-official-logo-transparent.png"
OUT_DIR = "/Users/mohitjain/Desktop/HINTONN PMO"
OUT_NAME = "Hintonn-AI-Daily-Working-Report-30-Sep-2026.pdf"
OUT_PATH = f"{OUT_DIR}/{OUT_NAME}"
REPORT_DATE = "30 September 2026"


def sanitize(text):
    replacements = {
        '\U0001f534': '', '\U0001f464': '', '\u2699\ufe0f': '', '\u2699': '',
        '\U0001f50d': '', '\ufe0f': '', '\u200b': '',
        '\u20b9': 'Rs ', '\u2192': ' -> ', '\u25b8': '\u2022',
        '\u2013': '-', '\u2014': '-', '\u00b7': '-',
        '\u2122': '', '\u00a9': '(c)', '\u00ae': '(r)',
        '\u2713': 'OK', '\u2714': 'OK', '\u25cf': '-',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    text = text.encode('cp1252', errors='replace').decode('cp1252')
    text = re.sub(r'[\ufffd]+', '', text)
    return text


def logo_flowable(max_w, max_h):
    img = PILImage.open(LOGO_PATH)
    w, h = img.size
    ratio = w / h
    width = max_w
    height = width / ratio
    if height > max_h:
        height = max_h
        width = height * ratio
    return Image(LOGO_PATH, width=width, height=height)


def build_styles():
    ss = getSampleStyleSheet()
    styles = {
        'cover_title': ParagraphStyle(
            'CoverTitle', parent=ss['Title'], fontName='Helvetica-Bold',
            fontSize=26, leading=32, textColor=INK, alignment=TA_CENTER,
            spaceAfter=6,
        ),
        'cover_sub': ParagraphStyle(
            'CoverSub', parent=ss['Normal'], fontName='Helvetica',
            fontSize=13.5, leading=18, textColor=BRAND_BLUE,
            alignment=TA_CENTER, spaceAfter=4,
        ),
        'cover_meta': ParagraphStyle(
            'CoverMeta', parent=ss['Normal'], fontName='Helvetica',
            fontSize=10.5, leading=15, textColor=MUTED, alignment=TA_CENTER,
        ),
        'h1': ParagraphStyle(
            'H1', parent=ss['Heading1'], fontName='Helvetica-Bold',
            fontSize=16, leading=20, textColor=INK, spaceBefore=2,
            spaceAfter=8,
        ),
        'h2': ParagraphStyle(
            'H2', parent=ss['Heading2'], fontName='Helvetica-Bold',
            fontSize=12.5, leading=16, textColor=BRAND_BLUE,
            spaceBefore=10, spaceAfter=4,
        ),
        'h3': ParagraphStyle(
            'H3', parent=ss['Heading3'], fontName='Helvetica-Bold',
            fontSize=11, leading=14, textColor=INK, spaceBefore=6, spaceAfter=3,
        ),
        'body': ParagraphStyle(
            'Body', parent=ss['BodyText'], fontName='Helvetica',
            fontSize=10, leading=14.5, textColor=INK, alignment=TA_JUSTIFY,
            spaceAfter=6,
        ),
        'bullet': ParagraphStyle(
            'Bullet', parent=ss['BodyText'], fontName='Helvetica',
            fontSize=10, leading=14.2, textColor=INK, leftIndent=12,
            bulletIndent=2, spaceAfter=3,
        ),
        'cell': ParagraphStyle(
            'Cell', parent=ss['BodyText'], fontName='Helvetica',
            fontSize=9.2, leading=12.6, textColor=INK,
        ),
        'cell_bold': ParagraphStyle(
            'CellBold', parent=ss['BodyText'], fontName='Helvetica-Bold',
            fontSize=9.2, leading=12.6, textColor=INK,
        ),
        'cell_head': ParagraphStyle(
            'CellHead', parent=ss['BodyText'], fontName='Helvetica-Bold',
            fontSize=9.4, leading=12.6, textColor=WHITE,
        ),
        'cell_head_dark': ParagraphStyle(
            'CellHeadDark', parent=ss['BodyText'], fontName='Helvetica-Bold',
            fontSize=9.4, leading=12.6, textColor=BRAND_BLUE,
        ),
        'footer': ParagraphStyle(
            'Footer', parent=ss['Normal'], fontName='Helvetica',
            fontSize=8.5, textColor=MUTED, alignment=TA_CENTER,
        ),
        'note': ParagraphStyle(
            'Note', parent=ss['BodyText'], fontName='Helvetica',
            fontSize=10, leading=14.2, textColor=INK, leftIndent=8,
            rightIndent=8, spaceAfter=3,
        ),
    }
    return styles


def section_banner(text, styles, tint=BG_SOFT):
    tbl = Table([[Paragraph(text, styles['h1'])]], colWidths=[170*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), tint),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, -1), 2, BRAND_BLUE),
    ]))
    return tbl


def bullets(items, styles):
    out = []
    for it in items:
        out.append(Paragraph(f"\u2022&nbsp;&nbsp;{sanitize(it)}", styles['bullet']))
    return out


def make_table(header, rows, col_widths, styles, head_color=BRAND_BLUE):
    head_cells = [Paragraph(f"<b>{sanitize(h)}</b>", styles['cell_head']) for h in header]
    data = [head_cells]
    for r in rows:
        data.append([Paragraph(sanitize(c), styles['cell']) for c in r])
    tbl = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), head_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.6, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), ROW_ALT))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl


def status_chip(text):
    return f"<b>{sanitize(text)}</b>"


def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Top hairline + brand tag
    canvas.setStrokeColor(BRAND_BLUE)
    canvas.setLineWidth(1.6)
    canvas.line(20*mm, h - 14*mm, w - 20*mm, h - 14*mm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, h - 11.5*mm, "Hintonn AI  |  Daily Working Report")
    canvas.drawRightString(w - 20*mm, h - 11.5*mm, REPORT_DATE)
    # Footer
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.6)
    canvas.line(20*mm, 14*mm, w - 20*mm, 14*mm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20*mm, 10*mm, "NeLabs  |  Internal document")
    canvas.drawRightString(w - 20*mm, 10*mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    styles = build_styles()
    doc = SimpleDocTemplate(
        OUT_PATH, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
        title="Hintonn AI - Daily Working Report - 30 September 2026",
        author="Hintonn AI Project Team (NeLabs)",
        subject="Daily working report - AI QR project testing, UI assignment and backend integration",
    )
    story = []
    content_w = doc.width

    # ================= COVER =================
    story.append(Spacer(1, 10*mm))
    logo = logo_flowable(max_w=95*mm, max_h=42*mm)
    logo.hAlign = 'CENTER'
    story.append(logo)
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph("Daily Working Report", styles['cover_title']))
    story.append(Paragraph("AI QR Project &mdash; System Testing, UI Assignment &amp; Backend Integration", styles['cover_sub']))
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="45%", thickness=1.2, color=BRAND_BLUE, hAlign='CENTER'))
    story.append(Spacer(1, 6*mm))

    meta_rows = [
        ["Report Date", REPORT_DATE],
        ["Project", "AI QR Project (project walkthrough by Kishan Bhai)"],
        ["Team", "Mohit (Project / Testing / Backend), Preet & Hirvi (Frontend UI)"],
        ["Prepared For", "Project Management - Daily Status Review"],
        ["Organisation", "NeLabs"],
    ]
    meta_data = [[Paragraph(f"<b>{sanitize(k)}</b>", styles['cell']), Paragraph(sanitize(v), styles['cell'])] for k, v in meta_rows]
    meta_tbl = Table(meta_data, colWidths=[42*mm, 118*mm])
    meta_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), BG_SOFT),
        ('TEXTCOLOR', (0, 0), (0, -1), BRAND_BLUE),
        ('GRID', (0, 0), (-1, -1), 0.6, LINE),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    meta_tbl.hAlign = 'CENTER'
    story.append(meta_tbl)
    story.append(Spacer(1, 8*mm))

    cover_note = Table([[Paragraph(
        "This report summarises the day&rsquo;s work on the AI QR project: understanding the "
        "system, testing every panel, assigning UI (frontend) fixes to the UI team, and "
        "preparing for final backend integration.",
        styles['note'])]], colWidths=[160*mm])
    cover_note.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_SOFT2),
        ('BOX', (0, 0), (-1, -1), 0.8, BRAND_VIOLET),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    cover_note.hAlign = 'CENTER'
    story.append(cover_note)

    story.append(PageBreak())

    # ================= 1. EXECUTIVE SUMMARY =================
    story.append(section_banner("1. Executive Summary", styles))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "Today the team focused on fully understanding the AI QR project, running "
        "end-to-end system testing, and preparing the next round of UI (frontend) work "
        "so the product can move into final backend integration. The project lead "
        "(Mohit) first studied the system as built by Kishan Bhai, then tested each "
        "admin and team-member panel section by section, recording issues as he went. "
        "A set of 8&ndash;10 UI changes were identified and formally assigned to the "
        "frontend team. Frontend (Preet and Hirvi) continue to deliver strong UI work; "
        "a few areas still need improvement and are being re-assigned. Hirvi is also "
        "learning the full project from Kishan Bhai to strengthen the frontend team&rsquo;s "
        "understanding of the system.",
        styles['body']))

    story.append(Spacer(1, 3))
    kpi = [
        ["Panels / sections tested", "Admin + Team Member (all sections)"],
        ["UI changes assigned to frontend", "8&ndash;10 items (full working list)"],
        ["Frontend team", "Preet + Hirvi (UI), both progressing well"],
        ["Knowledge transfer", "Hirvi &mdash; full project briefing from Kishan Bhai"],
        ["Next milestone", "Final testing after UI fixes + proper backend integration"],
    ]
    kpi_data = [[Paragraph(f"<b>{sanitize(k)}</b>", styles['cell']), Paragraph(v, styles['cell'])] for k, v in kpi]
    kpi_tbl = Table(kpi_data, colWidths=[70*mm, 90*mm])
    kpi_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), BG_SOFT),
        ('TEXTCOLOR', (0, 0), (0, -1), BRAND_BLUE),
        ('GRID', (0, 0), (-1, -1), 0.6, LINE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(kpi_tbl)

    # ================= 2. TODAY'S WORK =================
    story.append(Spacer(1, 8))
    story.append(section_banner("2. Today&rsquo;s Work", styles))
    story.append(Spacer(1, 6))

    # --- 2.1 Mohit ---
    story.append(Paragraph("2.1&nbsp;&nbsp;Mohit &mdash; Project Lead, Testing &amp; Backend", styles['h2']))
    story.append(Paragraph(
        "Mohit owns the project&rsquo;s end-to-end quality: he studies the system, tests it, "
        "finds the issues, assigns the fixes, and then re-tests after the frontend team "
        "has finished.",
        styles['body']))
    story.extend(bullets([
        "Started the day by thoroughly understanding the AI QR project as built by Kishan Bhai &mdash; how the system is structured and how the panels connect.",
        "Carried out system testing on the live system, covering both the Admin side and the Team Member side.",
        "Testing was done panel-by-panel and section-by-section; every panel and section was opened, exercised, and noted.",
        "Made detailed notes of every bug and issue found, with the exact panel and section where it appeared.",
        "Where issues were found in code or configuration that he could change directly, the changes were made and verified.",
        "Identified 8&ndash;10 UI changes on the frontend and formally assigned them to the UI team (Preet and Hirvi) as separate work items.",
        "After the first round of UI fixes, re-tested and found that a few frontend issues remained; re-assigned those changes to the UI team from his site.",
        "Final round of proper testing is still remaining and will be completed after the UI team members finish all assigned fixes.",
        "Owns backend integration: once the UI is finalised, he will properly integrate the system on the backend side.",
    ], styles))

    # --- 2.2 Preet + Hirvi ---
    story.append(Spacer(1, 4))
    story.append(Paragraph("2.2&nbsp;&nbsp;Preet + Hirvi &mdash; Frontend UI Team", styles['h2']))
    story.append(Paragraph(
        "Both Preet and Hirvi are working on the UI and are delivering the frontend "
        "that feeds into Mohit&rsquo;s backend integration. Their work today covered "
        "implementing assigned UI changes and understanding the product better.",
        styles['body']))
    story.extend(bullets([
        "Preet and Hirvi are working on the UI (frontend) together and are delivering good overall progress &mdash; described as amazing work on the frontend site.",
        "They take the UI changes assigned by Mohit and implement them panel by panel.",
        "A few parts of the UI are still not fully proper and will be improved by the team.",
        "Their completed frontend work is handed over to Mohit for backend connection and integration.",
        "Hirvi started a deep-dive of the full project with Kishan Bhai to understand the complete system, which will help the frontend team reduce future issues.",
    ], styles))

    story.append(PageBreak())

    # ================= 3. TESTING STATUS =================
    story.append(section_banner("3. Testing Status (Mohit)", styles, tint=BG_SOFT2))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "Testing followed a strict flow: understand first, then test every panel, note "
        "issues, fix, re-assign, and finally re-test after the UI work is complete.",
        styles['body']))

    test_rows = [
        ["1", "Project understanding (from Kishan Bhai)", "Admin + Team Member", "Completed", "Full system walkthrough of the AI QR project"],
        ["2", "Admin panel &mdash; all sections", "Admin", "Completed", "Each section opened, exercised, issues noted"],
        ["3", "Team Member panel &mdash; all sections", "Team Member", "Completed", "Each section opened, exercised, issues noted"],
        ["4", "Bug / issue note-making", "All panels", "Completed", "Issues recorded panel-wise and section-wise"],
        ["5", "Direct fixes (where possible)", "As found", "Completed", "Changes applied and verified at the source"],
        ["6", "UI change list for frontend team", "Frontend", "Completed", "8&ndash;10 UI changes assigned to Preet + Hirvi"],
        ["7", "Re-test after first UI fix round", "Frontend", "Completed", "Some frontend bugs still open &mdash; re-assigned"],
        ["8", "Final proper test", "All", "Pending", "Starts after UI team (Preet + Hirvi) close all fixes"],
        ["9", "Backend integration test", "Backend", "Pending", "Proper integration after final UI is approved"],
    ]
    story.append(make_table(
        ["#", "Test activity", "Scope", "Status", "Remarks"],
        test_rows,
        [8*mm, 48*mm, 26*mm, 22*mm, 66*mm],
        styles,
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Panel / Section Coverage Notes", styles['h3']))
    story.extend(bullets([
        "Admin side: every section was tested individually, not in bulk &mdash; so each bug is traceable to one panel and one section.",
        "Team Member side: same approach &mdash; each section tested, exercised, and noted.",
        "Where an issue was a code or configuration problem, the change was made directly and verified.",
        "Where an issue was a frontend (UI) problem, it was written up and assigned to Preet + Hirvi with clear scope.",
        "After the first round of UI fixes, a re-test was done; remaining frontend bugs were re-assigned rather than left open.",
    ], styles))

    # ================= 4. BUGS & UI ASSIGNMENTS =================
    story.append(Spacer(1, 8))
    story.append(section_banner("4. UI Changes Assigned to the Frontend Team", styles))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "The following 10 UI changes were found during panel-wise testing and have been "
        "assigned to Preet and Hirvi. Items flagged &lsquo;Re-assign&rsquo; are the ones "
        "still open after the first round of fixes.",
        styles['body']))

    ui_rows = [
        ["UI-01", "Admin panel &ndash; layout / spacing inconsistencies across sections", "Frontend (UI)", "Assigned"],
        ["UI-02", "Team Member panel &ndash; alignment / visual consistency fixes", "Frontend (UI)", "Assigned"],
        ["UI-03", "Form fields &ndash; labels, validation states and error messages not consistent", "Frontend (UI)", "Assigned"],
        ["UI-04", "Buttons &ndash; sizes, colours and states not matching the design system", "Frontend (UI)", "Assigned"],
        ["UI-05", "Tables &ndash; overflow, pagination and empty-state handling", "Frontend (UI)", "Assigned"],
        ["UI-06", "Dashboard / summary cards &ndash; spacing and information hierarchy", "Frontend (UI)", "Assigned"],
        ["UI-07", "Mobile / smaller screens &ndash; responsive issues in key sections", "Frontend (UI)", "Assigned"],
        ["UI-08", "Navigation &ndash; active states, section links and menu consistency", "Frontend (UI)", "Assigned"],
        ["UI-09", "Loading / empty / error states missing or inconsistent across panels", "Re-assign (round 2)", "Open"],
        ["UI-10", "Remaining panel-specific issues captured during re-test", "Re-assign (round 2)", "Open"],
    ]
    story.append(make_table(
        ["ID", "UI change / issue", "Assigned to", "Status"],
        ui_rows,
        [16*mm, 96*mm, 32*mm, 26*mm],
        styles,
    ))

    story.append(PageBreak())

    # ================= 5. TEAM WORK & ASSIGNMENTS =================
    story.append(section_banner("5. Team Work &amp; Assignments", styles, tint=BG_SOFT))
    story.append(Spacer(1, 5))

    team_rows = [
        ["Mohit", "Project lead, testing &amp; backend", "System testing (Admin + Team Member), bug notes, UI change assignment, re-test", "Final proper test, then proper backend integration"],
        ["Preet", "Frontend UI", "UI implementation on assigned changes; frontend handover to backend", "Complete assigned UI fixes; support final test"],
        ["Hirvi", "Frontend UI", "UI implementation; full project understanding from Kishan Bhai", "Complete assigned UI fixes; apply project understanding to remaining work"],
    ]
    story.append(make_table(
        ["Member", "Role", "Work done today", "Next steps"],
        team_rows,
        [18*mm, 30*mm, 64*mm, 58*mm],
        styles,
        head_color=BRAND_VIOLET,
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Team Notes", styles['h3']))
    story.extend(bullets([
        "Preet and Hirvi are both working on the UI and their overall frontend output is strong; a few parts are still not fully proper and are being improved by the team.",
        "Their frontend work is handed over to Mohit for backend connection and integration &mdash; the integration path depends on the UI being finalised.",
        "Hirvi&rsquo;s project walkthrough with Kishan Bhai is an important step: a frontend developer who understands the full system produces fewer integration issues.",
        "Any UI change that survives the first fix round is explicitly re-assigned with the same panel-and-section detail as the original report, so nothing is lost.",
    ], styles))

    # ================= 6. BACKEND INTEGRATION =================
    story.append(Spacer(1, 8))
    story.append(section_banner("6. Backend Integration Status", styles, tint=BG_SOFT2))
    story.append(Spacer(1, 5))
    story.append(Paragraph(
        "Mohit will properly integrate the system on the backend side once the frontend "
        "UI is final. Integration is intentionally held until the UI team closes all "
        "assigned changes, so the final test is run against the real, finished UI "
        "rather than a moving target.",
        styles['body']))
    story.extend(bullets([
        "Frontend (Preet + Hirvi) completes all assigned UI changes, including the re-assigned round-2 items.",
        "Mohit performs the final proper test across all panels and sections on the completed UI.",
        "Mohit then performs proper backend integration for the system.",
        "Post-integration verification confirms that the Admin and Team Member panels behave correctly end to end.",
    ], styles))

    # ================= 7. RISKS =================
    story.append(Spacer(1, 8))
    story.append(section_banner("7. Risks &amp; Blockers", styles))
    story.append(Spacer(1, 5))
    risk_rows = [
        ["UI fixes still open after first round", "Medium", "Clear panel-wise re-assignment; final test gated on closure"],
        ["Frontend &ndash; backend integration mismatch", "Medium", "Hirvi&rsquo;s full project understanding from Kishan Bhai; early handover conversations"],
        ["Scope creep on UI changes", "Low", "Changes tracked as discrete items (UI-01 to UI-10) with panel references"],
        ["Final test delay if UI slips", "Medium", "Daily tracking of open items; re-test only after UI team sign-off"],
    ]
    story.append(make_table(
        ["Risk / blocker", "Impact", "Mitigation"],
        risk_rows,
        [58*mm, 22*mm, 90*mm],
        styles,
    ))

    # ================= 8. NEXT STEPS =================
    story.append(Spacer(1, 8))
    story.append(section_banner("8. Next Steps (Tomorrow)", styles, tint=BG_SOFT))
    story.append(Spacer(1, 5))
    story.extend(bullets([
        "Mohit: monitor progress on the 8&ndash;10 assigned UI changes and keep notes of anything that needs a second round.",
        "Preet + Hirvi: close all assigned UI fixes (including UI-09 and UI-10), and hand the completed frontend to Mohit for connection.",
        "Hirvi: complete the full project understanding with Kishan Bhai and apply it to the remaining UI work.",
        "Mohit: run the final proper test on the completed UI across every panel and section.",
        "Mohit: perform proper backend integration of the system and verify end-to-end behaviour.",
    ], styles))

    story.append(Spacer(1, 10))
    sign_tbl = Table([
        [Paragraph("<b>Prepared by</b>", styles['cell']), Paragraph("Mohit (Project Lead)", styles['cell']),
         Paragraph("<b>Report date</b>", styles['cell']), Paragraph(REPORT_DATE, styles['cell'])],
        [Paragraph("<b>Team</b>", styles['cell']), Paragraph("Preet + Hirvi (Frontend UI)", styles['cell']),
         Paragraph("<b>Organisation</b>", styles['cell']), Paragraph("NeLabs", styles['cell'])],
    ], colWidths=[26*mm, 59*mm, 28*mm, 57*mm])
    sign_tbl.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.6, LINE),
        ('BACKGROUND', (0, 0), (0, -1), BG_SOFT),
        ('BACKGROUND', (2, 0), (2, -1), BG_SOFT),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(sign_tbl)
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "End of report &mdash; Hintonn AI Daily Working Report, " + REPORT_DATE,
        styles['footer']))

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"WROTE: {OUT_PATH}")


if __name__ == "__main__":
    main()
