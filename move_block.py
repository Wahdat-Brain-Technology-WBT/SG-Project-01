with open("src/components/admin/Dashboard.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* 5. Detailed Periodical Reports Table */}" in line:
        start_idx = i
    if "{/* 6. High-Tech Server & System Status (RULE 5) */}" in line:
        end_idx = i

if start_idx != -1 and end_idx != -1:
    block = lines[start_idx:end_idx]
    del lines[start_idx:end_idx]

    insert_idx = -1
    for i, line in enumerate(lines):
        if "<div className=\"grid grid-cols-1 lg:grid-cols-3 gap-8\">" in line:
            insert_idx = i
            break

    if insert_idx != -1:
        lines = lines[:insert_idx] + ["\n"] + block + ["\n"] + lines[insert_idx:]
        with open("src/components/admin/Dashboard.tsx", "w", encoding="utf-8") as f:
            f.writelines(lines)
        print("Moved successfully.")
    else:
        print("Insert index not found.")
else:
    print("Block not found.", start_idx, end_idx)
