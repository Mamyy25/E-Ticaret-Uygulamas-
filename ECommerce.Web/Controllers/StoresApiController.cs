using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
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
        // Herkesin aktif mağazaları listeleyebileceği endpoint
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetActiveStores()
        {
            var stores = await _context.Stores
                .Where(s => s.IsActive)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.Description,
                    s.ProfileImageUrl,
                    s.BannerImageUrl,
                    ProductCount = s.Products.Count(p => p.IsActive)
                })
                .ToListAsync();

            return Ok(stores);
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
                    Categories = s.StoreCategories.Select(sc => new { sc.Id, sc.Name }),
                    SellerName = s.Seller.FullName
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
            
            // Eğer user önceden seller değilse rolünü güncelle
            var user = await _context.Users.FindAsync(userId);
            if(user != null && !user.IsSeller)
            {
                user.IsSeller = true;
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyStore), new { id = newStore.Id }, newStore);
        }
    }
}
