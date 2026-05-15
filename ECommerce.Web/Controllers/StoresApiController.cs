using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using ECommerce.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoresApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StoresApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/StoresApi
        // Herkesin aktif mağazaları listeleyebileceği endpoint.
        // Admin için ?includeAll=true ile askılı/pasif mağazalar da döner.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetActiveStores([FromQuery] bool includeAll = false)
        {
            var callerType = User.FindFirst("UserType")?.Value;
            var showAll    = includeAll && callerType == "Admin";

            var stores = await _context.Stores
                .Where(s => showAll || s.IsActive)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.ProfileImageUrl,
                    s.BannerImageUrl,
                    s.Status,
                    s.StoreType,
                    ProductCount = s.Products.Count(p => p.IsActive),
                    SellerId     = s.SellerId
                })
                .ToListAsync();

            return Ok(stores);
        }

        // GET: api/StoresApi/discover
        // Marketplace keşif — provider keşfi için zengin veri
        // Query params: storeType (Service|Online|Physical), search, city, sort (rating|newest)
        [HttpGet("discover")]
        public async Task<IActionResult> Discover(
            [FromQuery] string? storeType,
            [FromQuery] string? search,
            [FromQuery] string? city,
            [FromQuery] string? sort = "rating")
        {
            var query = _context.Stores
                .Where(s => s.IsActive)
                .Include(s => s.Seller)
                .AsQueryable();

            // StoreType filtresi
            if (!string.IsNullOrEmpty(storeType) && Enum.TryParse<StoreType>(storeType, true, out var st))
            {
                query = query.Where(s => s.StoreType == st);
            }

            // Arama (mağaza adı veya açıklama)
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(s =>
                    s.Name.Contains(search) ||
                    (s.Description != null && s.Description.Contains(search)));
            }

            // Şehir filtresi (Seller'ın şehrine göre)
            if (!string.IsNullOrEmpty(city))
            {
                query = query.Where(s => s.Seller != null && s.Seller.City == city);
            }

            var rawStores = await query.Select(s => new
            {
                s.Id,
                s.Name,
                s.Description,
                s.ProfileImageUrl,
                s.BannerImageUrl,
                StoreType        = s.StoreType.ToString(),
                s.YearsOfExperience,
                ProviderName     = s.Seller != null ? s.Seller.FullName : null,
                ProviderCity     = s.Seller != null ? s.Seller.City : null,
                ServicePackageCount = s.ServicePackages.Count(sp => sp.IsActive),
                MinPrice         = s.ServicePackages.Where(sp => sp.IsActive).Min(sp => (decimal?)sp.Price),
                AverageRating    = s.Reviews.Any() ? s.Reviews.Average(r => (double?)r.Rating) : null,
                ReviewCount      = s.Reviews.Count(),
                s.CreatedAt
            }).ToListAsync();

            // Sıralama
            var stores = sort?.ToLower() switch
            {
                "newest" => rawStores.OrderByDescending(s => s.CreatedAt).ToList(),
                _        => rawStores.OrderByDescending(s => s.AverageRating ?? 0)
                                     .ThenByDescending(s => s.ReviewCount)
                                     .ToList()
            };

            return Ok(stores);
        }

        // GET: api/StoresApi/{id}/profile
        // Provider profili — bio, hizmetler, yorumlar dahil zengin veri
        [HttpGet("{id:int}/profile")]
        public async Task<IActionResult> GetProviderProfile(int id)
        {
            var store = await _context.Stores
                .Include(s => s.Seller)
                .Include(s => s.ServicePackages.Where(sp => sp.IsActive))
                .Include(s => s.Reviews)
                .FirstOrDefaultAsync(s => s.Id == id && s.IsActive);

            if (store == null) return NotFound();

            return Ok(new
            {
                store.Id,
                store.Name,
                store.Description,
                store.ProfileImageUrl,
                store.BannerImageUrl,
                StoreType        = store.StoreType.ToString(),
                store.YearsOfExperience,
                store.DiplomaUrl,
                SellerId         = store.SellerId,
                ProviderName     = store.Seller?.FullName,
                ProviderCity     = store.Seller?.City,
                ProviderJoinedAt = store.CreatedAt,
                AverageRating    = store.Reviews.Any() ? store.Reviews.Average(r => (double?)r.Rating) : null,
                ReviewCount      = store.Reviews.Count,
                ServicePackages  = store.ServicePackages.Select(sp => new
                {
                    sp.Id,
                    sp.Name,
                    sp.Description,
                    sp.Price,
                    sp.DurationMinutes,
                    sp.ImageUrl,
                    sp.Tags,
                    sp.IsFeatured
                }).OrderByDescending(sp => sp.IsFeatured).ThenBy(sp => sp.Price)
            });
        }

        // GET: api/StoresApi/5
        // Vitrin bilgileri
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetStore(int id)
        {
            var store = await _context.Stores
                .Include(s => s.StoreCategories)
                .Where(s => s.Id == id && s.IsActive)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.ProfileImageUrl,
                    s.BannerImageUrl,
                    StoreType  = s.StoreType.ToString(),
                    SellerId   = s.SellerId,
                    IsActive   = s.IsActive,
                    Categories = s.StoreCategories.Select(sc => new { sc.Id, sc.Name }),
                    SellerName = s.Seller != null ? s.Seller.FullName : null
                })
                .FirstOrDefaultAsync();

            if (store == null) return NotFound();

            return Ok(store);
        }

        // GET: api/StoresApi/MyStore
        // Satıcının kendi mağaza paneli
        [HttpGet("MyStore")]
        [Authorize]
        public async Task<ActionResult<Store>> GetMyStore()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var store = await _context.Stores
                .FirstOrDefaultAsync(s => s.SellerId == userId);

            if (store == null) return NotFound(new { message = "Mağazanız bulunamadı." });

            return Ok(store);
        }

        // PUT: api/StoresApi/MyStore
        // Satıcının mağazasını güncellemesi
        [HttpPut("MyStore")]
        [Authorize]
        public async Task<IActionResult> UpdateMyStore(Store storeUpdate)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            var store = await _context.Stores
                .FirstOrDefaultAsync(s => s.SellerId == userId);

            if (store == null) return NotFound(new { message = "Mağaza bulunamadı." });

            store.Name = storeUpdate.Name;
            store.Description = storeUpdate.Description;
            store.ProfileImageUrl = storeUpdate.ProfileImageUrl;
            store.BannerImageUrl = storeUpdate.BannerImageUrl;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, new { message = "Güncelleme sırasında hata oluştu." });
            }

            return Ok(new { message = "Mağaza başarıyla güncellendi.", store });
        }

        // POST: api/StoresApi/CreateMyStore
        [HttpPost("CreateMyStore")]
        [Authorize]
        public async Task<IActionResult> CreateMyStore(Store newStore)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            
            // Kullanıcının zaten bir mağazası var mı?
            var existingStore = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (existingStore != null)
                return BadRequest(new { message = "Zaten bir mağazanız var." });

            newStore.SellerId = userId;
            newStore.IsActive = true;
            newStore.CreatedAt = DateTime.Now;

            _context.Stores.Add(newStore);
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyStore), new { id = newStore.Id }, newStore);
        }

        // PUT: api/StoresApi/{id}/toggle-active  — Admin only
        [HttpPut("{id}/toggle-active")]
        [Authorize]
        public async Task<IActionResult> ToggleStoreActive(int id)
        {
            var callerType = User.FindFirst("UserType")?.Value;
            if (callerType != "Admin") return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.IsActive = !store.IsActive;
            await _context.SaveChangesAsync();
            return Ok(new { store.Id, store.IsActive });
        }
    }
}
