import re

def fix_chapter3():
    with open('Chapter3_System_Design.md', 'r', encoding='utf-8') as f:
        content = f.read()

    def replace_data_dict(match):
        table_text = match.group(0)
        lines = table_text.strip().split('\n')
        if len(lines) < 3: return table_text
        
        out = []
        for line in lines[2:]:
            cols = [c.strip() for c in line.split('|')]
            if len(cols) >= 4:
                field = cols[1].replace('_', '\_') # escape underscores for markdown
                ctype = cols[2]
                desc = cols[3]
                out.append(f"- **{field}** ({ctype}): {desc}")
        return '\n'.join(out)

    # Find tables that start with | Field | Type | Description |
    content = re.sub(r'\| Field \| Type \| Description \|\n\|[-\s]+\|[-\s]+\|[-\s]+\|\n(?:\|.*\|\n?)+', replace_data_dict, content)
    
    with open('Chapter3_System_Design.md', 'w', encoding='utf-8') as f:
        f.write(content)


def fix_chapter4():
    with open('Chapter4_SRS.md', 'r', encoding='utf-8') as f:
        content = f.read()

    def replace_use_case(match):
        table_text = match.group(0)
        lines = table_text.strip().split('\n')
        out = []
        for line in lines[2:]:
            cols = [c.strip() for c in line.split('|')]
            if len(cols) >= 3:
                attr = cols[1].replace('**', '')
                detail = cols[2].replace('<br>', '\n  - ')
                if attr.lower() == 'basic flow' or attr.lower() == 'alternative flow':
                    detail = detail.replace('1.', '- 1.').replace('2.', '- 2.').replace('3.', '- 3.').replace('4.', '- 4.').replace('5.', '- 5.').replace('6.', '- 6.').replace('7.', '- 7.').replace('8.', '- 8.').replace('9.', '- 9.').replace('10.', '- 10.')
                    # if it didn't have numbers
                    if not detail.startswith('- '):
                        detail = '- ' + detail
                    out.append(f"**{attr}:**\n  {detail}")
                else:
                    out.append(f"**{attr}:** {detail}")
        return '\n\n'.join(out)

    content = re.sub(r'\| Use Case Attribute \| Detail \|\n\|[-\s]+\|[-\s]+\|\n(?:\|.*\|\n?)+', replace_use_case, content)

    def replace_req_table(match):
        table_text = match.group(0)
        lines = table_text.strip().split('\n')
        out = []
        for line in lines[2:]:
            cols = [c.strip() for c in line.split('|')]
            if len(cols) >= 7:
                out.append(f"- **{cols[1]}** ({cols[2]}): Module: {cols[3]} | API: {cols[4]} | Test: {cols[5]} | Priority: {cols[6]}")
        return '\n'.join(out)

    content = re.sub(r'\| Req ID \| Requirement Name \| Module \| API Endpoint \| Test Type \| Priority \|\n\|[-\s]+\|[-\s]+\|[-\s]+\|[-\s]+\|[-\s]+\|[-\s]+\|\n(?:\|.*\|\n?)+', replace_req_table, content)

    with open('Chapter4_SRS.md', 'w', encoding='utf-8') as f:
        f.write(content)

fix_chapter3()
fix_chapter4()
print("Tables fixed.")
