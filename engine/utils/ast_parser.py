import ast
from typing import List
from engine.utils.hashing import Hashing
from engine.models.signals import ParsedFunction

class ASTParser:
    """
    Utility for structural code analysis.
    Phase 1: Pure Python `ast` module (Zero external dependencies).
    Extracts structural logic of functions to detect plagiarism even when variables are renamed.
    """

    @classmethod
    def parse_python_functions(cls, file_content: str, file_path: str) -> List[ParsedFunction]:
        """
        Parses python code into an AST and extracts function bodies.
        Normalizes the AST by anonymizing variables to catch logic thieves.
        """
        functions = []
        try:
            tree = ast.parse(file_content, filename=file_path)
        except SyntaxError:
            # If the code is broken or not Python 3, we can't parse it structurally.
            return functions

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # We need to extract the structural logic.
                # Simplest way in Python without a decompiler is dumping the AST representation of the node.
                # We anonymize variable names to generate the exact same AST string even if 'user' becomes 'student'
                
                normalized_ast_str = cls._anonymize_ast(node)
                
                func_hash = Hashing.generate_sha256(normalized_ast_str)
                
                functions.append(ParsedFunction(
                    name=node.name,
                    body=normalized_ast_str,
                    hash=func_hash,
                    size=len(normalized_ast_str)
                ))
                
        return functions

    @classmethod
    def _anonymize_ast(cls, node: ast.AST) -> str:
        """
        Walks the AST node and strips out specific names/IDs.
        This turns: `def login(user): return user.id`
        And:        `def auth(x): return x.id`
        Into the exact same structural hash.
        """
        class Anonymizer(ast.NodeTransformer):
            def visit_Name(self, node):
                # Anonymize all variable names
                return ast.Name(id="VAR", ctx=node.ctx)
                
            def visit_arg(self, node):
                # Anonymize function arguments
                return ast.arg(arg="ARG", annotation=node.annotation)

        anonymized_node = Anonymizer().visit(node)
        
        # ast.dump returns a string representation of the AST structure
        # (Include attributes=False to ignore line numbers which change)
        return ast.dump(anonymized_node, annotate_fields=False)
