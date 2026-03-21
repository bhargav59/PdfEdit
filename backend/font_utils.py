from pathlib import Path

def suggest_font_from_pdf(file_path: Path) -> str:
    """Extract font usage from PDF and suggest the best matching supported font."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        fonts_count = {}
        for page in reader.pages:
            if "/Resources" in page and "/Font" in page["/Resources"]:
                font_dict = page["/Resources"]["/Font"].get_object()
                for key in font_dict:
                    f_obj = font_dict[key].get_object()
                    base_font = f_obj.get("/BaseFont")
                    if base_font:
                        name = str(base_font)
                        if name.startswith("/"):
                            name = name[1:]
                        if "+" in name:
                            name = name.split("+")[1]
                        fonts_count[name] = fonts_count.get(name, 0) + 1
        
        if fonts_count:
            most_common = sorted(fonts_count.items(), key=lambda x: x[1], reverse=True)[0][0]
            mc_lower = most_common.lower()
            
            if "times" in mc_lower or "serif" in mc_lower:
                if "bold" in mc_lower: return "Times-Bold"
                if "italic" in mc_lower: return "Times-Italic"
                return "Times-Roman"
            if "courier" in mc_lower or "mono" in mc_lower:
                if "bold" in mc_lower: return "Courier-Bold"
                return "Courier"
            if "roboto" in mc_lower: return "Roboto"
            if "lato" in mc_lower: return "Lato"
            if "montserrat" in mc_lower: return "Montserrat"
            if "open" in mc_lower and "sans" in mc_lower: return "OpenSans"
            
            if "bold" in mc_lower: return "Helvetica-Bold"
            if "oblique" in mc_lower or "italic" in mc_lower: return "Helvetica-Oblique"
            
    except Exception as e:
        import logging
        logging.warning(f"Failed to extract font: {str(e)}")

    return "Helvetica"