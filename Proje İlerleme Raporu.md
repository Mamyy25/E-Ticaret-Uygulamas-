&#x20;                                                                                      **BLM4538 PROJE RAPORU**



**Muhammed Eren Köseoğlu 22290604**



**videolar için drive linki : https://drive.google.com/drive/folders/1xHJX2zLOXAiEZ4TMt8UAstsQ5mY_mhbE?usp=drive_link**







**1. Hafta**



**Video link :** https://drive.google.com/file/d/19EprhlEPoTraReOapaprtEZEJi6jbBwJ/view?usp=drive\_link



Projenin ilk haftası baya kafa karışıklığını birlikte getirdi. En az 4 5 kere fikir değiştirdim. Başlangıç olarak program.cs dosyasını ve 2 adet (ürün ve hesap) controller dosyalarını yazdım

CORS entgrasyonu ve JWT Cycle hatası için ai kullandım.



&#x09;1.Program.cs :



&#x09;	Projenin JSON verisi üreten RESTFUL yapısının temelini oluşturdum.



&#x09;	CORS:Mobil uygulamanın API'ye düzgün bir şekilde fetch gönderebilmesi için gerekli politikaları tanımladım.



&#x09;	JSON Cycle Çözümü: Entity Framework Core üzerindeki ilişkisel verilerde (Örn: Ürün -> Kategori -> Ürün) JSON serileştirmesi sırasında oluşabilecek referans 				döngülerini engellemek için ReferenceHandler.IgnoreCycles kuralını sisteme ekledim.



&#x09;2.AccountApiController.cs:



&#x09;	JWT: Mobil platformların desteklemediği çerez (cookie) tabanlı Session yönetiminden JWT' ye geçtim.



&#x09;	DTO (Data Transfer Object) : Dışarıdan gelen kayıt ve giriş verilerini güvenle karşılamak adına RegisterDto, LoginDto gibi özel veri yapılarını ekledim.



&#x09;	Rol Bazlı Yetkilendirme: Kullanıcı giriş yaptığında, kullanıcının "Admin" olup olmadığı bilgisi şifrelenerek üretilen token'ın içerisine (Payload/Claim) 				ile veritabanına ekstra erişim olmadan yetki kontrolünü sağladım.



&#x09;3.ProductsApiController.cs:



&#x09;	RESTful: Ürün ve kategori işlemleri için GET, POST, PUT, DELETE metotları HTTP durum kodlarıyla (200 OK, 201 Created, 404 NotFound vb.) enpointler oluşturdum.



&#x09;	Soft Delete: Verilerin fiziksel olarak silinmesi yerine, IsDeleted flag kullanılarak güvenli silme (Soft Delete) mekaniğini API ile ekledim ve tüm GET istekleri sadece 		aktif ürünleri dönecek şekilde ayarladım.



&#x09;	Performans Optimizasyonu: Mobil uygulamanın sepet işlemlerinde hızlı yanıt alabilmesi için, tüm ürün verisini çekmek yerine sadece stok durumunu dönen özel ({id}/stock) 		ekledim ve bu kısımda Aİ'dan destek aldım





**2. Hafta**



Video Link : https://drive.google.com/file/d/1XPzG3z-iZe9DgcHiBNG5k8W4Plw7ZzCM/view?usp=drive\_link



Projenin klasör yapısını az çok oturttum. Controller dosyalarını yazma işlemini nerdeyse bitirdim. aynı şekilde Models klasörü içinde de entity'leri tanımladım. Swagger'ı kurdum ve program.cs dosyasında gerekli ayarlamaları yaptım. JWT üzerinde hala çalışıyorum. çok farklı bilmediğim hatalar aldım. Mesela projeyi web de açmaya çalıştığımda network error veriyordu bu sorunu Aİ ile çözdüm . appsettings.json dosyasında JWT token tanımladı , Sistem token üretmek veya okumak istiyor ancak C# appsettings.json dosyasında Jwt:Key adı verilen bir şifreleme anahtarı tanımlı olmadığından Anahtar boş (null) gelince API işlemi yapamayıp 500 kodunu döndürüyormuş.



&#x09;1.ECommerce.Models :



&#x09;	User,Cart,Product vb. entityleri tanımladım.



&#x09;

&#x09;2.ECommerce.Web :



&#x09;	APİController mantığı üzere controller dosyalarımı yazma işlemini çoğunlukla bitirdim. Frontend yazmaya başladığımda ekleme veya güncelleme gerekli olursa bu klasörde 			değişiklik yapmaya devam edicem.



&#x09;3.Arayüz

&#x09;	

&#x09;	React-Native için gerekli kaynak paketlerini indirip projede ECommerce.Mobile ve ECommerce.Frontend adında iki dosya oluşturdum bazı temel **.src** ve **.json** dosyalarını 			tanımladım.

&#x09;	



**3. Hafta**


**Video Link :** https://drive.google.com/file/d/1MPOTGojYhmfM2JosO0N414Lvv8yJEr_W/view?usp=drive_link



Projenin üçüncü haftasında, sistemin genel klasör yapısı tam anlamıyla tamamladım. Geçen haftalarda yaşadığım bir sorundan ötürü değişiklikleri manuel yapmak zorunda kalmıştım bu hafta "force push" yaptığım için projeye dair 1 adet commit gözüküyor. Arayüz için giriş yapma ve hesap oluşturma ekranları sisteme ekledim. Kullanıcıların admin, satıcı veya normal müşteri olup olmadığını ayırt eden temel yetkilendirme (authorization) ve kontrol işlemlerini ekledim.


&#x09;1.AccountApiController.cs :
	Kayıt olma işlemleri için arka planda Register([FromBody] RegisterDto dto) metodunu tanımladım.
	Kullanıcı girişi için Login([FromBody] LoginDto dto) metodu eklendi. Şifreler hashlenerek JWT token üretim işlemini yaptım.
	
&#x09;2.ECommerce.Models (User.cs) :
	Admin ve normal kullanıcı ayrımının veritabanında tutulabilmesi için 'IsAdmin' ve 'IsSeller' boolean yapılarını ekledim. Sistemde yeni kayıt olan her kullanıcının varsayılan olarak 	normal müşteri statüsünde kontrolünü sağladım.
	
&#x09;3.ProductsApiController.cs / AuthHelper.cs :
	Yetkilendirme kontrolleri rotalara bağlandı. Özellikle ürün silme veya düzenleme işlemlerinde (satıcı değilse veya admin değilse) isteği engelleyecek User.FindFirstValue("IsAdmin") 	rolleri ve kısıtlamalarını ekledim.
	
	


**4. Hafta**


**Video Link :** https://drive.google.com/file/d/1TJkZDHdLJi_4Y2G26tJB7NtVfKa2yQFW/view?usp=drive_link



Bu hafta mobil uygulamanın (ECommerce.Mobile) temel altyapısını tamamladım. Kullanıcı kimlik doğrulama, token yönetimi, navigasyon yapısı ve alıcıya yönelik temel ekranları (vitrin, sepet, siparişler, profil) içermektedir. Backend ile aynı API endpoint'lerini kullanarak mobil kısmını oluşturdum.

Mobil klasörün genel yapısı şu şekildedir:

	- src/context/AuthContext.js → Kimlik doğrulama ve JWT token yönetimi
	- src/navigation/AppNavigator.js → Tab navigasyon yapısı ve auth flow yönlendirmesi
	- src/screens/HomeScreen.js → Ürün kataloğu ve kategori filtreleme (Vitrin)
	- src/screens/LoginScreen.js → Giriş ekranı
	- src/screens/RegisterScreen.js → Kayıt ekranı (satıcı hesabı seçeneği dahil)
	- src/screens/CartScreen.js → Sepet yönetimi ve sipariş oluşturma
	- src/screens/OrdersScreen.js → Sipariş geçmişi ve detay görüntüleme
	- src/screens/ProfileScreen.js → Kullanıcı profili ve çıkış işlemi
	- src/theme/colors.js → Uygulama genelinde kullanılan renk paleti


	1. Token Saklama (AsyncStorage) :

	Dosya: AuthContext.js

	Login'de → AsyncStorage.setItem('userToken', newToken) ile JWT kaydediliyor 
	Uygulama açılışında → AsyncStorage.getItem('userToken') ile kaydedilmiş token okunuyor 
	Logout'ta → AsyncStorage.removeItem('userToken') ile token siliniyor
	Token decode edilerek isAdmin ve isSeller claim bilgileri çıkarılıyor. Axios header'ına Authorization: Bearer <token> otomatik ekleniyor.


	2. React Navigation :

	Dosya: AppNavigator.js

	createBottomTabNavigator kullanılarak alt tab çubuğu oluşturuldu. Giriş yapmış kullanıcılar için 4 tab (AnaSayfa, Sepet, Siparişler, Profil), misafir kullanıcılar için 2 tab (AnaSayfa, Giriş Yap) tanımlandı.
	createNativeStackNavigator bu aşamada kullanmadım.


	3. Auth Flow (Otomatik Yönlendirme) :

	Dosya: AppNavigator.js

	Kullanıcı giriş yapmışsa → AuthenticatedTabs (AnaSayfa, Sepet, Siparişler, Profil) gösterilir.
	Kullanıcı giriş yapmamışsa → GuestTabs (AnaSayfa, Giriş Yap) gösterilir.
	


**5. Hafta**


**Video Link :** https://drive.google.com/file/d/1X_U2pYelFtTSg0CfmrHvA0PudyAHau8Y/view?usp=drive_link


Bu hafta çoğunlukla ürünler ile alakalı çalıştım. Ürün inceleme , filtreleme, ürünleri sepete ekleme vs gibi işlemleri tanımladım.

	1. Yeni Siparişi Tamamla Ekranı Eklendi :
	
	Dosya: CheckoutScreen.js
	
	Alışveriş tamamlama sayfasını oluşturdum. Şehir, Ayrıntılı Adres, Kart Bilgisi, SKT ve CVV inputlarını ve API /OrderApi ile iletişimi sağladım.


	2. Arama Fonksiyonu ve Lokal Filtreleme :
	
	Dosya: ProductsScreen.js
	
	Kullanıcının daha kolay ürün araması için anlık yerel çalışan bir filtreleme mantığı ve arayüz arama çubuğu ekledim.

	
	3. Sepet ve Siparişlerin Sekmeler Arası Otomatik Yenilenmesi
	
	Bu kısımda ürünleri görüntüleyebiliyor ve sepete ekleyebiliyordum fakat ürünleri sepette görüntülemeye çalıştığımda sepet boş gözüküyordu. Bu yüzden kodu biraz revize ettim. Bu kısımdaki sorunu çözerken Aİ kullandım.
	
	Dosyalar: CartScreen.js, OrdersScreen.js
	
	Alt menü sayfalarının hafızada tutulması nedeniyle yeni eklenen ürünleri göstermemesi sorununu çözdüm. Klasik useEffect yerine useFocusEffect mantığını ekledim.

	
	4. Kullanıcıları Giriş Yapmaya Yönlendirme :
	
	Dosyalar: ProductsScreen.js, ProductDetailScreen.js
	
	Kullanıcı giriş yapmadan "Sepete Ekle" butonuna bastığında uyarı yerine, direkt Login ekranına otomatik yönlendirme sağlayan yönlendirmeyi ekledim.


	5. Fetch Data (API üzerinden GET isteği)

	Bu kısımda API üzerinden GET isteği ile ürünleri çekme işlemini yaptım.

	Dosya: ECommerce.Mobile/src/screens/ProductsScreen.js

	Satır Numaraları: 20 - 33. satırlar arası (fetchData fonksiyonu)


	6. FlatList Optimizasyonu
	
	Dosya: ECommerce.Mobile/src/screens/ProductsScreen.js

	Satır Numaraları: 169 - 183. satırlar arası (Ekrandaki render edilen ana FlatList bileşeninin bulunduğu yer ve renderItem={renderProduct} .)


	7. Ürün Kartları (UI Bileşeni)

	Dosya: ECommerce.Mobile/src/screens/ProductsScreen.js

	Satır Numaraları: 78 - 107. satırlar arası (const renderProduct = ({ item, index }) => (...) fonksiyonunun tamamı)

**6. Hafta**

**Video Link :** https://drive.google.com/file/d/13Wg7qMAWqLbvpvUVhFIqgt6kgh_1CdO4/view?usp=drive_link

Bu hafta ürün detayı ve filtreleme işlemlerinin yanı sıra daha gerçekçi testler yapmak için mock verileri veritabanında sildim. Artık testleri hesaplar arasında geçiş yaparak kendim oluşturuyorum. Bunun yanı sıra UI üzerine bazı değişiklikler (Ürün detayı kısmında ürün yorumları vs kısmını ekledim) yaptım.İşin frontend ve tasarım kısmında AI desteği aldım. Komple yaptırmak yerine yapmak istediklerimi AI'a sorarak ilerledim.


	1. Veritabanı Temizliği:
	Sistemdeki tüm test ürünleri (Laptop, Wireless Mouse vb.) temizledim. Artık sistem sadece satıcıların oluşturduğu gerçek ürünlerle çalışıyor.
	- **Dosya:** ApplicationDbContext.cs 
	- **Yapılan işlem:** OnModelCreating içindeki Seed Data blokları sildim. Bu sayede artık kendim ürün ekleyebiliyor ve bu ürünleri kullanıcı hesabı ile test edebiliyorum.


	2. Dynamic Routing :
	Herhangi bir ürüne veya mağazaya tıklandığında, ID üzerinden detay sayfasına gidilmesi ve o nesneye özel verinin backend'den gelmesi.
	- **Dosyalar:** HomeScreen.js
	- **İşlev:** navigate('/product/${id}') yapısı ile dinamik productId üzerinden axios.get('/api/ProductsApi/${id}') çağrısı yapılarak özel veri fetch ediliyor.


	3. Filtreleme :
	Kategorilere göre ürünlerin filtrelenmesi işlemi, yerel filtrelemeden tamamen backend destekli olarak değiştirdim
	- **Dosyalar:** ProductsApiController.cs, Home.jsx
	- **İşlev:** Kullanıcı bir kategori seçtiğinde API'ye '/api/ProductsApi/category/{id}' isteği gönderilerek sadece o kategoriye ait güncel verilerin gelmesi.


	4. Navigasyon :
	Sistem navigasyonunu kullanıcı rolüne göre ayırdım. Artık satıcılar normal kullanıcı vitrinini görmeden direkt kendi yönetim panellerine yönlendiriliyor.



**7. Hafta**

**Video Link :** https://drive.google.com/file/d/1bY0AZiYBZbwkNvUOslMKo3U1rL7Mf6PS/view?usp=drive_link

Bu hafta rapora kıyasla çoğunlukla bu zamana kadar yaptıklarımı artık UI olarak iyileştirdim. Sepet yönetimi işlemlerini önceki haftalarda az çok tanımlamıştım gerek controller gerekse APİ olarak. Bu yüzden bu hafta daha çok kullanıcı deneyimi üzerine değişiklikler yaptım.6. Haftayla benzer şekilde bu hafta işin Tasarım/Frontend kısmında Aİ kullandım. bazı özellikleri direkt ordan kopyaladım örneğin bazı ikonlar, butonlar vs.


	1. Sepet Yönetimi:
	Uygulamanın her köşesinden erişilebilen merkezi bir sepet sistemi ekledim.
	- **Yapılan işlem:** Sepet verisi Context API ile fonksiyonlar ile iletişim kuruyor. addToCart, removeFromCart ve clearCart fonksiyonları bu merkezden yönetiliyor.


	2. Sepet İşlemleri:
	Sepete ürün ekleme, miktar güncelleme ve ürün silme işlemlerini tanımladım. Uygulama kapandığında sepetin silinmemesi için yerel depolama kullandım.
	- **Persistence:** AsyncStorage üzerinden sepet verisi her değişiklikte senkronize oluyor.


	3. UI İyileştirmeleri:
	- **Dosyalar:** HomeScreen.js
	- **İşlev:** Alıcılar en üstteki Dashboard'da son siparişlerini ve mesajlarını özet şeklinde görebiliyor.


	4. Bilinmeyen İletişim Hatası
	Mobil testlerdeki iletişim hatalarını (Axios Timeout) çözmek için otomatik IP tespiti yaptım. Bunun yanı sıra react-native-safe-area-context kullanmaya başladım. Bu hatayı çözerken Aİ kullandım.

**8. Hafta**

**Video Link :** https://drive.google.com/file/d/1QScUbUghLUqlYtUtpOg8BIVZkffHK7PZ/view?usp=sharing

Bu hafta sipariş akışını çalışır hale getirdim. Önceki haftalarda iskelet halinde duran CheckoutScreen'i komple yeniden yazdım, OrdersScreen'e de expandable kart yapısı ve durum takibi ekledim. Backend tarafında zaten /api/OrderApi endpoint'i mevcuttu, bu hafta mobil tarafın bununla tam entegrasyonunu tamamladım.


	1. Checkout Screen (Sipariş Tamamlama Ekranı):
	Sepetteki ürünlerin onaylandığı ve siparişin oluşturulduğu ekranı yeniden yazdım. Önceki basit versiyon yerine iki bölümlü yapı kurdum.
	- **Dosya:** CheckoutScreen.js
	- **İşlev:** Teslimat Adresi bölümü (Şehir/İlçe ve Açık Adres alanları) ile Kart Bilgileri bölümü (kart üzerindeki isim, kart numarası otomatik 4'lü gruplama, son kullanma tarihi AA/YY formatı, CVV) ayrı section kartlarında gösteriliyor. Form validation kontrolü eksik alan olduğunda kullanıcıyı uyarıyor.


	2. Order POST (Sipariş Backend'e Kaydedilmesi):
	Siparişi Tamamla butonuna basıldığında sipariş verisinin backend veritabanına kaydedilmesi.
	- **Dosya:** CheckoutScreen.js (handleCheckout fonksiyonu)
	- **İşlev:** axios.post('/api/OrderApi', { shippingAddress, shippingCity }) isteği gönderiliyor. Başarılı yanıtta sipariş numarasını içeren bir onay Alert'i çıkıyor ve kullanıcı ana sayfaya yönlendiriliyor. Hata durumunda backend'den gelen mesaj kullanıcıya gösteriliyor.


	3. Sipariş Geçmişi:
	Kullanıcının geçmiş siparişlerini listeleyip detaylarına bakabildiği ekran.
	- **Dosya:** OrdersScreen.js
	- **İşlev:** Ekran açıldığında GET /api/OrderApi isteğiyle siparişler çekiliyor. Her sipariş kartında sipariş numarası, tarih, toplam tutar ve durum badge'i (Beklemede / Hazırlanıyor / Kargoda / Teslim Edildi / İptal) gösteriliyor. Karta tıklandığında bir panel açılıyor ve içinde sipariş kalemleri (ürün adı, adet, tutar) listeleniyor. useFocusEffect ile sekmeye her dönüşte liste güncelleniyor. ProfileScreen'deki "Siparişlerim" menü satırı bu ekrana yönlendiriyor.


**9. Hafta**

**Video Link :** https://drive.google.com/file/d/10tDoS68O1e9sYopJ9k59WMhvReTORjXq/view?usp=sharing

Bu hafta kullanıcı profili düzenleme, admin rolüne özel ekranlar ve ürün ekleme sırasında resim girişi konularında çalıştım. Admin modu için tamamen ayrı bir dashboard ekranı ve navigasyon akışı kurdum.


	1. User Profile (Kullanıcı Profili Güncelleme):
	Kullanıcının kendi bilgilerini uygulama içinden güncelleyebildiği düzenleme modunu ekledim.
	- **Dosya:** ProfileScreen.js (startEdit, saveEdit fonksiyonları ve EditInput bileşeni)
	- **İşlev:** Profil ekranının sağ üst köşesindeki kalem ikonuna basıldığında form alanları (Ad Soyad, Telefon, Şehir, Adres) açılıyor. Her alan odaklandığında border rengi Animated ile primary renge geçiyor. Kaydet butonuna basıldığında PUT /api/AccountApi/profile isteği gönderiliyor, başarılı olursa AuthContext'teki kullanıcı verisi yenileniyor. İptal butonuyla form kapanıyor.


	2. Admin Mode (Admin Rolüne Özel İşlevler):
	Kullanıcı "Admin" rolündeyse uygulamanın farklı bir yönetim ekranına ve navigasyona yönlendirilmesini sağladım.
	- **Dosyalar:** AppNavigator.js, AdminDashboardScreen.js, ProfileScreen.js, BottomTabBar.js
	- **İşlev:** AuthContext'ten gelen isAdmin değerine göre navigasyon tamamen ayrışıyor; admin kullanıcılar normal vitrin ekranlarını görmeden doğrudan AdminDashboardScreen'e düşüyor. AdminDashboardScreen içinde 6 sekme (Genel Bakış, Başvurular, Mağazalar, Kullanıcılar, Şikayetler, İtirazlar) bulunuyor; mağaza başvurularını onaylama/reddetme, kullanıcı ve mağaza askıya alma/kaldırma, şikayet çözme gibi admin işlemleri bu sekmelerde. ProfileScreen'de de isAdmin kontrolüyle admin kullanıcılara farklı menü satırları gösteriliyor.


	3. Image Upload (Ürün Resmi Girişi Altyapısı):
	Yeni ürün eklerken resim bağlantısı girilerek ürünün görsel olarak listelenmesini sağlayan altyapıyı kurdum.
	- **Dosyalar:** StoreProfileScreen.js (ProductFormSheet — imageUrl alanı, satır 231), StoreProfileScreen.js (StoreEditSheet — profileImageUrl ve bannerImageUrl alanları, satırlar 643-654)
	- **İşlev:** Ürün ekleme formunda imageUrl alanına URL girildiğinde bu değer POST /api/ProductsApi isteğiyle birlikte backend'e gönderiliyor ve ürün kartlarında görsel olarak gösteriliyor. Mağaza düzenleme formunda ise profileImageUrl ve bannerImageUrl alanları aynı şekilde çalışıyor; mağaza profil başlığında girilen URL gerçek görsel olarak render ediliyor.


**10. Hafta**

**Video Link :** https://drive.google.com/file/d/1whm7baFXrQ4m93uFx23g5SNOK7-ARgZ3/view?usp=sharing

Son haftada uygulamayı gerçek bir cihazda uçtan uca test ettim ve hata yönetimini tüm ekranlarda standart hale getirdim. Kayıt olma aşamasından ürün inceleme, sepete ekleme, sipariş verme ve sipariş geçmişini görmeye kadar tüm akışı gerçek bir Android cihazda test ederek son kontrolleri tamamladım.


	1. Hata Yönetimi:
	API hataları ve beklenmedik durumlar için uygulama genelinde standart bir hata gösterim mekanizması kurdum.
	- **Dosyalar:** Tüm ekran dosyaları (CheckoutScreen.js, OrdersScreen.js, CartScreen.js, ProductDetailScreen.js vb.)
	- **İşlev:** Her API çağrısı try/catch bloğuna alındı; hata durumunda err.response?.data?.message okunarak kullanıcıya anlamlı bir Alert gösteriliyor. Backend'den 403 (yetkisiz) yanıtı geldiğinde özel bir mesaj ve yönlendirme aksiyonu eklendi (örneğin satın alınmamış dijital ürün indirilmeye çalışıldığında). Veri yüklenirken SkeletonBox bileşenleriyle placeholder görünümü, veri boş döndüğünde ise EmptyState bileşeniyle açıklayıcı boş durum ekranı gösteriliyor


	2. E2E Testler (Gerçek Cihaz Testi):
	Uygulamanın kayıt aşamasından sipariş verme aşamasına kadar tüm akışını gerçek bir Android ve İOS cihazda test ettim.


	3. Rapor Güncelleme:
	Projenin başından bu yana yapılan tüm mobil geliştirmeler hafta hafta bu raporda belgelendi ve her haftaya ait ilerleme videoları Drive klasörüne yüklendi.
	- **Dosya:** Proje İlerleme Raporu.md
	- **İşlev:** 1. haftadan 10. haftaya kadar yapılan geliştirmeler, kullanılan dosyalar ve işlevleri bu raporda haftalık olarak kayıt altına alındı. Her haftaya ait ilerleme videosu Google Drive'a yüklenerek linkleri rapora eklendi.

