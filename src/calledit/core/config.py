"""Application configuration loaded from the environment."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings, prefixed CALLEDIT_ in the environment."""

    model_config = SettingsConfigDict(env_prefix="CALLEDIT_", env_file=".env")

    db_path: str = "calledit.db"
    frontend_dir: str = "frontend"
    cors_origins: str = "*"


settings = Settings()
