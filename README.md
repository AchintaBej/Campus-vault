# 🎓 CampusVault — AWS Cloud Storage & College Resource Hub

CampusVault is a full-stack college resource-sharing application.
- **Frontend:** React (Vite) with a modern glassmorphism UI, drag-and-drop file uploader, file category filtering, and instant search.
- **Backend:** Node.js + Express API serving both the REST endpoints and the compiled React frontend directly as static files.
- **AWS S3:** Private object storage for all uploaded files (PDF, Word, Slides, Images) with secure presigned URLs.
- **AWS EC2:** Ubuntu Linux server running the Express application 24/7 with PM2 and Nginx.

---

## 🚀 Key Architectural Highlights
1. **Single-Port Unified Deployment:** The frontend compiles directly into `backend/public`. The Express server serves both the API (`/api/*`) and the web UI (`/*`) from a single port (`5000` or port `80` via Nginx).
2. **Zero S3 Public Risk:** S3 bucket remains **100% private** with **Block all public access ENABLED**. Access is provided via temporary AWS S3 Presigned URLs (generated on-the-fly by the backend).
3. **IAM Role Security:** On AWS EC2, the backend uses IAM Instance Profiles, eliminating the need to store sensitive AWS credentials in configuration files.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js (v18 or v20 LTS)
- npm (v9+)
- Git

### 2. Installation
From the root directory of the project:
```bash
# Install dependencies for both frontend and backend
npm run install:all
```

### 3. Environment Variables
In the `backend` folder, create `.env` from `.env.example`:
```bash
cp backend/.env.example backend/.env
```
Edit `backend/.env`:
```env
PORT=5000
AWS_REGION=ap-south-1
S3_BUCKET=your-actual-s3-bucket-name
ADMIN_PIN=Admin@1234
MAX_FILE_MB=10

# Optional: Only needed if testing locally without EC2 IAM Role:
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
```

### 4. Running Locally
- **Option A (Full stack together - Production style):**
  ```bash
  # Build frontend into backend/public
  npm run build

  # Start the backend server (serves frontend + API at http://localhost:5000)
  npm start
  ```
- **Option B (Separate dev servers with hot reload):**
  - Terminal 1: `npm run dev:backend` (API at `http://localhost:5000`)
  - Terminal 2: `npm run dev:frontend` (Vite dev server at `http://localhost:5173`)

---

## ☁️ Complete AWS Setup & EC2 Deployment Guide

### STEP 1: Create AWS S3 Bucket (Private Storage)
1. Log in to the **AWS Management Console** and navigate to **S3**.
2. Click **Create bucket**.
3. **Bucket name:** Enter a globally unique name (e.g. `campusvault-storage-yourname`).
4. **AWS Region:** Select `Asia Pacific (Mumbai) ap-south-1` (or your nearest region).
5. **Block Public Access settings:** Keep **"Block *all* public access" ENABLED (Checked)**.
6. Click **Create bucket**.
7. Navigate to your new bucket -> **Permissions** tab -> Scroll down to **Cross-origin resource sharing (CORS)** -> Click **Edit** and paste:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```
   Click **Save changes**.

---

### STEP 2: Configure AWS IAM Policy & Role
Instead of creating permanent access keys, we attach an **IAM Role** to the EC2 instance:
1. Go to **IAM Console** -> **Policies** -> **Create policy**.
2. Select the **JSON** tab and paste (replace `YOUR_BUCKET_NAME` with your actual bucket name):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME",
         "Condition": {
           "StringLike": {
             "s3:prefix": ["uploads/", "uploads/*"]
           }
         }
       },
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
       }
     ]
   }
   ```
3. Policy name: `CampusVaultS3Policy` -> Click **Create policy**.
4. Go to **IAM** -> **Roles** -> **Create role**.
5. Trusted entity: **AWS service** -> Use case: **EC2** -> Next.
6. Search and select `CampusVaultS3Policy` -> Next.
7. Role name: `CampusVaultEC2Role` -> Click **Create role**.

---

### STEP 3: Launch AWS EC2 Instance
1. Go to **EC2 Console** -> Click **Launch instance**.
2. **Name:** `CampusVault-Server`.
3. **Application and OS Images:** **Ubuntu Server 24.04 LTS** (64-bit x86).
4. **Instance type:** `t2.micro` or `t3.micro` (Free Tier eligible).
5. **Key pair:** Create and download a new key pair (`campusvault-key.pem`).
6. **Network Settings (Security Group):**
   - Inbound Rule 1: **SSH (Port 22)** -> My IP (or Anywhere 0.0.0.0/0).
   - Inbound Rule 2: **HTTP (Port 80)** -> Anywhere (0.0.0.0/0).
   - Inbound Rule 3: **HTTPS (Port 443)** -> Anywhere (0.0.0.0/0).
   - Inbound Rule 4: **Custom TCP (Port 5000)** -> Anywhere (0.0.0.0/0).
7. **Attach IAM Role:**
   - Expand **Advanced details** at the bottom.
   - In **IAM instance profile**, choose `CampusVaultEC2Role`.
8. Click **Launch instance**.
9. Copy the **Public IPv4 address** of your instance.

---

### STEP 4: Push Code to GitHub
From your local computer terminal:
```bash
git init
git add .
git commit -m "Deploy: CampusVault ready for EC2 & S3"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/CampusVault.git
git push -u origin main
```
*(Ensure `.env` and `.pem` are never committed).*

---

### STEP 5: Connect to EC2 and Setup Environment
1. SSH into your EC2 instance from PowerShell or Terminal:
   ```bash
   ssh -i /path/to/campusvault-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
   ```
2. Update Ubuntu packages and install Node.js 20 & PM2:
   ```bash
   sudo apt update && sudo apt upgrade -y
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs git nginx
   sudo npm install -g pm2
   ```

---

### STEP 6: Clone and Build on EC2
1. Clone your repository:
   ```bash
   cd /home/ubuntu
   git clone https://github.com/YOUR_GITHUB_USERNAME/CampusVault.git
   cd CampusVault
   ```
2. Configure environment file:
   ```bash
   cd backend
   cp .env.example .env
   nano .env
   ```
   Set:
   ```env
   PORT=5000
   AWS_REGION=ap-south-1
   S3_BUCKET=your-actual-s3-bucket-name
   ADMIN_PIN=Admin@1234
   MAX_FILE_MB=10
   ```
   *(Press `Ctrl+O`, `Enter`, `Ctrl+X` to save and exit).*

3. Install dependencies and build frontend:
   ```bash
   cd /home/ubuntu/CampusVault
   npm run install:all
   npm run build
   ```

---

### STEP 7: Run Backend 24/7 with PM2
```bash
cd /home/ubuntu/CampusVault/backend
pm2 start server.js --name "campusvault"
pm2 save
pm2 startup
```
*(Copy and run the `sudo env PATH=...` command that PM2 prints).*

---

### STEP 8: Configure Nginx (Port 80 to Port 5000 Proxy)
To access your web app on port 80 without typing `:5000`:
1. Create Nginx config:
   ```bash
   sudo nano /etc/nginx/sites-available/campusvault
   ```
2. Paste:
   ```nginx
   server {
       listen 80;
       server_name _;
       client_max_body_size 15M;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
3. Enable the site and restart Nginx:
   ```bash
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo ln -s /etc/nginx/sites-available/campusvault /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
4. Now open `http://YOUR_EC2_PUBLIC_IP` in any web browser!

---

### 🔄 Updating Code in Future (CI/CD Workflow)
Whenever you push updates to GitHub:
```bash
# On your EC2 server:
cd /home/ubuntu/CampusVault
git pull
npm run build
pm2 restart campusvault
```
