from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GROQ_API_KEY: str = ""
    GROQ_EXTRACTION_MODEL: str = "gemma2-9b-it"
    GROQ_REASONING_MODEL: str = "llama-3.3-70b-versatile"

    DATABASE_URL: str = "sqlite:///./aivoa_complaints.db"
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
