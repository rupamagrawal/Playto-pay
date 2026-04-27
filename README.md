# Playto Pay KYC Pipeline

Fully realized Playto intern challenge featuring a Django DRF backend, React + Tailwind Frontend, dynamic State Machine adherence, and declarative permissions models.

## 🚀 Live Deployments
- **Frontend (Vercel):** https://playto-pay.vercel.app
- **Backend API (Render):** https://playto-pay-8ap5.onrender.com

### 🔐 Test Credentials
The database automatically seeds on deployment. You can log in immediately:
*(Password is always `password123`)*

- **Reviewer:** `admin@playtopay.com`
- **Merchant (Under Review):** `merchant_one@test.com` 
- **Merchant (Drafting):** `merchant_two@test.com`

---

## Pre-Requisites
- Python 3.10+
- Node JS 18+

## Setup Instructions

### 1. Backend Initialization 
Open your terminal at the root path of this repository.

1. Create and activate a Virtual Environment
```bash
python -m venv venv
# On Windows:
source venv/Scripts/activate
# On Mac/Linux:
source venv/bin/activate
```

2. Install Requirements
```bash
pip install -r requirements.txt
```
*(Note for Windows users: `python-magic-bin` is required for file validation locally. On Linux/Deploy environments, use standard `python-magic` combined with `libmagic1` system package).*

3. Run migrations and database compilation
```bash
python manage.py migrate
```

4. Populate the application securely via the seeder
```bash
python seed.py
```

5. Ignite the backend development server
```bash
python manage.py runserver
```

### 2. Frontend Initialization
Launch a **second** terminal window.

1. Change directories into the application
```bash
cd frontend
```

2. Install Node dependencies
```bash
npm install
```

3. Ignite the React development server
```bash
npm run dev
```

### 3. Usage & Login Map
The seed script will furnish your local database with three testing accounts exactly meeting the assignment requirements.
_All passwords resolve to_: `password123`

- **Reviewer**: `admin@playtopay.com`
- **Merchant (Under Review)**: `merchant_one@test.com` 
- **Merchant (Drafting)**: `merchant_two@test.com`
