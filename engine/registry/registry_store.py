import sqlite3
import json
from typing import Dict, List, Set, Any
from engine.models.signals import ProjectMap

class RegistryStore:
    """
    Abstration Layer for the Project Database using SQLite.
    Scales efficiently for 6000+ students. 
    ONLY stores mathematical signatures, NO raw code.
    """
    def __init__(self, db_path: str = "registry.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Creates tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS projects (
                    project_id TEXT PRIMARY KEY,
                    project_name TEXT,
                    project_signature TEXT,
                    total_files INTEGER
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS file_hashes (
                    file_hash TEXT,
                    project_id TEXT,
                    FOREIGN KEY(project_id) REFERENCES projects(project_id)
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS function_hashes (
                    function_hash TEXT,
                    project_id TEXT,
                    FOREIGN KEY(project_id) REFERENCES projects(project_id)
                )
            ''')
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_file_hash ON file_hashes(file_hash)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_function_hash ON function_hashes(function_hash)')
            
            conn.commit()

    def register_project(self, project_map: ProjectMap):
        """
        Saves a project's DNA into the SQLite registry.
        """
        pid = project_map.project_id
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO projects 
                (project_id, project_name, project_signature, total_files)
                VALUES (?, ?, ?, ?)
            ''', (pid, project_map.project_name, project_map.project_signature, project_map.total_files))

            cursor.execute('DELETE FROM file_hashes WHERE project_id = ?', (pid,))
            cursor.execute('DELETE FROM function_hashes WHERE project_id = ?', (pid,))
            
            hashes_data = [(f.hash, pid) for f in project_map.files]
            cursor.executemany('INSERT INTO file_hashes (file_hash, project_id) VALUES (?, ?)', hashes_data)
            
            # Extract and insert function hashes safely spanning files
            func_data = [(func.hash, pid) for f in project_map.files for func in f.functions]
            if func_data:
                cursor.executemany('INSERT INTO function_hashes (function_hash, project_id) VALUES (?, ?)', func_data)
            
            conn.commit()

    def find_matches(self, project_map: ProjectMap) -> Dict[str, Any]:
        """
        Compares a new project against the entire registry using SQL.
        Returns matched projects and their overlapping hashes at file AND function levels.
        """
        new_signature = project_map.project_signature
        new_file_hashes = list({f.hash for f in project_map.files}) 
        new_func_hashes = list({func.hash for f in project_map.files for func in f.functions})
        
        exact_match_ids = []
        file_collision_map = {} # { matched_project_id: set(collided_file_hashes) }
        func_collision_map = {} # { matched_project_id: set(collided_func_hashes) }
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if new_signature:
                cursor.execute('''
                    SELECT project_id FROM projects 
                    WHERE project_signature = ? AND project_id != ?
                ''', (new_signature, project_map.project_id))
                exact_match_ids = [row[0] for row in cursor.fetchall()]

            if new_file_hashes:
                chunk_size = 900
                for i in range(0, len(new_file_hashes), chunk_size):
                    chunk = new_file_hashes[i:i + chunk_size]
                    placeholders = ','.join('?' * len(chunk))
                    
                    query = f'SELECT project_id, file_hash FROM file_hashes WHERE file_hash IN ({placeholders}) AND project_id != ?'
                    
                    params = tuple(chunk) + (project_map.project_id,)
                    cursor.execute(query, params)
                    
                    for row in cursor.fetchall():
                        matched_pid, matched_hash = row[0], row[1]
                        if matched_pid not in file_collision_map: file_collision_map[matched_pid] = set()
                        file_collision_map[matched_pid].add(matched_hash)

            if new_func_hashes:
                chunk_size = 900
                for i in range(0, len(new_func_hashes), chunk_size):
                    chunk = new_func_hashes[i:i + chunk_size]
                    placeholders = ','.join('?' * len(chunk))
                    
                    query = f'SELECT project_id, function_hash FROM function_hashes WHERE function_hash IN ({placeholders}) AND project_id != ?'
                    
                    params = tuple(chunk) + (project_map.project_id,)
                    cursor.execute(query, params)
                    
                    for row in cursor.fetchall():
                        matched_pid, matched_hash = row[0], row[1]
                        if matched_pid not in func_collision_map: func_collision_map[matched_pid] = set()
                        func_collision_map[matched_pid].add(matched_hash)

        return {
            "exact_project_matches": exact_match_ids,
            "file_collisions": file_collision_map,
            "func_collisions": func_collision_map,
            "total_new_files": len(new_file_hashes),
            "total_new_funcs": len(new_func_hashes)
        }
