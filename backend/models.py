# Try to import pymongo; if not available, fall back to mongomock for local testing/dev
import importlib

# Prefer real pymongo if available, otherwise fall back to mongomock
try:
    pymongo = importlib.import_module('pymongo')
    MongoClient = pymongo.MongoClient
except ImportError:
    try:
        mongomock = importlib.import_module('mongomock')
        MongoClient = mongomock.MongoClient
    except ImportError:
        raise ImportError("pymongo is not installed; install with: pip install pymongo (or pip install mongomock for tests)")

# Import ObjectId from bson dynamically to avoid static import errors in editors/linters
try:
    bson = importlib.import_module('bson')
    if hasattr(bson, 'ObjectId'):
        ObjectId = bson.ObjectId
    else:
        ObjectId = importlib.import_module('bson.objectid').ObjectId
except Exception:
    # Provide a clear runtime error if ObjectId is absent
    def _missing_objectid(*args, **kwargs):
        raise ImportError("bson.ObjectId is not available; install 'pymongo' or the 'bson' package")
    ObjectId = _missing_objectid

from datetime import datetime

client = MongoClient('mongodb+srv://anushjadhav:anush3108@ecommerce.ppn25ky.mongodb.net/')
db = client.ecommerce

class User:
    @staticmethod
    def create_user(name, email, password):
        return {
            'name': name,
            'email': email,
            'password': password,
            'cart': [],
            # track admin flag and login/activity info
            'is_admin': False,
            'login_count': 0,
            'last_login': None,
            'created_at': datetime.utcnow()
        }
    
    @staticmethod
    def find_by_email(email):
        return db.users.find_one({'email': email})
    
    @staticmethod
    def find_by_id(user_id):
        return db.users.find_one({'_id': ObjectId(user_id)})
    
    @staticmethod
    def update_cart(user_id, cart):
        return db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'cart': cart}}
        )

    @staticmethod
    def get_all_users():
        return list(db.users.find())

    @staticmethod
    def set_admin(user_id, is_admin=True):
        return db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'is_admin': is_admin}}
        )

    @staticmethod
    def delete_user(user_id):
        return db.users.delete_one({'_id': ObjectId(user_id)})

    @staticmethod
    def increment_login(user_id):
        return db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'login_count': 1}, '$set': {'last_login': datetime.utcnow()}}
        )

class Product:
    @staticmethod
    def get_all():
        return list(db.products.find())
    
    @staticmethod
    def get_by_id(product_id):
        return db.products.find_one({'_id': ObjectId(product_id)})
    
    @staticmethod
    def create_product(name, description, price, image, category, stock):
        return {
            'name': name,
            'description': description,
            'price': price,
            'image': image,
            'category': category,
            'stock': stock,
            'created_at': datetime.utcnow()
        }

class Order:
    @staticmethod
    def create_order(user_id, items, total, shipping_address):
        return {
            'user_id': user_id,
            'items': items,
            'total': total,
            'shipping_address': shipping_address,
            'status': 'pending',
            'created_at': datetime.utcnow()
        }
    
    @staticmethod
    def get_user_orders(user_id):
        return list(db.orders.find({'user_id': user_id}))
    
    @staticmethod
    def find_by_id(order_id):
        return db.orders.find_one({'_id': ObjectId(order_id)})

def init_sample_data():
    if db.products.count_documents({}) == 0:
        sample_products = [
            {
                'name': 'Wireless Bluetooth Headphones',
                'description': 'Premium noise-cancelling wireless headphones with 30hr battery life',
                'price': 199.99,
                'image': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
                'category': 'Electronics',
                'stock': 50,
                'rating': 4.5,
                'reviews': 128
            },
            {
                'name': 'Smart Fitness Watch',
                'description': 'Advanced smartwatch with heart rate monitoring and GPS tracking',
                'price': 299.99,
                'image': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
                'category': 'Electronics',
                'stock': 30,
                'rating': 4.3,
                'reviews': 89
            },
            {
                'name': 'Modern Laptop Backpack',
                'description': 'Water-resistant backpack with laptop compartment and USB charging port',
                'price': 49.99,
                'image': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
                'category': 'Accessories',
                'stock': 100,
                'rating': 4.7,
                'reviews': 256
            },
            {
                'name': 'Mechanical Gaming Keyboard',
                'description': 'RGB mechanical keyboard with customizable keys and fast response',
                'price': 89.99,
                'image': 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500&h=500&fit=crop',
                'category': 'Electronics',
                'stock': 25,
                'rating': 4.4,
                'reviews': 167
            },
            {
                'name': 'Wireless Mouse',
                'description': 'Ergonomic wireless mouse with precision tracking and long battery',
                'price': 29.99,
                'image': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
                'category': 'Electronics',
                'stock': 75,
                'rating': 4.2,
                'reviews': 94
            },
            {
                'name': 'Smartphone Case',
                'description': 'Protective case with shock absorption and sleek design',
                'price': 19.99,
                'image': 'https://images.unsplash.com/photo-1601593346740-925612772716?w=500&h=500&fit=crop',
                'category': 'Accessories',
                'stock': 200,
                'rating': 4.1,
                'reviews': 312
            }
        ]
        db.products.insert_many(sample_products)
        print("Sample products inserted!")
