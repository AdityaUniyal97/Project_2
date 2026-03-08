"""
Sandbox Executor - Safe Code Execution Engine for ProjectGuard AI

Executes student code in a secure, isolated environment.
Primary mode: subprocess with strict timeouts (works on Windows without Docker).
Docker mode: optional escalation for production Linux deployments.

Supports: Python, JavaScript
"""

import json
import tempfile
import os
import subprocess
import re
import asyncio
import sys
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class CodeSandbox:
    """
    Executes student code in an isolated subprocess with strict resource limits.
    This is a cross-platform implementation that works on Windows and Linux.
    For production, Docker isolation can be layered on top.
    """

    def __init__(self):
        logger.info("[Sandbox] Code Sandbox initialized (subprocess mode)")

    async def execute_challenge(
        self,
        student_code: str,
        language: str,
        test_cases: List[Dict],
        original_code: str = None,
        timeout: int = 15
    ) -> Dict[str, Any]:
        """
        Execute student's code against test cases in an isolated subprocess.

        Args:
            student_code: Code submitted by student
            language: "javascript" | "python"
            test_cases: [{"input": {...}, "expected_output": ...}]
            original_code: The original function from their project
            timeout: Max execution time in seconds

        Returns:
            {
                "success": bool,
                "passed_tests": int,
                "total_tests": int,
                "execution_time_ms": float,
                "test_results": [{...}],
                "errors": str | null,
                "verdict": "PASS" | "FAIL" | "ERROR"
            }
        """
        start_time = datetime.now()

        # Security: Validate language
        if language not in ("python", "javascript"):
            return self._error_result(len(test_cases), f"Unsupported language: {language}")

        # Security: Basic code sanitization check
        security_check = self._security_scan(student_code, language)
        if security_check:
            return self._error_result(len(test_cases), f"Security violation: {security_check}")

        # Create temporary directory for code execution
        with tempfile.TemporaryDirectory(prefix="pg_sandbox_") as tmpdir:
            try:
                # Prepare the test harness file
                code_file = self._prepare_code_file(tmpdir, student_code, language, test_cases)

                # Run in subprocess with strict timeout
                output = await self._run_subprocess(code_file, language, timeout)

            except subprocess.TimeoutExpired:
                return self._error_result(
                    len(test_cases),
                    "Code execution timed out. Possible infinite loop detected."
                )
            except Exception as e:
                import traceback
                error_detail = str(e) or repr(e) or "Unknown execution error"
                print(f"[Sandbox] FULL ERROR: {error_detail}")
                traceback.print_exc()
                return self._error_result(len(test_cases), error_detail)

        execution_time = (datetime.now() - start_time).total_seconds() * 1000

        # Parse results
        results = self._parse_results(output, test_cases)
        results["execution_time_ms"] = round(execution_time, 2)

        return results

    def _security_scan(self, code: str, language: str) -> str | None:
        """
        Basic security scan to prevent malicious code execution.
        Returns error message if violation found, None if clean.
        """
        # Dangerous patterns across languages
        dangerous_patterns = [
            (r'\bos\.system\b', "os.system calls are not allowed"),
            (r'\bsubprocess\b', "subprocess module is not allowed"),
            (r'\bopen\s*\(', "File I/O is not allowed in challenges"),
            (r'\b__import__\b', "Dynamic imports are not allowed"),
            (r'\beval\s*\(', "eval() is not allowed"),
            (r'\bexec\s*\(', "exec() is not allowed"),
            (r'\bcompile\s*\(', "compile() is not allowed"),
            (r'\bsocket\b', "Network operations are not allowed"),
            (r'\brequire\s*\(\s*["\']child_process', "child_process is not allowed"),
            (r'\brequire\s*\(\s*["\']fs', "File system access is not allowed"),
            (r'\brequire\s*\(\s*["\']net', "Network access is not allowed"),
            (r'\bprocess\.exit', "process.exit is not allowed"),
            (r'\bimport\s+shutil\b', "shutil is not allowed"),
            (r'\brmtree\b', "Directory deletion is not allowed"),
        ]

        for pattern, message in dangerous_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return message

        return None

    def _prepare_code_file(
        self, tmpdir: str, code: str, language: str, test_cases: List[Dict]
    ) -> str:
        """Prepare executable file with test harness"""
        if language == "python":
            return self._prepare_python_file(tmpdir, code, test_cases)
        elif language == "javascript":
            return self._prepare_js_file(tmpdir, code, test_cases)
        else:
            raise ValueError(f"Unsupported language: {language}")

    def _prepare_python_file(self, tmpdir: str, code: str, test_cases: List[Dict]) -> str:
        """Prepare Python test file with harness"""
        function_name = self._extract_function_name(code, "python")

        test_code = f'''import json
import sys

# Student's code
{code}

# Test harness
test_cases = {json.dumps(test_cases)}
results = []

for index, test_case in enumerate(test_cases):
    try:
        input_data = test_case['input']
        expected = test_case['expected_output']

        # Call student's function
        actual = {function_name}(**input_data)

        # Compare with type coercion for numeric types
        if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
            passed = abs(actual - expected) < 0.001
        else:
            passed = actual == expected

        results.append({{
            'test_num': index + 1,
            'passed': passed,
            'input': input_data,
            'expected': expected,
            'actual': actual,
            'error': None
        }})
    except Exception as error:
        results.append({{
            'test_num': index + 1,
            'passed': False,
            'input': test_case.get('input', {{}}),
            'expected': test_case.get('expected_output'),
            'actual': None,
            'error': str(error)
        }})

# Output results as JSON on the last line
print(json.dumps(results))
'''
        filepath = os.path.join(tmpdir, "solution.py")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(test_code)
        return filepath

    def _prepare_js_file(self, tmpdir: str, code: str, test_cases: List[Dict]) -> str:
        """Prepare JavaScript test file with harness"""
        function_name = self._extract_function_name(code, "javascript")

        test_code = f'''
{code}

// Test harness
const testCases = {json.dumps(test_cases)};
const results = [];

testCases.forEach((testCase, index) => {{
    try {{
        const input = testCase.input;
        const expected = testCase.expected_output;

        // Call student's function with spread input
        const actual = {function_name}(...Object.values(input));

        const passed = JSON.stringify(actual) === JSON.stringify(expected);

        results.push({{
            test_num: index + 1,
            passed: passed,
            input: input,
            expected: expected,
            actual: actual,
            error: null
        }});
    }} catch (error) {{
        results.push({{
            test_num: index + 1,
            passed: false,
            input: testCase.input,
            expected: testCase.expected_output,
            actual: null,
            error: error.message
        }});
    }}
}});

// Output results as JSON
console.log(JSON.stringify(results));
'''
        filepath = os.path.join(tmpdir, "solution.js")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(test_code)
        return filepath

    async def _run_subprocess(self, code_file: str, language: str, timeout: int) -> str:
        """Execute code in a sandboxed subprocess (Windows-compatible)"""
        commands = {
            "python": [sys.executable, code_file],
            "javascript": ["node", code_file],
        }

        command = commands[language]

        # Create a clean environment without inheriting sensitive vars
        clean_env = {
            "PATH": os.environ.get("PATH", ""),
            "PYTHONIOENCODING": "utf-8",
            "LANG": "en_US.UTF-8",
        }

        # Windows-specific env vars needed
        if os.name == 'nt':
            clean_env["SYSTEMROOT"] = os.environ.get("SYSTEMROOT", "")
            clean_env["TEMP"] = os.environ.get("TEMP", "")
            clean_env["TMP"] = os.environ.get("TMP", "")

        def _run_sync():
            """Synchronous subprocess execution (run in thread pool)"""
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=clean_env,
                cwd=os.path.dirname(code_file),
                encoding='utf-8',
                errors='replace'
            )

            if result.returncode != 0:
                if not result.stdout.strip():
                    raise Exception(f"Runtime error:\n{result.stderr}")

            return result.stdout

        # Run synchronous subprocess in a thread to avoid blocking the event loop
        return await asyncio.to_thread(_run_sync)

    def _parse_results(self, output: str, test_cases: List[Dict]) -> Dict:
        """Parse test execution results from subprocess output"""
        try:
            # Extract JSON from last line of output
            lines = output.strip().split('\n')
            json_line = lines[-1]

            test_results = json.loads(json_line)

            passed_tests = sum(1 for r in test_results if r.get('passed', False))
            total_tests = len(test_cases)

            return {
                "success": True,
                "passed_tests": passed_tests,
                "total_tests": total_tests,
                "test_results": test_results,
                "errors": None,
                "verdict": "PASS" if passed_tests == total_tests else "FAIL"
            }

        except json.JSONDecodeError:
            return self._error_result(
                len(test_cases),
                f"Code produced invalid output:\n{output[:500]}"
            )

    def _extract_function_name(self, code: str, language: str) -> str:
        """Extract the primary function name from student code"""
        if language == "python":
            match = re.search(r'def\s+(\w+)\s*\(', code)
            if match:
                return match.group(1)

        elif language == "javascript":
            # Match: function name(...) or const name = (...) =>
            match = re.search(r'function\s+(\w+)', code)
            if match:
                return match.group(1)
            match = re.search(r'(?:const|let|var)\s+(\w+)\s*=', code)
            if match:
                return match.group(1)

        raise ValueError("Could not extract function name from submitted code")

    def _error_result(self, total_tests: int, error_msg: str) -> Dict:
        """Generate a standardized error result"""
        return {
            "success": False,
            "passed_tests": 0,
            "total_tests": total_tests,
            "execution_time_ms": 0,
            "test_results": [],
            "errors": error_msg,
            "verdict": "ERROR"
        }


# Module-level singleton
sandbox = CodeSandbox()
