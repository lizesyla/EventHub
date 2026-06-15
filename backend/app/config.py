from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRES_MINUTES: int = 15
    JWT_REFRESH_EXPIRES_DAYS: int = 7

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()