&#x20;                                                                                      **BLM4538 PROJE RAPORU**



**Muhammed Eren Köseoğlu 22290604**



**videolar için drive linki : https://drive.google.com/drive/folders/1xHJX2zLOXAiEZ4TMt8UAstsQ5mY\_mhbE?usp=drive\_link**







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
	

