from engine.core.dna_engine import CodeDNAEngine
from engine.core.registry import PlagiarismRegistry
import json
import os

def test_layer_1_plagiarism():
    # 1. Setup
    engine = CodeDNAEngine()
    registry = PlagiarismRegistry("test_registry.json")

    # 2. Mock 'Student 1' Project (original for now)
    # We will simulate processing the 'engine' folder we just created as a project
    print("\n[+] Processing Project for Student_101...")
    project_path = "c:\\Users\\Victus\\Project2\\Project_2\\engine"
    student_1_dna = engine.process_project(project_path)
    
    # 3. Add Student 1 to Registry
    registry.add_project("STUDENT_101", student_1_dna)
    print(f"    - Student_101 added (Files: {student_1_dna['total_files']})")

    # 4. Mock 'Student 2' Project (Submission that copied exactly)
    print("\n[+] Processing Submission for Student_202 (The Copycat)...")
    # Simulation: We use the same path to simulate an identical project logic
    student_2_dna = engine.process_project(project_path)

    # 5. Check for Layer 1 Matches
    matches = registry.check_for_dna_matches("STUDENT_202", student_2_dna)

    if matches:
        print("\n" + "!"*40)
        print("ALERT: PLAGIARISM DETECTED at LAYER 1")
        for match in matches:
            print(f" - Matches against: {match['against_student_id']}")
            print(f" - Similarity Score: {match['similarity_score']}%")
            print(f" - Matched Files: {match['matched_files_count']} of {student_2_dna['total_files']}")
        print("!"*40)
    else:
        print("\n[+] No Layer 1 matches found.")

    # Cleanup test registry
    if os.path.exists("test_registry.json"):
        os.remove("test_registry.json")

if __name__ == "__main__":
    test_layer_1_plagiarism()
