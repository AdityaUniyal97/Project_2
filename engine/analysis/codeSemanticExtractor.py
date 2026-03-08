import re

class CodeSemanticExtractor:
    def extract_semantics(self, code: str, language: str = "python") -> str:
        # Simplistic regex-based concept extraction for speed
        # Semantic concept mapping
        concepts = []
        lower_code = code.lower()
        if any(w in lower_code for w in ['sql', 'mongo', 'db', 'schema', 'collection']): concepts.append("Persistence/Database")
        if any(w in lower_code for w in ['jwt', 'auth', 'bcrypt', 'crypt', 'login']): concepts.append("Security/Authentication")
        if any(w in lower_code for w in ['api', 'route', 'express', 'flask', 'controller']): concepts.append("Web Services/Routing")
        if any(w in lower_code for w in ['sort', 'tree', 'graph', 'hash', 'recursive']): concepts.append("Algorithms/DataStructures")
        if any(w in lower_code for w in ['react', 'vue', 'component', 'props', 'state']): concepts.append("Frontend Architecture")

        libraries = re.findall(r'(?:import|require|include|from)[\s\(]+([a-zA-Z0-9_\-\.]+)', code)
        functions = re.findall(r'(?:function|def|class)\s+([a-zA-Z0-9_]+)', code)
        methods = re.findall(r'\.([a-zA-Z0-9_]+)\(', code)

        all_terms = set(libraries + functions + methods)
        if not all_terms and not concepts:
            return f"Generic {language} code snippet."

        summary = f"Code Concepts: {', '.join(concepts)}. " if concepts else ""
        summary += f"Technical Components: {', '.join(list(all_terms)[:15])}."
        
        return summary
