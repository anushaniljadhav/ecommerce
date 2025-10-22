# auth.py
from werkzeug.security import generate_password_hash, check_password_hash

def init_auth(app):
    """No-op for werkzeug-based hashing; kept for compatibility."""
    # werkzeug hashing functions do not require Flask app initialization
    return None

def hash_password(password):
    """Hash a password for storing."""
    return generate_password_hash(password)

def check_password(hashed, password):
    """Check if a plain password matches the stored hash.

    The rest of the code calls `check_password(user['password'], provided)`
    (i.e. hashed first, plain second). Keep the signature consistent with
    that usage and forward to werkzeug's check_password_hash.
    """
    return check_password_hash(hashed, password)
