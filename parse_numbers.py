import json
from numbers_parser import Document

doc = Document("chicago_sports_events.numbers")
sheets = doc.sheets
tables = sheets[0].tables
data = tables[0].rows()

out = []
headers = [str(cell.value) if cell else f"Col{i}" for i, cell in enumerate(data[0])]

for row in data[1:]:
    row_data = {}
    for i, cell in enumerate(row):
        row_data[headers[i]] = str(cell.value) if cell else ""
    out.append(row_data)

with open("chicago_sports_events.json", "w") as f:
    json.dump(out, f, indent=2)
