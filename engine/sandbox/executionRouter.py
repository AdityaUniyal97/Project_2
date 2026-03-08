"""
LANGUAGE-SPECIFIC CODE EXECUTION — Phase 4
executionRouter.py

Automatically chooses the correct runtime environment based on programming language.
Supports Python, Node.js, Java, and C++.
Disables direct execution for React components and forces architecture questions.
"""

import os
import subprocess
import tempfile
import json
from typing import Dict, Any, List

class ExecutionRouter:
    def __init__(self):
        self.supported_languages = ['python', 'javascript', 'java', 'cpp']
        self.react_extensions = ['.jsx', '.tsx']

    def execute_code(self, code: str, language: str, test_cases: List[Dict[str, Any]], filename: str = "main") -> Dict[str, Any]:
        """
        Routes the code to the appropriate sandbox runtime.
        """
        if any(filename.endswith(ext) for ext in self.react_extensions) or 'react' in code.lower() or 'export default function' in code:
            return {
                "success": False,
                "status": "DISABLED_COMPILATION",
                "message": "React component execution disabled. Transitioning to architectural viva evaluation.",
                "test_results": []
            }

        language = language.lower()
        if language not in self.supported_languages:
            return {
                "success": False,
                "status": "UNSUPPORTED_LANGUAGE",
                "message": f"Execution for {language} is not currently supported.",
                "test_results": []
            }

        # Setup temporary execution directory
        with tempfile.TemporaryDirectory() as temp_dir:
            file_path = ""
            run_cmd = []

            # Write code to file and setup commands based on language
            if language == 'python':
                file_path = os.path.join(temp_dir, f"{filename}.py")
                with open(file_path, 'w') as f:
                    f.write(code)
                run_cmd = ['python', file_path]
            elif language == 'javascript':
                file_path = os.path.join(temp_dir, f"{filename}.js")
                with open(file_path, 'w') as f:
                    f.write(code)
                run_cmd = ['node', file_path]
            elif language == 'java':
                # Java requires class name to match file name. Assuming "Main"
                file_path = os.path.join(temp_dir, "Main.java")
                with open(file_path, 'w') as f:
                    # Very simple fallback: wrap code if it's not a class
                    if "class " not in code:
                        wrapped_code = f"public class Main {{ public static void main(String[] args) {{ {code} }} }}"
                        f.write(wrapped_code)
                    else:
                        f.write(code)
                # Compile Java
                compile_proc = subprocess.run(['javac', file_path], capture_output=True, text=True)
                if compile_proc.returncode != 0:
                    return {"success": False, "status": "COMPILATION_ERROR", "message": compile_proc.stderr, "test_results": []}
                run_cmd = ['java', '-cp', temp_dir, "Main"]
            elif language == 'cpp':
                file_path = os.path.join(temp_dir, f"{filename}.cpp")
                exe_path = os.path.join(temp_dir, f"{filename}.exe" if os.name == 'nt' else filename)
                with open(file_path, 'w') as f:
                    f.write(code)
                # Compile C++
                compile_proc = subprocess.run(['g++', file_path, '-o', exe_path], capture_output=True, text=True)
                if compile_proc.returncode != 0:
                    return {"success": False, "status": "COMPILATION_ERROR", "message": compile_proc.stderr, "test_results": []}
                run_cmd = [exe_path]

            results = []
            passed_cases = 0

            # Execute tests
            for test in test_cases:
                input_data = test.get("input", "")
                expected_output = test.get("expected_output", "").strip()
                hidden = test.get("hidden", False)

                try:
                    # Provide test input via arguments or stdin.
                    # This is basic stdin implementation for algorithms
                    proc = subprocess.run(
                        run_cmd,
                        input=input_data,
                        capture_output=True,
                        text=True,
                        timeout=5  # Sandbox timeout
                    )

                    actual_output = proc.stdout.strip()
                    error_output = proc.stderr.strip()

                    passed = (actual_output == expected_output and proc.returncode == 0)
                    if passed: passed_cases += 1

                    results.append({
                        "id": test.get("id", "1"),
                        "input": input_data if not hidden else "[HIDDEN]",
                        "expected": expected_output if not hidden else "[HIDDEN]",
                        "actual": actual_output if not hidden else "***",
                        "error": error_output,
                        "passed": passed,
                        "hidden": hidden
                    })

                except subprocess.TimeoutExpired:
                    results.append({
                        "id": test.get("id", "1"),
                        "input": input_data if not hidden else "[HIDDEN]",
                        "expected": expected_output if not hidden else "[HIDDEN]",
                        "actual": "",
                        "error": "Timeout Exceeded (Possible Infinite Loop)",
                        "passed": False,
                        "hidden": hidden
                    })

            success = passed_cases == len(test_cases) and len(test_cases) > 0

            return {
                "success": success,
                "status": "COMPLETED",
                "total_tests": len(test_cases),
                "passed_tests": passed_cases,
                "score": int((passed_cases / max(1, len(test_cases))) * 100),
                "test_results": results
            }
