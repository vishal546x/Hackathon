import firebase_admin
from firebase_admin import credentials, firestore

try:
    # Initialize the app (replace with your method)
    # Using the default credential lookup (GOOGLE_APPLICATION_CREDENTIALS)
    firebase_admin.initialize_app()
    db = firestore.client()

    # Attempt to get a list of collections
    collections = db.collections()

    print("✅ Success! Connected to Firebase and Firestore.")

except Exception as e:
    print("❌ Error! Failed to connect to Firebase.")
    print(f"Error details: {e}")