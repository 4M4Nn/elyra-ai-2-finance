from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import io
from datetime import datetime


BRAND_DARK = colors.HexColor("#0F172A")
BRAND_BLUE = colors.HexColor("#6366F1")
BRAND_LIGHT = colors.HexColor("#F8FAFC")
BRAND_GRAY = colors.HexColor("#64748B")


def generate_receipt_pdf(receipt_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    header_style = ParagraphStyle("header", fontSize=22, textColor=BRAND_BLUE,
                                   fontName="Helvetica-Bold", alignment=TA_LEFT)
    sub_style = ParagraphStyle("sub", fontSize=9, textColor=BRAND_GRAY,
                                fontName="Helvetica", alignment=TA_LEFT)
    right_style = ParagraphStyle("right", fontSize=9, textColor=BRAND_GRAY,
                                  fontName="Helvetica", alignment=TA_RIGHT)

    header_table = Table([
        [
            Paragraph("Elyra AI 2", header_style),
            Paragraph(
                "Future Optima IT Solutions<br/>Civil Line Rd, Chembumukku, Ernakulam<br/>"
                "Kochi, Kerala 682021<br/>info@futureoptimaitsolutions.com | 8891129111",
                right_style
            )
        ]
    ], colWidths=[90*mm, 90*mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 3*mm))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_BLUE))
    story.append(Spacer(1, 4*mm))

    # ── Receipt Title ─────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", fontSize=16, textColor=BRAND_DARK,
                                  fontName="Helvetica-Bold", alignment=TA_CENTER)
    story.append(Paragraph("PAYMENT RECEIPT", title_style))
    story.append(Spacer(1, 6*mm))

    # ── Receipt Meta ──────────────────────────────────────────────────────────
    meta_data = [
        ["Receipt No.", receipt_data.get("receipt_no", ""),
         "Date", receipt_data.get("payment_date", "")],
        ["Student ID", receipt_data.get("student_id", ""),
         "Course", receipt_data.get("course", "")],
        ["Batch", receipt_data.get("batch", ""),
         "Payment Mode", receipt_data.get("payment_mode", "").upper()],
    ]

    meta_table = Table(meta_data, colWidths=[35*mm, 60*mm, 30*mm, 55*mm])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BRAND_LIGHT),
        ("BACKGROUND", (2, 0), (2, -1), BRAND_LIGHT),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), BRAND_DARK),
        ("TEXTCOLOR", (2, 0), (2, -1), BRAND_DARK),
        ("TEXTCOLOR", (1, 0), (1, -1), BRAND_GRAY),
        ("TEXTCOLOR", (3, 0), (3, -1), BRAND_GRAY),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#F1F5F9")]),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 5*mm))

    # ── Student Name ──────────────────────────────────────────────────────────
    name_style = ParagraphStyle("name", fontSize=13, textColor=BRAND_DARK,
                                 fontName="Helvetica-Bold")
    story.append(Paragraph(f"Received from: {receipt_data.get('student_name', '')}", name_style))
    story.append(Spacer(1, 5*mm))

    # ── Amount Box ────────────────────────────────────────────────────────────
    amount = receipt_data.get("amount", 0)
    amt_data = [
        ["Description", "Installment", "Amount"],
        [
            receipt_data.get("description", "Course Fee Payment"),
            receipt_data.get("installment_label", "—"),
            f"₹ {amount:,.2f}"
        ],
        ["", "Total Paid", f"₹ {amount:,.2f}"],
    ]
    amt_table = Table(amt_data, colWidths=[85*mm, 55*mm, 40*mm])
    amt_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (2, 0), (2, -1), "RIGHT"),
        ("ALIGN", (1, -1), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), BRAND_LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    story.append(amt_table)
    story.append(Spacer(1, 5*mm))

    # ── Remaining Balance ─────────────────────────────────────────────────────
    balance_style = ParagraphStyle("balance", fontSize=10, textColor=BRAND_GRAY,
                                    fontName="Helvetica")
    outstanding = receipt_data.get("outstanding_balance", 0)
    color_tag = "red" if outstanding > 0 else "green"
    story.append(Paragraph(
        f'Outstanding Balance: <font color="{color_tag}"><b>₹ {outstanding:,.2f}</b></font>',
        balance_style
    ))

    if receipt_data.get("transaction_ref"):
        story.append(Paragraph(
            f"Transaction Ref: {receipt_data.get('transaction_ref')}",
            balance_style
        ))

    story.append(Spacer(1, 10*mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0")))
    story.append(Spacer(1, 4*mm))

    # ── Footer ────────────────────────────────────────────────────────────────
    footer_style = ParagraphStyle("footer", fontSize=8, textColor=BRAND_GRAY,
                                   fontName="Helvetica", alignment=TA_CENTER)
    story.append(Paragraph(
        "This is a computer-generated receipt and does not require a physical signature.",
        footer_style
    ))
    story.append(Paragraph(
        "Powered by <b>Elyra AI 2</b> | Future Optima IT Solutions © 2026",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
