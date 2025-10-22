from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, JWTManager
from bson import ObjectId
from datetime import datetime
import json
from auth import init_auth, hash_password, check_password
from models import User, Product, Order, init_sample_data, db
from config import Config
from PIL import Image
import io
import math

# Try to use the 'requests' library; if it's not installed provide a minimal
# requests-like fallback using urllib so the rest of the code can call
# requests.get(...), access .content and call .raise_for_status().
try:
    import requests as _requests  # type: ignore
except ImportError:
    _requests = None

if _requests is None:
    import urllib.request
    import urllib.error

    class _Response:
        def __init__(self, content, status_code):
            self.content = content
            self.status_code = status_code

        def raise_for_status(self):
            if not (200 <= self.status_code < 300):
                raise Exception(f"HTTP Error: {self.status_code}")

    class _RequestsFallback:
        @staticmethod
        def get(url, timeout=3):
            req = urllib.request.Request(url, headers={'User-Agent': 'python-urllib/3'})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                content = resp.read()
                status = resp.getcode()
                return _Response(content, status)

    requests = _RequestsFallback()
else:
    requests = _requests

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
CORS(app, origins=app.config['CORS_ORIGINS'])
init_auth(app)
# Initialize JWT manager (required before using create_access_token or jwt_required)
jwt = JWTManager(app)

# Helper function to serialize MongoDB documents
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

# Routes
@app.route('/')
def home():
    return jsonify({
        "message": "E-commerce API", 
        "version": "1.0.0",
        "endpoints": {
            "auth": ["/api/register", "/api/login"],
            "products": ["/api/products", "/api/products/<id>"],
            "cart": ["/api/cart", "/api/cart/<product_id>"],
            "orders": ["/api/orders"]
        }
    })

# Auth Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['name', 'email', 'password']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user exists
        if User.find_by_email(data['email']):
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password and create user document
        hashed_password = hash_password(data['password'])
        user_data = User.create_user(
            name=data['name'],
            email=data['email'],
            password=hashed_password
        )

        # Insert user into the database
        result = db.users.insert_one(user_data)
        user_id = result.inserted_id if result and hasattr(result, 'inserted_id') else None
        
        if not user_id:
            return jsonify({'error': 'Failed to create user'}), 500
        
        # Create access token
        access_token = create_access_token(identity=str(user_id))
        
        return jsonify({
            'message': 'User created successfully',
            'access_token': access_token,
            'user': {
                'id': str(user_id),
                'name': data['name'],
                'email': data['email']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['email', 'password']):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.find_by_email(data['email'])
        
        if user and check_password(user['password'], data['password']):
            # increment login stats
            try:
                User.increment_login(str(user['_id']))
            except Exception:
                pass

            access_token = create_access_token(identity=str(user['_id']))

            return jsonify({
                'access_token': access_token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'is_admin': user.get('is_admin', False),
                    'login_count': user.get('login_count', 0),
                    'last_login': user.get('last_login')
                }
            })
        
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = Product.get_all()
        return jsonify([serialize_doc(product) for product in products])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.get_by_id(product_id)
        if product:
            return jsonify(serialize_doc(product))
        return jsonify({'error': 'Product not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Invalid product ID'}), 400


@app.route('/api/search-by-image', methods=['POST'])
def search_by_image():
    # Accepts multipart/form-data with 'image' file
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        file = request.files['image']

        # compute histogram of uploaded image
        buf = file.read()
        query_hist = compute_rgb_histogram(buf)
        if not query_hist:
            return jsonify({'error': 'Failed to process uploaded image'}), 500

        # retrieve products with precomputed histograms
        candidates = []
        for p in db.products.find():
            ph = p.get('color_hist')
            if not ph:
                continue
            # compute cosine similarity
            sim = cosine_similarity(query_hist, ph)
            candidates.append((sim, p))

        # sort by descending similarity
        candidates.sort(key=lambda x: x[0], reverse=True)

        results = []
        for sim, p in candidates[:10]:
            results.append({
                '_id': str(p['_id']),
                'name': p.get('name'),
                'image': p.get('image'),
                'price': p.get('price'),
                'similarity': sim
            })

        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def compute_rgb_histogram(image_bytes, bins_per_channel=8):
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize((200, 200))
        pixels = list(img.getdata())
        bins = bins_per_channel
        hist = [0] * (bins ** 3)
        for (r, g, b) in pixels:
            rb = r * bins // 256
            gb = g * bins // 256
            bb = b * bins // 256
            idx = rb * (bins * bins) + gb * bins + bb
            hist[idx] += 1
        total = sum(hist)
        if total == 0:
            return None
        # normalize
        return [h / total for h in hist]
    except Exception:
        return None


def cosine_similarity(a, b):
    # assume same length
    dot = 0.0
    norma = 0.0
    normb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        norma += x * x
        normb += y * y
    if norma == 0 or normb == 0:
        return 0.0
    return dot / ((norma ** 0.5) * (normb ** 0.5))


def recompute_product_histograms():
    # Compute and store color_hist for products that don't have it
    for p in db.products.find():
        if p.get('color_hist'):
            continue
        url = p.get('image')
        if not url:
            continue
        try:
            r = requests.get(url, timeout=5)
            r.raise_for_status()
            hist = compute_rgb_histogram(r.content)
            if hist:
                db.products.update_one({'_id': p['_id']}, {'$set': {'color_hist': hist}})
        except Exception:
            continue


@app.route('/api/admin/recompute-histograms', methods=['POST'])
@jwt_required()
def admin_recompute_histograms():
    if not is_current_user_admin():
        return jsonify({'error': 'Admin access required'}), 403
    try:
        recompute_product_histograms()
        return jsonify({'message': 'Recompute started/completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Cart Routes
@app.route('/api/cart', methods=['GET'])
@jwt_required()
def get_cart():
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        cart_items = []
        for item in user.get('cart', []):
            product = Product.get_by_id(item['product_id'])
            if product:
                cart_items.append({
                    **serialize_doc(product),
                    'cart_quantity': item['quantity']
                })
        
        return jsonify(cart_items)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'product_id' not in data:
            return jsonify({'error': 'Product ID required'}), 400
        
        user = User.find_by_id(user_id)
        product = Product.get_by_id(data['product_id'])
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update cart
        cart = user.get('cart', [])
        quantity = data.get('quantity', 1)
        
        # Check if item already in cart
        item_exists = False
        for item in cart:
            if item['product_id'] == data['product_id']:
                item['quantity'] += quantity
                item_exists = True
                break
        
        if not item_exists:
            cart.append({
                'product_id': data['product_id'],
                'quantity': quantity
            })
        
        User.update_cart(user_id, cart)
        
        return jsonify({'message': 'Item added to cart'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/<product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(product_id):
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        
        cart = [item for item in user.get('cart', []) if item['product_id'] != product_id]
        User.update_cart(user_id, cart)
        
        return jsonify({'message': 'Item removed from cart'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Order Routes
@app.route('/api/orders', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        user = User.find_by_id(user_id)
        
        if not user.get('cart'):
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Calculate total and prepare order items
        total = 0
        order_items = []
        
        for item in user['cart']:
            product = Product.get_by_id(item['product_id'])
            if product:
                item_total = product['price'] * item['quantity']
                total += item_total
                order_items.append({
                    'product_id': item['product_id'],
                    'quantity': item['quantity'],
                    'price': product['price'],
                    'name': product['name'],
                    'image': product.get('image', '')
                })
        
        # Create order
        order_data = Order.create_order(
            user_id=user_id,
            items=order_items,
            total=total,
            shipping_address=data.get('shipping_address', {})
        )
        
        result = db.orders.insert_one(order_data)
        
        # Clear cart
        User.update_cart(user_id, [])
        
        return jsonify({
            'message': 'Order created successfully',
            'order_id': str(result.inserted_id),
            'total': total
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET'])
@jwt_required()
def get_orders():
    try:
        user_id = get_jwt_identity()
        orders = Order.get_user_orders(user_id)
        return jsonify([serialize_doc(order) for order in orders])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        user_id = get_jwt_identity()
        order = Order.find_by_id(order_id)
        
        if not order or order['user_id'] != user_id:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify(serialize_doc(order))
    except Exception as e:
        return jsonify({'error': 'Invalid order ID'}), 400


# Admin Routes - simple admin guard based on user.is_admin
def is_current_user_admin():
    try:
        user_id = get_jwt_identity()
        user = User.find_by_id(user_id)
        return user and user.get('is_admin', False)
    except Exception:
        return False


@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_list_users():
    if not is_current_user_admin():
        return jsonify({'error': 'Admin access required'}), 403
    try:
        users = User.get_all_users()
        # serialize user ids and hide passwords
        def s(u):
            return {
                'id': str(u['_id']),
                'name': u.get('name'),
                'email': u.get('email'),
                'is_admin': u.get('is_admin', False),
                'login_count': u.get('login_count', 0),
                'last_login': u.get('last_login')
            }

        return jsonify([s(u) for u in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users/<user_id>/admin', methods=['POST'])
@jwt_required()
def admin_set_admin(user_id):
    if not is_current_user_admin():
        return jsonify({'error': 'Admin access required'}), 403
    try:
        data = request.get_json() or {}
        is_admin = bool(data.get('is_admin', True))
        User.set_admin(user_id, is_admin)
        return jsonify({'message': 'User updated'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(user_id):
    if not is_current_user_admin():
        return jsonify({'error': 'Admin access required'}), 403
    try:
        User.delete_user(user_id)
        return jsonify({'message': 'User deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize sample data
    init_sample_data()
    # Precompute color histograms for product images (best-effort)
    try:
        recompute_product_histograms()
    except Exception:
        pass
    
    print("Starting E-commerce API...")
    print("Sample products have been loaded!")
    app.run(debug=app.config['DEBUG'], port=app.config['PORT'])