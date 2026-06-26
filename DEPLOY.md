# Despliegue en servidor de pruebas (AWS EC2)

## Requisitos mínimos

- Ubuntu 22.04 LTS
- 2 vCPU / 2 GB RAM (t3.small o superior)
- Puerto 80 abierto en Security Group
- Node.js 20+ instalado
- Docker + Docker Compose instalados
- Git instalado

## 1. Instalar dependencias del sistema

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# Nginx
sudo apt-get install -y nginx
```

## 2. Clonar el repositorio

```bash
cd /opt
sudo git clone https://github.com/Daniel-JFA/DataHeartSC.git dataheart
sudo chown -R $USER:$USER /opt/dataheart
cd /opt/dataheart
```

## 3. Levantar PostgreSQL con Docker

```bash
docker compose up -d
# Verificar que esté healthy
docker compose ps
```

## 4. Configurar el backend

```bash
cd /opt/dataheart/backend
npm install

# Crear archivo de variables de entorno
cat > .env <<EOF
DATABASE_URL="postgresql://dataheart:dataheart_dev_2026@localhost:5432/dataheart_sc?schema=public"
JWT_SECRET="CAMBIA_ESTE_SECRETO_POR_UNO_LARGO_Y_ALEATORIO"
NODE_ENV="production"
PORT=3000
EOF

# Aplicar migraciones y generar cliente Prisma
npx prisma migrate deploy
npx prisma generate

# Crear usuario admin inicial
npx ts-node prisma/seed.ts
```

> **Credenciales por defecto del seed:**
> - Email: `admin@santiagocorazon.org`
> - Password: `admin2026`
> Cámbialas después del primer login.

## 5. Correr el backend con PM2

```bash
sudo npm install -g pm2

# Compilar
npm run build

# Iniciar con PM2
pm2 start dist/main.js --name dataheart-api
pm2 save
pm2 startup  # seguir las instrucciones que imprime
```

## 6. Compilar y servir el frontend

```bash
cd /opt/dataheart/frontend
npm install
npm run build   # genera dist/frontend/browser/
```

## 7. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/dataheart
```

Pegar esta configuración (reemplazar `TU_IP_O_DOMINIO`):

```nginx
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;

    # Frontend Angular (archivos estáticos)
    root /opt/dataheart/frontend/dist/frontend/browser;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend NestJS (proxy inverso)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dataheart /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 8. Verificar

```bash
# Backend responde
curl http://localhost:3000/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@santiagocorazon.org","password":"admin2026"}'

# Frontend accesible
curl -s -o /dev/null -w "%{http_code}" http://TU_IP_O_DOMINIO
# debe retornar 200
```

Abrir en el navegador: `http://TU_IP_O_DOMINIO`

## Comandos útiles post-despliegue

```bash
# Ver logs del backend
pm2 logs dataheart-api

# Reiniciar backend
pm2 restart dataheart-api

# Actualizar desde GitHub
cd /opt/dataheart
git pull

cd backend && npx prisma migrate deploy && npm run build
pm2 restart dataheart-api

cd ../frontend && npm run build
# Nginx sirve automáticamente los nuevos archivos estáticos
```

## Progress Board (dashboard de avances del proyecto)

```bash
# Servir el HTML estático en puerto 8888
cd /opt/dataheart/docs
nohup python3 -m http.server 8888 &
```

Abrir: `http://TU_IP_O_DOMINIO:8888/progress-board.html`

> Recordar abrir el puerto 8888 en el Security Group de AWS si quieres accederlo desde fuera.
