# PROJE BAĞLAMI: QR Game Cafe

## 1. Proje Özeti
Kafeler için QR kod tabanlı dijital menü ve entegre gerçek zamanlı oyun platformu. Müşteriler masalarındaki QR kodu okutarak menüye erişir ve menü üzerinden oyun alanına geçiş yaparak tek kişilik veya çok kişilik oyunlar oynayabilirler.

## 2. Teknoloji Yığını (Tech Stack)
*   **Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Router, Socket.IO Client, Chess.js + React Chessboard
*   **Backend:** Node.js, Fastify, Socket.IO
*   **Veritabanı & Cache:** PostgreSQL 16 (Kalıcı veriler), Redis 7 (Anlık state ve lobiler)
*   **Altyapı:** Docker & Docker Compose (Frontend, Backend, DB, Redis container'ları)

## 3. İş Mantığı ve Kullanıcı Akışı (User Flow)
### A. Masa ve Menü Sistemi
*   Her masanın benzersiz (unique) bir QR kodu ve ID'si vardır.
*   QR kod okutulduğunda masa ID'si eşleşir ve kullanıcı dijital menüyü görüntüler.
*   Menüde "Oyun Alanına Git" butonu bulunur.

### B. Oyun Alanı ve Kimlik Doğrulama
*   Oyun alanına girildiğinde kullanıcıdan bir "Nickname" (Kullanıcı Adı) istenir. Oyun içi tüm etkileşimler bu nickname üzerinden yürür.

### C. Tek Kişilik Oyunlar (Single-Player)
*   Kullanıcı tek kişilik bir oyun oynayıp bitirdiğinde skoru hesaplanır ve kaydedilir.
*   Skor yeterince yüksekse **Top 10 Scoreboard**'a (Liderlik Tablosu) girer. (Bu veri PostgreSQL'de tutulacaktır).

### D. Çok Kişilik Oyunlar (Multiplayer & Lobi Sistemi)
*   **Masa Odaklı Lobi:** Çok kişilik oyunlara girildiğinde sistem, kullanıcının Masa ID'sine göre özel bir lobi ekranı açar. Lobide masadaki kişilerin nickname'leri görünür.
*   **Oyun Kurma & Katılma:** 
    *   Bir kullanıcı oyun kurduğunda (Örn: Satranç), lobi ekranında "Oyun kurdu, rakip bekliyor" statüsünde görünür.
    *   Masadaki diğer kullanıcılar lobiden bu açık oyunu görüp direkt "Katıl" butonuyla maça dahil olabilirler.
*   **Altyapı Notu:** Lobi durumu, aktif beklemeler ve eşleşmeler Socket.IO üzerinden gerçek zamanlı iletilmeli ve Redis üzerinde tutulmalıdır.

## 4. Yapay Zeka İçin Geliştirme Talimatları
*   Yeni bir özellik yazarken mevcut mimariye ve teknoloji yığınına sadık kal.
*   Geçici/anlık durumlar (lobiler, aktif maçlar, online kişiler) için **Redis** kullan.
*   Kalıcı veriler (masa bilgileri, top 10 skorlar, oyun geçmişi) için **PostgreSQL** kullan.
*   

