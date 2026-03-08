from engine.core.dna_engine import CodeDNAEngine
from engine.core.registry import PlagiarismRegistry
import os

def run_layer1_demonstration():
    """
    Shows how ProjectGuard AI catches similarity at ₹0 cost.
    """
    print("="*60)
    print(" PROJECTGUARD AI: LAYER 1 COLD TEST")
    print("="*60)

    # 1. Initialize Engine
    engine = CodeDNAEngine()
    db_file = "demo_registry.json"
    registry = PlagiarismRegistry(db_file)
    
    # Use our own 'engine' directory as the test project
    project_path = os.path.join(os.getcwd(), "engine")
    
    # 2. Student A Submits
    print("\n[+] Student_A submits the engine core...")
    dna_a = engine.process_project(project_path)
    registry.add_project("STUDENT_A", dna_a)
    print(f"    SIGNATURE: {dna_a['project_signature'][:10]}...")

    # 3. Student B Submits (The Copycat)
    print("\n[+] Student_B submits the same folder...")
    dna_b = engine.process_project(project_path)
    
    # 4. The Verdict
    print("\n[+] ANALYZING FOR PLAGIARISM...")
    matches = registry.find_matches("STUDENT_B", dna_b)

    if matches:
        for m in matches:
            rep = m['report']
            print("\n" + "!"*40)
            print(f" ALERT: MATCH FOUND ({m['student_id']})")
            print(f" VERDICT: {rep['verdict']}")
            print(f" SCORE: {rep['total_score']}%")
            print(f" SHARED LOGIC: {rep['func_overlap_perc']}%")
            print("!"*40)
    else:
        print("\n[+] No similarity detected.")

    # Cleanup
    if os.path.exists(db_file):
        os.remove(db_file)

if __name__ == "__main__":
    run_layer1_demonstration()
