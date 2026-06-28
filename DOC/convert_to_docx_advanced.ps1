# MS Word COM automation script for El-Moquwal documentation formatting

$htmlPath = "C:\Projects\el-moquwal\DOC\temp_doc.html"
$docxPath = "C:\Projects\el-moquwal\DOC\El-Moquwal_Documentation_Formatted.docx"

Write-Host "Instantiating Word COM..."
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0 # Disable dialog prompts

Write-Host "Opening HTML file..."
$doc = $word.Documents.Open($htmlPath)

# Ensure 'Table' caption label exists (essential for non-English Word settings)
try {
    $word.CaptionLabels.Add("Table") | Out-Null
} catch {}

# 1. Format table captions
Write-Host "Formatting Table Captions..."
foreach ($para in $doc.Paragraphs) {
    $text = $para.Range.Text.Trim()
    if ($text.StartsWith("Table ") -or $text.StartsWith("*Table ")) {
        $clean = $text.Replace("*", "").Trim()
        $para.Range.Text = $clean
        $para.Style = -35 # wdStyleCaption (Standard Caption Style)
        $para.Format.Alignment = 1 # Center
    }
}

# Define Missing value for COM calls
$missing = [System.Type]::Missing

# 2. Insert dynamic Table of Contents
Write-Host "Inserting Table of Contents..."
$word.Selection.HomeKey(6) | Out-Null
$find = $word.Selection.Find
$find.ClearFormatting()
$find.Text = "[[TOC_PLACEHOLDER]]"
if ($find.Execute()) {
    $word.Selection.Text = "`r`n`r`n"
    $word.Selection.MoveLeft(1, 2) | Out-Null
    $range = $word.Selection.Range
    # Add TOC: Range, UseHeadingStyles, UpperHeadingLevel, LowerHeadingLevel, ...
    $toc = $doc.TablesOfContents.Add($range, $true, 1, 3, $missing, $missing, $true, $true, $missing, $true, $true, $true)
}

# 3. Insert dynamic List of Tables
Write-Host "Removing List of Tables Placeholder..."
$word.Selection.HomeKey(6) | Out-Null
$find.ClearFormatting()
$find.Text = "[[LOT_PLACEHOLDER]]"
if ($find.Execute()) {
    $word.Selection.Text = ""
}

# 4. Insert section breaks
Write-Host "Setting Section Breaks..."

# Break before Chapter 1
$word.Selection.HomeKey(6) | Out-Null
$find.ClearFormatting()
$find.Text = "[[SECTION_BREAK_CHAPTER1]]"
if ($find.Execute()) {
    $word.Selection.Text = "`r`n"
    $word.Selection.MoveLeft(1, 1) | Out-Null
    $word.Selection.InsertBreak(2) # wdSectionBreakNextPage
    $word.Selection.Delete(1, 1) | Out-Null # Clean up potential extra newline
}

# Break before Appendix A (UI Gallery)
$word.Selection.HomeKey(6) | Out-Null
$find.ClearFormatting()
$find.Text = "[[SECTION_BREAK_APPENDIX_A]]"
if ($find.Execute()) {
    $word.Selection.Text = "`r`n"
    $word.Selection.MoveLeft(1, 1) | Out-Null
    $word.Selection.InsertBreak(2) # wdSectionBreakNextPage
    $word.Selection.Delete(1, 1) | Out-Null # Clean up potential extra newline
}

# Break before Appendix B
$word.Selection.HomeKey(6) | Out-Null
$find.ClearFormatting()
$find.Text = "[[SECTION_BREAK_APPENDIX_B]]"
if ($find.Execute()) {
    $word.Selection.Text = "`r`n"
    $word.Selection.MoveLeft(1, 1) | Out-Null
    $word.Selection.InsertBreak(2) # wdSectionBreakNextPage
    $word.Selection.Delete(1, 1) | Out-Null # Clean up potential extra newline
}

# 5. Format section headers, footers, page numbering, and orientation
Write-Host "Configuring Document Sections..."
$sectionsCount = $doc.Sections.Count
Write-Host "Total sections detected: $sectionsCount"

# Section 1: Front Matter (Portrait, Roman i, ii, iii...)
if ($sectionsCount -ge 1) {
    Write-Host "Configuring Section 1 (Front Matter)..."
    $sec1 = $doc.Sections.Item(1)
    $footer1 = $sec1.Footers.Item(1) # wdHeaderFooterPrimary
    $footer1.PageNumbers.Add(1, $true) | Out-Null # Center, FirstPage=True
    $footer1.PageNumbers.NumberStyle = 2 # wdPageNumberStyleLowercaseRoman (i, ii, iii...)
}

# Section 2: Chapters (Portrait, Arabic 1, 2, 3...)
if ($sectionsCount -ge 2) {
    Write-Host "Configuring Section 2 (Chapters)..."
    $sec2 = $doc.Sections.Item(2)
    $footer2 = $sec2.Footers.Item(1)
    $footer2.LinkToPrevious = $false
    $footer2.PageNumbers.Add(1, $true) | Out-Null # Center
    $footer2.PageNumbers.NumberStyle = 0 # wdPageNumberStyleArabic (1, 2, 3...)
    $footer2.PageNumbers.RestartNumberingAtSection = $true
    $footer2.PageNumbers.StartingNumber = 1
}

# Section 3: Appendix A - UI Gallery (Landscape, Arabic X, Y, Z... continuing)
if ($sectionsCount -ge 3) {
    Write-Host "Configuring Section 3 (Landscape UI Gallery)..."
    $sec3 = $doc.Sections.Item(3)
    
    # Set orientation to Landscape
    $sec3.PageSetup.Orientation = 1 # wdOrientLandscape
    # Set A4 Landscape dimensions
    $sec3.PageSetup.PageWidth = 841.9
    $sec3.PageSetup.PageHeight = 595.3
    # Narrow margins for screenshots
    $sec3.PageSetup.TopMargin = 36
    $sec3.PageSetup.BottomMargin = 36
    $sec3.PageSetup.LeftMargin = 36
    $sec3.PageSetup.RightMargin = 36
    
    $footer3 = $sec3.Footers.Item(1)
    $footer3.LinkToPrevious = $false
    $footer3.PageNumbers.Add(1, $true) | Out-Null
    $footer3.PageNumbers.NumberStyle = 0
    $footer3.PageNumbers.RestartNumberingAtSection = $false # Continue numbering
}

# Section 4: Appendices B-F (Portrait, Arabic continuation)
if ($sectionsCount -ge 4) {
    Write-Host "Configuring Section 4 (Appendices B-F)..."
    $sec4 = $doc.Sections.Item(4)
    $sec4.PageSetup.Orientation = 0 # wdOrientPortrait
    
    $footer4 = $sec4.Footers.Item(1)
    $footer4.LinkToPrevious = $false
    $footer4.PageNumbers.Add(1, $true) | Out-Null
    $footer4.PageNumbers.NumberStyle = 0
    $footer4.PageNumbers.RestartNumberingAtSection = $false # Continue numbering
}

# 6. Update fields twice to ensure page numbering propagates to TOC and LOT
Write-Host "Updating Fields and TOCs..."
$doc.Fields.Update() | Out-Null
foreach ($s in $doc.Sections) {
    $s.Headers.Item(1).Range.Fields.Update() | Out-Null
    $s.Footers.Item(1).Range.Fields.Update() | Out-Null
}

foreach ($t in $doc.TablesOfContents) {
    $t.Update() | Out-Null
}
foreach ($f in $doc.TablesOfFigures) {
    $f.Update() | Out-Null
}

# Save and Clean up
Write-Host "Saving document to $docxPath..."
if (Test-Path $docxPath) {
    Remove-Item $docxPath -Force
}
# SaveFormat wdFormatDocumentDefault (16)
$doc.SaveAs([ref]$docxPath, [ref]16)
$doc.Close($true)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Host "Conversion and formatting complete!"
