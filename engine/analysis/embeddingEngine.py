import os
import math

class EmbeddingEngine:
    def __init__(self):
        self.client = None
        try:
            from google import genai
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                self.client = genai.Client(api_key=api_key)
        except ImportError:
            pass

    def embed(self, text: str) -> list[float]:
        # Fast Google Gemini Embedding if available
        if self.client:
            try:
                response = self.client.models.embed_content(
                    model='text-embedding-004',
                    contents=text
                )
                if response.embeddings and len(response.embeddings) > 0:
                    return response.embeddings[0].values
            except Exception as e:
                print(f"[EmbeddingEngine] Gemini API Error: {e}")
                
        # Fallback Pseudo-Embedding (Deterministic Fast Token Hashing)
        vec = [0.0] * 50
        for i, char in enumerate(text.lower()):
            val = ord(char)
            vec[(i * val) % 50] += 0.1
            
        # Normalize
        norm = math.sqrt(sum(v * v for v in vec)) + 1e-9
        return [v / norm for v in vec]
