import re
from typing import Dict, Any, List
from engine.models.signals import ProjectMap

class ContextExtractor:
    """
    Extracts high-level architectural and logical context without sending raw code.
    Generates a dense machine-readable project summary for the LLM.
    """

    # Basic heuristic signatures for algorithms
    ALGORITHM_SIGNATURES = {
        "Dijkstra": ["dijkstra", "priorityqueue", "shortestpath", "relax"],
        "BFS": ["bfs", "breadthfirst", "queue", "visited"],
        "DFS": ["dfs", "depthfirst", "stack", "recursion"],
        "JWT": ["jwt", "jsonwebtoken", "sign", "verify"],
        "A*": ["astar", "heuristic", "fcost", "gcost"],
        "OAuth": ["oauth", "access_token", "refresh_token"]
    }

    # Basic heuristic signatures for frameworks
    FRAMEWORK_SIGNATURES = {
        "React": ["react", "jsx", "useeffect", "usestate"],
        "Flask": ["flask", "app.route", "render_template"],
        "Express": ["express", "app.get", "app.listen"],
        "Django": ["django", "models.model", "views"],
        "FastAPI": ["fastapi", "apirouter", "pydantic"]
    }

    @classmethod
    def generate_summary(cls, project_map: ProjectMap) -> Dict[str, Any]:
        """
        Processes the ProjectMap to create a highly condensed intelligence summary.
        """
        all_functions = []
        frameworks_detected = set()
        algorithms_detected = set()
        imports_detected = set()
        directory_structure = set()

        # Simple Regex to catch imports across Python & JS
        import_regex = re.compile(r'^(?:import|from)\s+([a-zA-Z0-9_\.]+)|\brequire\([\'"]([a-zA-Z0-9_\.\-]+)[\'"]\)', re.MULTILINE)

        for parsed_file in project_map.files:
            # 1. Folder Structure Mapping
            directory_structure.add(parsed_file.path)

            # 2. Extract Imports
            matches = import_regex.findall(parsed_file.content)
            for m in matches:
                module = m[0] if m[0] else m[1]
                if module: imports_detected.add(module.split('.')[0])

            # 3. Compile Functions
            for func in parsed_file.functions:
                all_functions.append({
                    "name": func.name,
                    "size": func.size,
                    "file": parsed_file.path
                })
                
                # Check for algorithms based on function names 
                lower_name = func.name.lower()
                for algo, keywords in cls.ALGORITHM_SIGNATURES.items():
                    if any(kw in lower_name for kw in keywords):
                        algorithms_detected.add(algo)
                        
            # Check for generic algorithms & frameworks in the file content based on heuristics
            content_lower = parsed_file.content.lower()
            for frame, keywords in cls.FRAMEWORK_SIGNATURES.items():
                if any(kw in content_lower for kw in keywords):
                    frameworks_detected.add(frame)
                    
            for algo, keywords in cls.ALGORITHM_SIGNATURES.items():
                if any(kw in content_lower for kw in keywords):
                    algorithms_detected.add(algo)

        # 4. Top 10 Largest Functions (Where the core logic likely resides)
        all_functions.sort(key=lambda x: x["size"], reverse=True)
        top_10_functions = all_functions[:10]

        return {
            "top_10_largest_functions": top_10_functions,
            "detected_frameworks": list(frameworks_detected),
            "detected_algorithms": list(algorithms_detected),
            "top_imports": list(imports_detected)[:15], # Limit to save tokens
            "total_functions_count": len(all_functions),
            "directory_structure_sample": list(directory_structure)[:20] # Limit to save tokens
        }
