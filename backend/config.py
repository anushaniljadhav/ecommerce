import os
from datetime import timedelta

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    # MongoDB Configuration
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb+srv://anushjadhav:anush3108@ecommerce.ppn25ky.mongodb.net/ '
    
    # CORS Configuration
    # Allow both ports 3000 and 3001 (frontend dev server may run on either)
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
    ]
    
    # Application Configuration
    DEBUG = True
    PORT = 5000

class ProductionConfig(Config):
    DEBUG = False
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://anushjadhav:anush3108@ecommerce.ppn25ky.mongodb.net/ ')

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb+srv://anushjadhav:anush3108@ecommerce.ppn25ky.mongodb.net/ '
