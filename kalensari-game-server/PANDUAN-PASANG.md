# Memasang Server Online Kalensari Game di VPS (kalensari-proxy)

Server ini **tidak butuh `npm install`** – cukup Node.js yang sudah ada di VPS.
Proxy iPaymu yang sudah jalan **tidak diubah**; game memakai subdomain sendiri.

## 0. DNS (di DomaiNesia)
Tambah record: **Type A · Name `game` · Value = IP statis VPS**.
Cek dari CMD laptop: `ping game.kalensari.web.id` → harus muncul IP VPS (bisa butuh 5–30 menit).

## 1. Kirim folder server ke VPS (dari CMD laptop, di folder tempat zip diekstrak)
```
scp -r kalensari-game-server kalensari@IP-VPS:~/
```

## 2. Tambah swap 1 GB (cadangan RAM) – sekali saja
```
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Jalankan server sebagai layanan (otomatis hidup saat VPS restart)
```
cd ~/kalensari-game-server
sed -i "s#NODE_BIN#$(which node)#" kalensari-game.service
sudo cp kalensari-game.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kalensari-game
curl http://127.0.0.1:8090/health
```
Harus muncul: `Kalensari Game Server OK – online: 0, room: 0, antre: 0`

## 4. Nginx + SSL gratis
```
sudo cp ~/kalensari-game-server/game.kalensari.web.id.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/game.kalensari.web.id.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d game.kalensari.web.id
```
(Saat certbot bertanya email, isi email Anda; setujui syaratnya; pilih **redirect** bila ditanya.)

## 5. Cek dari browser
Buka **https://game.kalensari.web.id/health** → harus muncul tulisan "Kalensari Game Server OK".

## 6. Unggah game.html terbaru ke GitHub (repo Kalensari Store) seperti biasa.

## Perintah berguna
- Lihat status: `sudo systemctl status kalensari-game`
- Lihat log pertandingan: `journalctl -u kalensari-game -f`
- Restart server: `sudo systemctl restart kalensari-game`
- Update server: kirim ulang `server.js` (langkah 1), lalu restart.
