# CampusVault — Complete beginner project (no Docker)

This is a one-page college file-sharing web app. React is the frontend; Node/Express is the API; AWS S3 stores actual files privately; AWS EC2 Ubuntu hosts the API and built frontend; GitHub stores code and is used for manual deployments.

Features: upload PDF/JPG/PNG/DOC/DOCX/PPT/PPTX up to 10 MB, search, list, download using 5-minute signed URLs, admin-PIN protected deletion. S3 bucket remains private. No database needed for this MVP.

## 1. Install Linux on your Windows PC (safe recommendation: WSL2)
Open PowerShell as Administrator:
```powershell
wsl --install -d Ubuntu
```
Restart if requested. Open Ubuntu from Start menu; create Linux username/password. In Ubuntu:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
node -v
npm -v
git --version
```
Install VS Code on Windows and its Microsoft **WSL** extension. Keep project in Linux home (e.g. `~/CampusVault`), not `/mnt/c`.

## 2. Create S3 bucket
AWS Console → S3 → Create bucket. Choose globally unique name; Region `Asia Pacific (Mumbai) ap-south-1`. Keep **Block all public access ON**, ACLs disabled, default encryption ON. Create bucket. Do not make it public.

## 3. IAM policy and EC2 role
IAM → Policies → Create policy → JSON. Replace `YOUR_BUCKET_NAME` with exact bucket name:
```json
{
 "Version":"2012-10-17",
 "Statement":[
  {"Effect":"Allow","Action":["s3:ListBucket"],"Resource":"arn:aws:s3:::YOUR_BUCKET_NAME","Condition":{"StringLike":{"s3:prefix":["uploads/","uploads/*"]}}},
  {"Effect":"Allow","Action":["s3:PutObject","s3:GetObject","s3:DeleteObject"],"Resource":"arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"}
 ]
}
```
Name policy `CampusVaultS3Access`. IAM → Roles → Create role → AWS service → EC2 → attach this policy → role name `CampusVaultEC2Role`. Do not create access keys for EC2; attach this role to the EC2 instance. AWS SDK uses the role's temporary credentials automatically.

## 4. Local project setup
Extract this ZIP into Ubuntu home, then:
```bash
cd ~/CampusVault/backend
cp .env.example .env
nano .env
```
Set your actual S3 bucket, region `ap-south-1`, and a long secret `ADMIN_PIN`. Save nano: Ctrl+O, Enter, Ctrl+X. Never commit `.env`.
```bash
npm install
npm run dev
```
In a second Ubuntu terminal:
```bash
cd ~/CampusVault/frontend
npm install
npm run dev
```
Open the Vite URL shown (usually http://localhost:5173). Local S3 test needs AWS credentials configured for a limited IAM identity; easiest beginner route is to complete EC2 role setup and test S3 after deployment. Never use root credentials.

## 5. GitHub repository
Create an empty GitHub repository named `CampusVault`. In Ubuntu, from project root:
```bash
cd ~/CampusVault
git init
git add .
git commit -m "Initial CampusVault project"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/CampusVault.git
git push -u origin main
```
Replace username. Authenticate through GitHub's browser/device flow. Confirm `.env` and `.pem` are NOT on GitHub.

## 6. Launch EC2 Ubuntu
AWS Console → EC2 → Launch instance:
- Name: CampusVault
- AMI: Ubuntu Server 24.04 LTS, 64-bit x86
- Instance type: choose a small eligible instance offered in your account/region; verify current pricing/free-tier eligibility first.
- Create/download `.pem` key pair; store safely; never upload it to GitHub.
- Security group inbound: SSH TCP 22 from **My IP only**; HTTP TCP 80 from Anywhere; HTTPS TCP 443 from Anywhere (for later TLS). Do NOT open port 5000.
- Advanced details → IAM instance profile: `CampusVaultEC2Role`.
Launch and copy public IPv4 address.

## 7. SSH from your Ubuntu PC
Copy your downloaded key from Windows Downloads into WSL (replace Windows username and filename):
```bash
mkdir -p ~/.ssh
cp /mnt/c/Users/YOUR_WINDOWS_USER/Downloads/your-key.pem ~/.ssh/campusvault.pem
chmod 400 ~/.ssh/campusvault.pem
ssh -i ~/.ssh/campusvault.pem ubuntu@YOUR_EC2_PUBLIC_IP
```
Type `yes` on first connection.

## 8. Install Linux server software on EC2
Run after SSH:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
sudo npm install -g pm2
node -v
npm -v
```
If IAM role wasn't attached at launch: EC2 → Instances → select instance → Actions → Security → Modify IAM role → choose `CampusVaultEC2Role`.

## 9. Clone from GitHub on EC2
```bash
cd /home/ubuntu
git clone https://github.com/YOUR_GITHUB_USERNAME/CampusVault.git
cd CampusVault/backend
cp .env.example .env
nano .env
```
Set exact bucket name, region and a strong admin PIN. Then:
```bash
npm install
cd ../frontend
npm install
npm run build
```

## 10. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/campusvault
```
Paste:
```nginx
server {
 listen 80;
 server_name _;
 root /home/ubuntu/CampusVault/frontend/dist;
 index index.html;
 location / { try_files $uri $uri/ /index.html; }
 location /api/ {
  proxy_pass http://127.0.0.1:5000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 }
}
```
Enable:
```bash
sudo ln -s /etc/nginx/sites-available/campusvault /etc/nginx/sites-enabled/campusvault
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 11. Start API with PM2
```bash
cd /home/ubuntu/CampusVault/backend
pm2 start server.js --name campusvault-api
pm2 save
pm2 startup
```
PM2 prints a `sudo env PATH=...` command; copy and execute that exact command. Then:
```bash
pm2 status
curl http://127.0.0.1:5000/api/health
```
Open `http://YOUR_EC2_PUBLIC_IP` in browser.

## 12. Deploy future code updates through GitHub (no Docker)
On your PC:
```bash
cd ~/CampusVault
git add .
git commit -m "Update CampusVault"
git push
```
On EC2:
```bash
cd /home/ubuntu/CampusVault
git pull
cd frontend && npm install && npm run build
cd ../backend && npm install
pm2 restart campusvault-api
```
Refresh website.

## 13. Test
Upload a small PDF. AWS Console → S3 → bucket → `uploads/` should show it. Download it from the website. Enter admin PIN and click × to delete. Confirm it disappears from S3.

## Troubleshooting
- Site unreachable: check EC2 security group port 80 and `sudo systemctl status nginx`.
- API errors: `pm2 logs campusvault-api --lines 100`.
- S3 AccessDenied: check exact bucket name in policy and that IAM role is attached to EC2.
- AWS credentials error: attach EC2 role; do not put permanent keys on EC2.
- After frontend edits, always run `npm run build`.
- Monitor AWS Billing. EC2, EBS, S3 storage/requests/data transfer and public IPv4 can cost money. Stop/terminate resources when finished. Deleting EC2 does not delete S3 bucket.

## Security / limitations
This is a college demo MVP, not a production public portal. It has no student accounts, upload rate limits, malware scanning, or audit trail. Admin PIN is a simple demo control. Don't upload personal, sensitive or copyrighted files without permission. Keep S3 private and never publish AWS keys, `.env`, or `.pem`.
