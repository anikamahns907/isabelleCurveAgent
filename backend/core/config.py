import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY")
    
    # CORS settings
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    @property
    def allowed_origins(self) -> list[str]:
        """Get allowed CORS origins based on environment"""
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        
        # Add production frontend URL if provided (strip trailing slash for consistency)
        if self.FRONTEND_URL:
            frontend_url = self.FRONTEND_URL.rstrip("/")
            origins.append(frontend_url)
            # Also add with trailing slash in case it's needed
            if frontend_url != self.FRONTEND_URL:
                origins.append(self.FRONTEND_URL)
        
        # Add additional production URLs from comma-separated env var
        # Example: ALLOWED_ORIGINS=https://myapp.vercel.app,https://myapp.com
        additional_origins = os.getenv("ALLOWED_ORIGINS", "")
        if additional_origins:
            origins.extend([origin.strip().rstrip("/") for origin in additional_origins.split(",") if origin.strip()])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_origins = []
        for origin in origins:
            if origin not in seen:
                seen.add(origin)
                unique_origins.append(origin)
        
        return unique_origins
    
    @property
    def allowed_origin_regex(self) -> str | None:
        """Regex pattern to allow Vercel preview URLs dynamically"""
        # Allow all Vercel preview deployments (*.vercel.app)
        return r"https://.*\.vercel\.app"


settings = Settings()
