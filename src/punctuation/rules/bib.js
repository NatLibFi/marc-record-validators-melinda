var bibrules =
[
  {
    "selector": "[1678]00",
    "namePortion": "$a",
    "description": "Personal name (NR)",
    "portion": "N",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678]10",
    "namePortion": "$a",
    "description": "Corporate name or jurisdiction name as entry element (NR)",
    "portion": "N",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678]11",
    "namePortion": "$a",
    "description": "Meeting name or jurisdiction name as entry element (NR)",
    "portion": "N",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678]00",
    "namePortion": "$b",
    "description": "Numeration (NR)",
    "portion": "N",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678]10",
    "namePortion": "$b",
    "description": "Subordinate unit (R)",
    "portion": "N",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[1678]00",
    "namePortion": "$c",
    "description": "Titles and words associated with a name (R)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[1678](10|11)",
    "namePortion": "$c",
    "description": "Location of meeting (R)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": "- colon if preceded by $d\n- semicolon if preceded by $c"
  },
  {
    "selector": "[1678]00",
    "namePortion": "$d",
    "description": "Dates associated with a name (NR)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": "- colon if preceded by $n"
  },
  {
    "selector": "[1678]11",
    "namePortion": "$d",
    "description": "Date of meeting (NR)",
    "portion": "N",
    "preceedingPunctuation": "",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10)",
    "namePortion": "$e",
    "description": "Relator term (R)",
    "portion": "N",
    "preceedingPunctuation": "cond_comma",
    "exceptions": ""
  },
  {
    "selector": "[1678]11",
    "namePortion": "$e",
    "description": "Subordinate unit (R)",
    "portion": "N",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[1678]11",
    "namePortion": "$j",
    "description": "Relator term (R)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[1678]00",
    "namePortion": "$j",
    "description": "Attribution qualifier (R)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[1678]00",
    "namePortion": "$q",
    "description": "Fuller form of name (NR)",
    "portion": "N",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[1678]11",
    "namePortion": "$q",
    "description": "Name of meeting following jurisdiction name entry element (NR)",
    "portion": "N",
    "preceedingPunctuation": "",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|11)",
    "namePortion": "$u",
    "description": "Affiliation (NR)",
    "portion": "N",
    "preceedingPunctuation": "period",
    "exceptions": "?"
  },
  {
    "selector": "[1678]10",
    "namePortion": "$u",
    "description": "Affiliation (NR) or Address",
    "portion": "N",
    "preceedingPunctuation": "period",
    "exceptions": "- period, if address"
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$4",
    "description": "Relator code (R)",
    "portion": "NC",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$f",
    "description": "Date of a work (NR)",
    "portion": "T",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$h",
    "description": "Medium (NR)   [600/700/800]",
    "portion": "T",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "7(00|10|11)",
    "namePortion": "$i",
    "description": "Relationship information [700] (R)",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$k",
    "description": "Form subheading (R)",
    "portion": "T",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$l",
    "description": "Language of a work (NR)",
    "portion": "T",
    "preceedingPunctuation": "comma / period",
    "exceptions": "- Finnish MARC21 comma,\n- MARC21 period"
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$m",
    "description": "Medium of performance for music (R)   [600/700/800]",
    "portion": "T",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$n",
    "description": "Number of part/section of a work (R)",
    "portion": "T",
    "preceedingPunctuation": "comma, period",
    "exceptions": " - depends on data?\n- period, if preceded by $k, $m, $t\n- comma, if preceded by $b, $m"
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$o",
    "description": "Arranged statement for music (NR)   [600/700/800]",
    "portion": "T",
    "preceedingPunctuation": "semicolon",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$p",
    "description": "Name of part/section of a work (R)",
    "portion": "T",
    "preceedingPunctuation": "comma, period, none",
    "exceptions": "- depends on data?\n- period if preceded by $t, $n, $p\n- comma, if preceded by $n\n- none, if preceded by $k"
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$r",
    "description": "Key for music (NR)   [600/700/800]",
    "portion": "T",
    "preceedingPunctuation": "comma",
    "exceptions": ""
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$s",
    "description": "Version (NR)   [600/700/800]",
    "portion": "T",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$t",
    "description": "Title of a work (NR)",
    "portion": "T",
    "preceedingPunctuation": "none",
    "exceptions": "- usually first in section -> period"
  },
  {
    "selector": "8(00|10|11)",
    "namePortion": "$v",
    "description": "Volume/sequential designation (NR)   [800]",
    "portion": "T",
    "preceedingPunctuation": "semicolon",
    "exceptions": ""
  },
  {
    "selector": "[78](00|10|11)",
    "namePortion": "$x",
    "description": "International Standard Serial Number (NR)   [700/800]",
    "portion": "T",
    "preceedingPunctuation": "period",
    "exceptions": ""
  },
  {
    "selector": "[1678]10",
    "namePortion": "$d",
    "description": "Date of meeting or treaty signing (R)",
    "portion": "NT",
    "preceedingPunctuation": "",
    "exceptions": ""
  },
  {
    "selector": "[1678][10]0",
    "namePortion": "$g",
    "description": "Miscellaneous information (NR)",
    "portion": "NT",
    "preceedingPunctuation": "comma",
    "exceptions": " - colon, if preceded by $d"
  },
  {
    "selector": "[1678]10",
    "namePortion": "$g",
    "description": " Miscellaneous information (NR), other party to treaties.",
    "portion": "NT",
    "preceedingPunctuation": "comma",
    "exceptions": " - colon, if preceded by $d\n- period, if preceded by $t"
  },
  {
    "selector": "[1678]1[01]",
    "namePortion": "$n",
    "description": "Number of part/section/meeting (R)",
    "portion": "NT",
    "preceedingPunctuation": "",
    "exceptions": ""
  },
  {
    "selector": "6(00|10|11)",
    "namePortion": "$v",
    "description": "Form subdivision (R)   [600]",
    "portion": "S",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "6(00|10|11)",
    "namePortion": "$x",
    "description": "General subdivision (R)   [600]",
    "portion": "S",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "6(00|10|11)",
    "namePortion": "$y",
    "description": "Chronological subdivision (R)   [600]",
    "portion": "S",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "6(00|10|11)",
    "namePortion": "$z",
    "description": "Geographic subdivision (R)   [600]",
    "portion": "S",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "8(00|10|11)",
    "namePortion": "$w",
    "description": "Bibliographic record control number (R)   [800]",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$0",
    "description": "Authority record control number (R)",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "6(00|10|11)",
    "namePortion": "$2",
    "description": "Source of heading or term (NR)   [600]",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[678](00|10|11)",
    "namePortion": "$3",
    "description": "Materials specified (NR)   [600/700/800]",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[78](00|10|11)",
    "namePortion": "$5",
    "description": "Institution to which field applies (NR)   [700/800]",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$6",
    "description": "Linkage (NR)",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "8(00|10|11)",
    "namePortion": "$7",
    "description": "Control subfield (NR)   [800]",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$8",
    "description": "Field link and sequence number (R)",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  },
  {
    "selector": "[1678](00|10|11)",
    "namePortion": "$9",
    "description": "Local control subfield",
    "portion": "cf",
    "preceedingPunctuation": "none",
    "exceptions": ""
  }
]
export default bibrules;