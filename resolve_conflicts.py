import os

files = [
    "backend/app/main.py",
    "backend/app/auth/oauth.py",
    "backend/app/auth/router.py",
    "backend/app/services/auth_service.py"
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    # We want to keep HEAD for all conflicts
    new_lines = []
    lines = content.split('\n')
    state = "NORMAL"
    for line in lines:
        if line.startswith("<<<<<<< HEAD"):
            state = "HEAD"
        elif line.startswith("======="):
            state = "THEIRS"
        elif line.startswith(">>>>>>>"):
            state = "NORMAL"
        else:
            if state == "NORMAL" or state == "HEAD":
                new_lines.append(line)
    
    with open(file, 'w') as f:
        f.write('\n'.join(new_lines))

print("Conflicts resolved to HEAD.")
