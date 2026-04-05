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

