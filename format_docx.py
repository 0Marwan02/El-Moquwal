import win32com.client
import os

def format_word_document(input_path, output_path):
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    
    abs_input = os.path.abspath(input_path)
    abs_output = os.path.abspath(output_path)
    
    print(f"Opening {abs_input}...")
    doc = word.Documents.Open(abs_input)
    
    try:
        # 1. Insert Front Matter
        # The target order: Certificate, Acknowledgement, Abstract, Acronyms, Table of Contents, List of Tables
        
        front_matter = [
            "Certificate",
            "Acknowledgement",
            "Abstract",
            "Acronyms"
        ]
        
        # Insert List of Tables
        rng = doc.Range(0, 0)
        rng.InsertAfter("List of Tables\n")
        rng.Paragraphs(1).Style = doc.Styles("Heading 1")
        rng_lot = doc.Range(rng.End, rng.End)
        # Add Tables of Figures (List of Tables)
        doc.TablesOfFigures.Add(Range=rng_lot, Caption="Table")
        rng_lot = doc.Range(doc.Range(0,0).End, doc.Range(0,0).End) # refresh
        doc.Range(rng_lot.End, rng_lot.End).InsertBreak(7) # wdPageBreak
        
        # Insert Table of Contents
        rng = doc.Range(0, 0)
        rng.InsertAfter("Table of Contents\n")
        rng.Paragraphs(1).Style = doc.Styles("Heading 1")
        rng_toc = doc.Range(rng.End, rng.End)
        doc.TablesOfContents.Add(Range=rng_toc, UseHeadingStyles=True, UpperHeadingLevel=1, LowerHeadingLevel=3)
        doc.Range(rng_toc.End, rng_toc.End).InsertBreak(7)
        
        # Insert front matter
        for title in reversed(front_matter):
            rng = doc.Range(0, 0)
            rng.InsertAfter(f"{title}\n")
            rng.Paragraphs(1).Style = doc.Styles("Heading 1")
            doc.Range(rng.End, rng.End).InsertBreak(7)
            
        # Update TOCs
        for toc in doc.TablesOfContents:
            toc.Update()
        for tof in doc.TablesOfFigures:
            tof.Update()

        # 2. Make image-only pages Landscape
        print("Processing images for landscape orientation...")
        for i in range(1, doc.InlineShapes.Count + 1):
            shape = doc.InlineShapes(i)
            p = shape.Range.Paragraphs(1)
            text_len = len(p.Range.Text.strip())
            
            if text_len <= 2:
                rng_before = doc.Range(p.Range.Start, p.Range.Start)
                rng_before.InsertBreak(2) # wdSectionBreakNextPage
                
                rng_after = doc.Range(p.Range.End, p.Range.End)
                rng_after.InsertBreak(2) # wdSectionBreakNextPage
                
                p.Range.Sections(1).PageSetup.Orientation = 1 # wdOrientLandscape
                
        print(f"Saving to {abs_output}...")
        doc.SaveAs(abs_output)
        
    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        doc.Close(False)
        word.Quit()
        print("Done.")

if __name__ == "__main__":
    input_file = r"DOC\El-Moquwal_Documentation.docx"
    output_file = r"DOC\El-Moquwal_Documentation_Formatted.docx"
    format_word_document(input_file, output_file)
