"""
Declared languages and dictionaries for multilingual resume handling (E5, X1).

SUPPORTED languages are the only ones SkillBridge claims to read: English, Hindi (Devanagari) and
Spanish. Everything else is detected only so it can be refused with a clear message. All
dictionaries are hand-written here; no model, translation or OCR service is used.
"""
from __future__ import annotations

from typing import Dict, List, Tuple

SUPPORTED: Dict[str, str] = {"en": "English", "hi": "Hindi", "es": "Spanish"}

# Languages recognised only to refuse them politely (Latin-script look-alikes and Marathi, which
# shares the Devanagari script with Hindi).
RECOGNISED_UNSUPPORTED: Dict[str, str] = {
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "mr": "Marathi",
}

# Unicode ranges used to tell scripts apart. Order matters only for reporting.
SCRIPTS: List[Tuple[str, int, int]] = [
    ("latin", 0x0041, 0x024F),
    ("devanagari", 0x0900, 0x097F),
    ("bengali", 0x0980, 0x09FF),
    ("gurmukhi", 0x0A00, 0x0A7F),
    ("gujarati", 0x0A80, 0x0AFF),
    ("tamil", 0x0B80, 0x0BFF),
    ("telugu", 0x0C00, 0x0C7F),
    ("kannada", 0x0C80, 0x0CFF),
    ("malayalam", 0x0D00, 0x0D7F),
    ("arabic", 0x0600, 0x06FF),
    ("cyrillic", 0x0400, 0x04FF),
    ("cjk", 0x4E00, 0x9FFF),
]

SCRIPT_NAMES = {
    "bengali": "Bengali script",
    "gurmukhi": "Gurmukhi (Punjabi) script",
    "gujarati": "Gujarati script",
    "tamil": "Tamil script",
    "telugu": "Telugu script",
    "kannada": "Kannada script",
    "malayalam": "Malayalam script",
    "arabic": "Arabic script (e.g. Urdu)",
    "cyrillic": "Cyrillic script",
    "cjk": "Chinese/Japanese characters",
}

# Frequent function words per language; only whole words count.
STOPWORDS: Dict[str, set] = {
    "en": set("the and of to in for with on at by from as is was are an a my i this that have has".split()),
    "es": set("de la que el en y los del las por con para una un como su al es lo se sus mi más".split()),
    "fr": set("le la les des et du une un pour avec dans sur est au aux par en ce qui".split()),
    "de": set("der die das und mit für von zu im ist ein eine den dem bei auf als".split()),
    "pt": set("de da do em para com uma um os as dos das por no na é e".split()),
    "hi": set("और के की का में है से को पर एक या तक भी लिए कि ने".split()),
    "mr": set("आणि च्या मध्ये आहे या व ला हे की केले होते".split()),
}

# Section headings, written as they appear in resumes, mapped to canonical section keys.
SECTION_HEADINGS: Dict[str, Dict[str, List[str]]] = {
    "en": {
        "summary": ["summary", "professional summary", "profile", "objective", "career objective", "about me"],
        "experience": ["experience", "work experience", "professional experience", "employment history", "work history"],
        "education": ["education", "academic background", "qualifications", "academic qualifications"],
        "skills": ["skills", "technical skills", "key skills", "core skills"],
        "projects": ["projects", "academic projects", "personal projects"],
        "certifications": ["certifications", "certificates", "licenses and certifications"],
        "languages": ["languages"],
        "contact": ["contact", "contact details", "contact information"],
    },
    "hi": {
        "summary": ["सारांश", "परिचय", "उद्देश्य", "करियर उद्देश्य", "व्यावसायिक सारांश"],
        "experience": ["अनुभव", "कार्य अनुभव", "व्यावसायिक अनुभव", "कार्यानुभव"],
        "education": ["शिक्षा", "शैक्षिक योग्यता", "शैक्षणिक योग्यता", "शैक्षिक विवरण"],
        "skills": ["कौशल", "तकनीकी कौशल", "प्रमुख कौशल"],
        "projects": ["परियोजनाएँ", "परियोजनाएं", "परियोजना", "प्रोजेक्ट"],
        "certifications": ["प्रमाणपत्र", "प्रमाण पत्र", "प्रमाणन"],
        "languages": ["भाषाएँ", "भाषाएं", "भाषा ज्ञान"],
        "contact": ["संपर्क", "संपर्क विवरण", "संपर्क जानकारी"],
    },
    "es": {
        "summary": ["resumen", "perfil", "perfil profesional", "objetivo", "objetivo profesional", "sobre mí", "sobre mi"],
        "experience": ["experiencia", "experiencia laboral", "experiencia profesional", "historial laboral"],
        "education": ["educación", "educacion", "formación", "formacion", "formación académica", "formacion academica"],
        "skills": ["habilidades", "competencias", "conocimientos", "aptitudes", "habilidades técnicas", "habilidades tecnicas"],
        "projects": ["proyectos"],
        "certifications": ["certificaciones", "certificados"],
        "languages": ["idiomas"],
        "contact": ["contacto", "datos de contacto", "información de contacto"],
    },
}

MONTHS: Dict[str, Dict[str, int]] = {
    "en": {
        **{m: i + 1 for i, m in enumerate("january february march april may june july august september october november december".split())},
        **{m: i + 1 for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split())},
        "sept": 9,
    },
    "es": {
        **{m: i + 1 for i, m in enumerate("enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre".split())},
        **{m: i + 1 for i, m in enumerate("ene feb mar abr may jun jul ago sep oct nov dic".split())},
        "setiembre": 9,
        "sept": 9,
    },
    "hi": {
        "जनवरी": 1, "फ़रवरी": 2, "फरवरी": 2, "मार्च": 3, "अप्रैल": 4, "मई": 5, "जून": 6, "जुलाई": 7, "अगस्त": 8,
        "सितंबर": 9, "सितम्बर": 9, "अक्टूबर": 10, "अक्तूबर": 10, "नवंबर": 11, "नवम्बर": 11, "दिसंबर": 12, "दिसम्बर": 12,
    },
}

PRESENT_WORDS = {"present", "current", "now", "till date", "to date", "actualidad", "presente", "actual", "la fecha", "वर्तमान", "अब तक", "आज तक"}

# Words that join the two ends of a date range, besides dashes.
RANGE_WORDS = {"to", "till", "until", "a", "hasta", "al", "से", "तक"}

DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")

# Skill names written in Hindi or Spanish words, mapped to lexicon names. Deliberately small and
# listed in the documentation; tool names (Python, SQL...) are usually written in Latin script and
# are found by the lexicon directly. Matched as whole words, case-insensitively.
TRANSLATED_SKILL_TERMS: Dict[str, str] = {
    # Hindi (Devanagari)
    "पायथन": "Python",
    "जावा": "Java",
    "जावास्क्रिप्ट": "JavaScript",
    "एसक्यूएल": "SQL",
    "रिएक्ट": "React",
    "डॉकर": "Docker",
    "लिनक्स": "Linux",
    "एक्सेल": "Excel",
    "गिट": "Git",
    "मशीन लर्निंग": "Machine Learning",
    "डेटा विश्लेषण": "Data Analysis",
    "सांख्यिकी": "Statistics",
    # Spanish
    "estadística": "Statistics",
    "estadistica": "Statistics",
    "análisis de datos": "Data Analysis",
    "analisis de datos": "Data Analysis",
    "aprendizaje automático": "Machine Learning",
    "aprendizaje automatico": "Machine Learning",
}
