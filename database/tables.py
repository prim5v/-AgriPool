Create table if not exists Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id vachar(255) NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    national_id TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    rating REAL DEFAULT 0.0,
    role TEXT NOT NULL
);

Create table if not exists Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id vachar(255) NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    selling_price REAL NOT NULL,
    stock INTEGER NOT NULL,
    unit TEXT NOT NULL,
    user_id vachar(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    rating REAL DEFAULT 0.0
);

Create table if not exists Orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id vachar(255) NOT NULL UNIQUE,
    user_id vachar(255) NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL,
    service_id vachar(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id vachar(255) NOT NULL,
    product_id vachar(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Images(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id vachar(255) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Location_address(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id vachar(255) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id vachar(255) NOT NULL UNIQUE,
    user_id vachar(255) NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    mpesa_code vachar(255) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Mpesa_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id vachar(255) NOT NULL,
    checkout_request_id vachar(255) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Transport_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id vachar(255) NOT NULL UNIQUE,
    user_id vachar(255) NOT NULL,
    service_name TEXT NOT NULL,
    vehicle_description TEXT,
    price_per_km REAL NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Create table if not exists Transport_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id vachar(255) NOT NULL UNIQUE,
    user_id vachar(255) NOT NULL,
    service_id vachar(255) NOT NULL,
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    distance_km REAL NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



Create table if not exists Cart(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id vachar(255) NOT NULL,
    product_id vachar(255) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

Create table if not exists E_earnings(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id vachar(255) NOT NULL,
    earning REAL NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)