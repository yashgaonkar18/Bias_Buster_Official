import os
import re

ROUTERS_DIR = "app/routers"

for file in os.listdir(ROUTERS_DIR):
    if file.endswith(".py") and file != "__init__.py":
        filepath = os.path.join(ROUTERS_DIR, file)
        with open(filepath, "r") as f:
            content = f.read()
        
        # Add imports if missing
        if "get_current_user" not in content:
            content = "from app.auth.dependencies import get_current_user\nfrom app.models.user import User\n" + content
            
        # Add current_user to endpoint parameters
        # regex to find def ...(...)
        # We find @router.post or @router.get, then the following async def ...(...)
        
        def add_dependency(match):
            func_def = match.group(0)
            if "current_user" in func_def:
                return func_def
            if func_def.endswith(")"):
                return func_def[:-1] + ", current_user: User = Depends(get_current_user))"
            elif func_def.endswith(":"):
                # Handle async def func(
                #   ...
                # ):
                pass # This needs more complex parsing
            return func_def

        # Let's just use sed or Python regex.
        # It's easier to just protect the routers in main.py.
