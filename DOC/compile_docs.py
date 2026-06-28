import os
import re
import markdown

base_dir = r"C:\\Projects\\el-moquwal\\DOC"
ui_dir = r"C:\\Projects\\el-moquwal\\UI"
output_html = os.path.join(base_dir, "temp_doc.html")

SCREENSHOT_CAPTIONS = {
    "Screenshot 2026-06-26 235747.png": "Landing page hero section and primary call-to-action",
    "Screenshot 2026-06-26 235810.png": "Public navigation and service overview",
    "Screenshot 2026-06-26 235856.png": "Role selection / registration entry point",
    "Screenshot 2026-06-26 235914.png": "Customer registration form with National ID",
    "Screenshot 2026-06-26 235925.png": "Contractor registration and document upload",
    "Screenshot 2026-06-26 235956.png": "Login and authentication screen",
    "Screenshot 2026-06-27 000003.png": "Customer dashboard overview",
    "Screenshot 2026-06-27 000022.png": "Post new project wizard",
    "Screenshot 2026-06-27 000033.png": "Customer project list and status badges",
    "Screenshot 2026-06-27 000043.png": "Proposals / bids comparison view",
    "Screenshot 2026-06-27 000142.png": "Electronic contract and signature flow (Customer)",
    "Screenshot 2026-06-27 000157.png": "Escrow milestone payment interface",
    "Screenshot 2026-06-27 000252.png": "Contractor dashboard and credit balance",
    "Screenshot 2026-06-27 000303.png": "Browse projects with specialty filters",
    "Screenshot 2026-06-27 000336.png": "Project detail and bid submission",
    "Screenshot 2026-06-27 000356.png": "My agreements and contract preview",
    "Screenshot 2026-06-27 000412.png": "Admin manager dashboard — pending contractors",
    "Screenshot 2026-06-27 000421.png": "Admin all-projects panel and platform statistics",
}

def read_clean_file(filename):
    filepath = os.path.join(base_dir, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filename} not found.")
        return ""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Strip page breaks to prevent blank pages
    content = content.replace("\\newpage", "")
    
    # Remove any remaining code blocks (fenced with ``` or ~~~)
    content = re.sub(r'```[\s\S]*?```', '', content)
    content = re.sub(r'~~~[\s\S]*?~~~', '', content)
    
    # Translate and clean Arabic terms
    content = content.replace("El-Moquwal (المقاول)", "El-Moquwal")
    content = content.replace("(المقاول)", "")
    content = content.replace("(العميل)", "")
    content = content.replace("(المدير)", "")
    content = content.replace("(الضمان)", "")
    content = content.replace("(التكاليف الاستثمارية)", "")
    content = content.replace("(التدفقات المالية لعشر سنوات)", "")
    content = content.replace("(متوسط الربح السنوي)", "")
    content = content.replace("(العائد على الاستثمار)", "")
    content = content.replace("(نقطة التعادل)", "")
    
    # Remove any remaining Arabic in parentheses
    content = re.sub(r'\([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]+\)', '', content)
    
    gov_translations = {
        "القاهرة": "Cairo",
        "الجيزة": "Giza",
        "الإسكندرية": "Alexandria",
        "القليوبية": "Qalyubia",
        "الدقهلية": "Dakahlia",
        "الشرقية": "Sharqia",
        "الغربية": "Gharbia",
        "المنوفية": "Monufia",
        "البحيرة": "Beheira",
        "أسيوط": "Assiut",
        "سوهاج": "Sohag",
        "الأقصر": "Luxor",
        "غير معروف": "Unknown"
    }
    for ar_name, en_name in gov_translations.items():
        content = content.replace(ar_name, en_name)
        
    return content

def extract_supplement_sections():
    content = read_clean_file("Chapter_Supplement_Extended.md")
    sections = re.split(r'\n(## 11\.\d+ [^\n]+)\n', content)
    sec_dict = {}
    for i in range(1, len(sections), 2):
        header = sections[i].strip()
        body = sections[i+1].strip()
        sec_dict[header] = body
    return sec_dict

def generate_appendix_a():
    lines = [
        "[[SECTION_BREAK_APPENDIX_A]]",
        "# Appendix A: User Interface Gallery",
        "",
        "The following figures document the implemented El-Moquwal user interface across customer, contractor, and administrator journeys. Each screenshot is presented in landscape orientation at full width for clear visual assessment.",
        ""
    ]
    if os.path.exists(ui_dir):
        images = [f for f in os.listdir(ui_dir) if f.endswith(".png") or f.endswith(".jpg")]
        images.sort()
        for idx, img in enumerate(images, 1):
            caption = SCREENSHOT_CAPTIONS.get(img, f"UI Screen flow {idx}")
            img_path = f"file:///C:/Projects/el-moquwal/UI/{img}"
            lines.append("[[UI_PAGE_BREAK]]")
            lines.append(f"![Figure A.{idx} — {caption}]({img_path})")
            lines.append(f"*Figure A.{idx} — {caption}*")
            lines.append("")
    return "\n".join(lines)

print("Starting documentation consolidation...")

# 1. Front Matter
front_matter = read_clean_file("Front_Matter.md")

# 2. Chapter 1: Software Proposal
ch1_raw = read_clean_file("Chapter1_Introduction.md")
ch1_md = "[[SECTION_BREAK_CHAPTER1]]\n" + ch1_raw.replace("# Chapter 1: Introduction", "# Chapter 1: Software Proposal")

# 3. Chapter 2: Literature Review and Feasibility Study
supplement_secs = extract_supplement_sections()

ch2_raw = read_clean_file("Chapter2_Literature_Review_Feasibility.md")

# Parse Chapter 9 (Project Management) and adapt headers
ch9_raw = read_clean_file("Chapter9_Project_Management.md")
ch9_md = ch9_raw.replace("# Chapter 9: Project Management and Software Development Lifecycle", "## 2.9 Project Management and Lifecycle")
ch9_md = re.sub(r'## 9\.(\d+)', r'### 2.9.\1', ch9_md)

# Extract supplement 11.2 and 11.3 and adapt headers
sec_11_2 = supplement_secs.get("## 11.2 Stakeholder Interview Synthesis", "")
sec_11_3 = supplement_secs.get("## 11.3 Design Decision Records", "")

market_md = ""
interview_md = ""
if sec_11_2:
    market_md = "## 2.10 Stakeholder Interview Synthesis\n\n" + sec_11_2
if sec_11_3:
    interview_md = "## 2.11 Design Decision Records\n\n" + sec_11_3

ch2_md = "[[PAGE_BREAK]]\n" + ch2_raw + "\n\n" + ch9_md
if market_md:
    ch2_md += "\n\n" + market_md
if interview_md:
    ch2_md += "\n\n" + interview_md

# 4. Chapter 3: System Design and Architecture
ch3_raw = read_clean_file("Chapter3_System_Design.md")

# Extract supplement sections 11.4 to 11.11 and adapt headers
design_supplements = []
supp_headers_mapping = {
    "## 11.4 Escrow State Machine": "## 3.10 Escrow State Machine Design",
    "## 11.5 National ID Parser Design": "## 3.11 National ID Parser Logic",
    "## 11.6 AI Price Estimation Pipeline": "## 3.12 AI Price Estimation Pipeline",
    "## 11.7 Material Marketplace Module": "## 3.13 Material Marketplace Design",
    "## 11.8 Subscription and Monetisation": "## 3.14 Subscription and Monetisation Architecture",
    "## 11.9 UI/UX Design Principles": "## 3.15 UI/UX Design Principles",
    "## 11.10 Accessibility and Inclusion": "## 3.16 Accessibility and Inclusion Standards",
}

for old_header, new_header in supp_headers_mapping.items():
    body = supplement_secs.get(old_header, "")
    body_cleaned = re.sub(r'### 11\.\d+\.(\d+)', r'### 3.X.\1', body) # standard sub-headers if any
    design_supplements.append(f"{new_header}\n\n{body_cleaned}")

ch3_md = "[[PAGE_BREAK]]\n" + ch3_raw + "\n\n" + "\n\n".join(design_supplements)

# 5. Chapter 4: Software Requirements Specification (SRS)
ch4_raw = read_clean_file("Chapter4_SRS.md")
ch4_md = "[[PAGE_BREAK]]\n" + ch4_raw

# 6. Chapter 5: System Implementation, Testing, and Deployment
ch5_raw = read_clean_file("Chapter5_Implementation_Testing.md")

# Chapter 8 User Manuals adaptation
ch8_raw = read_clean_file("Chapter8_User_Manuals.md")
ch8_md = ch8_raw.replace("# Chapter 8: User Manuals and Operational Guides", "## 5.11 User Manuals and Operational Guides")
ch8_md = re.sub(r'## 8\.(\d+)', r'### 5.11.\1', ch8_md)
ch8_md = re.sub(r'### 8\.(\d+)\.(\d+)', r'#### 5.11.\1.\2', ch8_md)

# Chapter 10 Deployment adaptation
ch10_raw = read_clean_file("Chapter10_Deployment.md")
ch10_md = ch10_raw.replace("# Chapter 10: Deployment, Operations, and Maintenance", "## 5.12 Deployment, Operations, and Maintenance")
ch10_md = re.sub(r'## 10\.(\d+)', r'### 5.12.\1', ch10_md)

# Supplement sections 11.12 (Error catalog) and 11.13 (Governorate rollout)
sec_11_12 = supplement_secs.get("## 11.12 Complete API Error Code Catalogue", "")
sec_11_13 = supplement_secs.get("## 11.13 Governorate Launch Rollout Plan", "")

err_md = ""
rollout_md = ""
if sec_11_12:
    err_md = "## 5.13 Complete API Error Code Catalogue\n\n" + sec_11_12
if sec_11_13:
    rollout_md = "## 5.14 Governorate Launch Rollout Plan\n\n" + sec_11_13

ch5_md = "[[PAGE_BREAK]]\n" + ch5_raw + "\n\n" + ch8_md + "\n\n" + ch10_md
if err_md:
    ch5_md += "\n\n" + err_md
if rollout_md:
    ch5_md += "\n\n" + rollout_md

# 7. Chapter 6: Conclusion and Future Work
ch6_raw = read_clean_file("Chapter6_Conclusion_Future_Work.md")
ch6_md = "[[PAGE_BREAK]]\n" + ch6_raw

# 8. Appendices
app_a_md = generate_appendix_a()

app_b_raw = read_clean_file("Appendix_B_Test_Cases.md")
app_b_md = "[[SECTION_BREAK_APPENDIX_B]]\n" + app_b_raw

app_c_raw = read_clean_file("Appendix_C_Data_Dictionary.md")
app_c_md = "[[PAGE_BREAK]]\n" + app_c_raw

app_d_raw = read_clean_file("Appendix_D_Competitive_Analysis.md")
app_d_md = "[[PAGE_BREAK]]\n" + app_d_raw

app_e_raw = read_clean_file("Appendix_E_Security_Audit.md")
app_e_md = "[[PAGE_BREAK]]\n" + app_e_raw

app_f_raw = read_clean_file("Appendix_F_Glossary.md")
app_f_md = "[[PAGE_BREAK]]\n" + app_f_raw

# Assemble all parts
parts = [
    front_matter,
    ch1_md,
    ch2_md,
    ch3_md,
    ch4_md,
    ch5_md,
    ch6_md,
    app_a_md,
    app_b_md,
    app_c_md,
    app_d_md,
    app_e_md,
    app_f_md
]

full_md = "\n\n---\n\n".join(parts)

# Convert Markdown to HTML
print("Converting Markdown to HTML...")
html_body = markdown.markdown(full_md, extensions=["tables", "fenced_code"])

# Post-process: Strip any remaining <pre> and <code> blocks from the HTML
html_body = re.sub(r'<pre[^>]*>[\s\S]*?</pre>', '', html_body)
html_body = re.sub(r'<code[^>]*>[\s\S]*?</code>', '', html_body)

# Post-process HTML: Replace [[PAGE_BREAK]] and [[UI_PAGE_BREAK]] with page-break elements
html_body = html_body.replace("[[PAGE_BREAK]]", '<br clear="all" style="page-break-before:always;" />')
html_body = html_body.replace("[[UI_PAGE_BREAK]]", '<br clear="all" style="page-break-before:always;" />')

cover_page = """
<div style="text-align: center; padding-top: 150px; page-break-after: always;">
    <h1 style="font-size: 38pt; margin-bottom: 10px; font-weight: bold; font-family: 'Times New Roman', serif;">El-Moquwal</h1>
    <h2 style="font-size: 20pt; margin-top: 0; font-family: 'Times New Roman', serif; font-weight: normal; color: #555555;">Digital Contracting Marketplace</h2>
    <hr style="width: 60%; margin: 40px auto; border: 1px solid #cccccc;" />
    <h3 style="font-size: 16pt; font-family: 'Times New Roman', serif; font-weight: normal;">Graduation Project Documentation</h3>
    <h4 style="font-size: 13pt; font-family: 'Times New Roman', serif; font-weight: normal;">Business Information Systems (BIS)</h4>
    <h4 style="font-size: 13pt; font-family: 'Times New Roman', serif; font-weight: normal;">Assiut University</h4>
    <h4 style="font-size: 12pt; font-family: 'Times New Roman', serif; font-weight: normal; margin-top: 20px;">Academic Year 2025 / 2026</h4>
</div>
<br clear="all" style="page-break-before:always" />
"""

# HTML template — NO code/pre styles since we've removed all code blocks
full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body {{
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000000;
    }}
    h1 {{
        font-size: 18pt;
        font-weight: bold;
        margin-top: 24pt;
        margin-bottom: 12pt;
    }}
    h2 {{
        font-size: 14pt;
        font-weight: bold;
        margin-top: 18pt;
        margin-bottom: 6pt;
    }}
    h3 {{
        font-size: 12pt;
        font-weight: bold;
        margin-top: 12pt;
        margin-bottom: 4pt;
    }}
    p {{
        margin-top: 0;
        margin-bottom: 8pt;
        text-align: justify;
    }}
    table {{
        border-collapse: collapse;
        width: 100%;
        margin-top: 12pt;
        margin-bottom: 12pt;
        page-break-inside: avoid;
    }}
    th, td {{
        border: 1px solid #000000;
        padding: 8px;
        text-align: left;
        font-size: 10pt;
    }}
    th {{
        background-color: #f2f2f2;
        font-weight: bold;
    }}
    img {{
        max-width: 100%;
        height: auto;
        display: block;
        margin: 15px auto;
    }}
    em {{
        font-style: italic;
    }}
    strong {{
        font-weight: bold;
    }}
</style>
</head>
<body>
{cover_page}
{html_body}
</body>
</html>
"""

# Write HTML file
with open(output_html, "w", encoding="utf-8") as f:
    f.write(full_html)

print(f"HTML compilation complete. Output written to {output_html}")
