import os
import re
from compile_docs import read_clean_file, extract_supplement_sections, generate_appendix_a

print("Exporting to Markdown...")

front_matter = read_clean_file("Front_Matter.md")

ch1_raw = read_clean_file("Chapter1_Introduction.md")
ch1_md = ch1_raw

supplement_secs = extract_supplement_sections()
ch2_raw = read_clean_file("Chapter2_Literature_Review_Feasibility.md")

ch9_raw = read_clean_file("Chapter9_Project_Management.md")
ch9_md = ch9_raw.replace("# Chapter 9: Project Management and Software Development Lifecycle", "## 2.9 Project Management and Lifecycle")
ch9_md = re.sub(r'## 9\.(\d+)', r'### 2.9.\1', ch9_md)

sec_11_2 = supplement_secs.get("## 11.2 Stakeholder Interview Synthesis", "")
sec_11_3 = supplement_secs.get("## 11.3 Design Decision Records", "")

market_md = "## 2.10 Stakeholder Interview Synthesis\n\n" + sec_11_2 if sec_11_2 else ""
interview_md = "## 2.11 Design Decision Records\n\n" + sec_11_3 if sec_11_3 else ""

ch2_md = ch2_raw + "\n\n" + ch9_md
if market_md: ch2_md += "\n\n" + market_md
if interview_md: ch2_md += "\n\n" + interview_md

ch3_raw = read_clean_file("Chapter3_System_Design.md")
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
    body_cleaned = re.sub(r'### 11\.\d+\.(\d+)', r'### 3.X.\1', body)
    design_supplements.append(f"{new_header}\n\n{body_cleaned}")

ch3_md = ch3_raw + "\n\n" + "\n\n".join(design_supplements)

ch4_md = read_clean_file("Chapter4_SRS.md")
ch5_raw = read_clean_file("Chapter5_Implementation_Testing.md")

ch8_raw = read_clean_file("Chapter8_User_Manuals.md")
ch8_md = ch8_raw.replace("# Chapter 8: User Manuals and Operational Guides", "## 5.11 User Manuals and Operational Guides")
ch8_md = re.sub(r'## 8\.(\d+)', r'### 5.11.\1', ch8_md)
ch8_md = re.sub(r'### 8\.(\d+)\.(\d+)', r'#### 5.11.\1.\2', ch8_md)

ch10_raw = read_clean_file("Chapter10_Deployment.md")
ch10_md = ch10_raw.replace("# Chapter 10: Deployment, Operations, and Maintenance", "## 5.12 Deployment, Operations, and Maintenance")
ch10_md = re.sub(r'## 10\.(\d+)', r'### 5.12.\1', ch10_md)

sec_11_12 = supplement_secs.get("## 11.12 Complete API Error Code Catalogue", "")
sec_11_13 = supplement_secs.get("## 11.13 Governorate Launch Rollout Plan", "")

err_md = "## 5.13 Complete API Error Code Catalogue\n\n" + sec_11_12 if sec_11_12 else ""
rollout_md = "## 5.14 Governorate Launch Rollout Plan\n\n" + sec_11_13 if sec_11_13 else ""

ch5_md = ch5_raw + "\n\n" + ch8_md + "\n\n" + ch10_md
if err_md: ch5_md += "\n\n" + err_md
if rollout_md: ch5_md += "\n\n" + rollout_md

ch6_md = read_clean_file("Chapter6_Conclusion_Future_Work.md")

app_a_md = generate_appendix_a()
app_b_md = read_clean_file("Appendix_B_Test_Cases.md")
app_c_md = read_clean_file("Appendix_C_Data_Dictionary.md")
app_d_md = read_clean_file("Appendix_D_Competitive_Analysis.md")
app_e_md = read_clean_file("Appendix_E_Security_Audit.md")
app_f_md = read_clean_file("Appendix_F_Glossary.md")

parts = [
    front_matter, ch1_md, ch2_md, ch3_md, ch4_md, ch5_md, ch6_md,
    app_a_md, app_b_md, app_c_md, app_d_md, app_e_md, app_f_md
]

full_md = "\n\n---\n\n".join(parts)

# Remove placeholders used by the DOCX script
full_md = full_md.replace('[[TOC_PLACEHOLDER]]', '')
full_md = full_md.replace('[[LOT_PLACEHOLDER]]', '')
full_md = full_md.replace('[[PAGE_BREAK]]', '')
full_md = full_md.replace('[[SECTION_BREAK_CHAPTER1]]', '')
full_md = full_md.replace('[[SECTION_BREAK_APPENDIX_A]]', '')
full_md = full_md.replace('[[SECTION_BREAK_APPENDIX_B]]', '')
full_md = full_md.replace('[[UI_PAGE_BREAK]]', '')

with open('El-Moquwal_Documentation_Final.md', 'w', encoding='utf-8') as f:
    f.write(full_md)

print("Export complete: El-Moquwal_Documentation_Final.md")
