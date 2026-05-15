using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using ECommerce.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ProductsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProductsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ─── LIST ─────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProducts(
            [FromQuery] int? storeId,
            [FromQuery] LicenseType? licenseType,
            [FromQuery] string? search,
            [FromQuery] bool includeInactive = false)
        {
            var callerType = User.FindFirst("UserType")?.Value;
            var showInactive = includeInactive && callerType == "Admin";

            var query = _context.Products
                .Where(p => !p.IsDeleted && (showInactive || p.IsActive))
                .Include(p => p.Category)
                .Include(p => p.Store)
                .Include(p => p.StoreCategory)
                .AsQueryable();

            if (storeId.HasValue)
                query = query.Where(p => p.StoreId == storeId);

            if (licenseType.HasValue)
                query = query.Where(p => p.LicenseType == licenseType);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(s) ||
                    p.Description.ToLower().Contains(s) ||
                    (p.Keywords != null && p.Keywords.ToLower().Contains(s)));
            }

            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new {
                    p.Id, p.Name, p.Description, p.Price,
                    p.ImageUrl, p.PreviewUrl,
                    p.LicenseType,
                    p.DownloadCount,
                    p.Keywords, p.IsFeatured,
                    Category = p.Category != null ? new { p.Category.Id, p.Category.Name } : null,
                    Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null,
                    StoreCategory = p.StoreCategory != null ? new { p.StoreCategory.Id, p.StoreCategory.Name } : null
                }).ToListAsync();

            return Ok(products);
        }

        // ─── DETAIL ───────────────────────────────────────────────────────
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProduct(int id)
        {
            var p = await _context.Products
                .Include(x => x.Category)
                .Include(x => x.Store)
                .Include(x => x.StoreCategory)
                .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);

            if (p == null) return NotFound(new { message = "Ürün bulunamadı." });

            return Ok(new {
                p.Id, p.Name, p.Description, p.Price,
                p.ImageUrl, p.FileUrl, p.PreviewUrl,
                p.LicenseType, p.DownloadCount,
                p.Keywords, p.IsFeatured,
                p.CategoryId, p.StoreCategoryId,
                p.CreatedAt,
                Category = p.Category != null ? new { p.Category.Id, p.Category.Name } : null,
                Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null,
                StoreCategory = p.StoreCategory != null ? new { p.StoreCategory.Id, p.StoreCategory.Name } : null
            });
        }

        // ─── DOWNLOAD (satın alınan ürün için indirme linki) ──────────────
        [HttpGet("{id}/download")]
        [Authorize]
        public async Task<ActionResult> GetDownloadLink(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Kullanıcının bu ürünü satın aldığını doğrula
            var hasPurchased = await _context.OrderItems
                .Include(oi => oi.Order)
                .AnyAsync(oi => oi.ProductId == id && oi.Order.UserId == userId);

            // Kendi mağazasının ürünü ise direkt erişim
            var isOwner = await _context.Products
                .AnyAsync(p => p.Id == id && p.Store != null && p.Store.SellerId == userId);

            if (!hasPurchased && !isOwner)
                return Forbid();

            var product = await _context.Products.FindAsync(id);
            if (product == null || string.IsNullOrEmpty(product.FileUrl))
                return NotFound(new { message = "İndirme dosyası bulunamadı." });

            product.DownloadCount++;
            await _context.SaveChangesAsync();

            return Ok(new { downloadUrl = product.FileUrl, productName = product.Name });
        }

        // ─── FEATURED ─────────────────────────────────────────────────────
        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<object>>> GetFeaturedProducts()
        {
            var manualFeatured = await _context.Products
                .Where(p => !p.IsDeleted && p.IsActive && p.IsFeatured)
                .Include(p => p.Category).Include(p => p.Store)
                .ToListAsync();

            var lastMonth = DateTime.Now.AddDays(-30);
            var topIds = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.OrderDate >= lastMonth)
                .GroupBy(oi => oi.ProductId)
                .OrderByDescending(g => g.Sum(oi => oi.Quantity))
                .Take(6).Select(g => g.Key).ToListAsync();

            var autoFeatured = await _context.Products
                .Where(p => !p.IsDeleted && p.IsActive && topIds.Contains(p.Id))
                .Include(p => p.Category).Include(p => p.Store)
                .ToListAsync();

            var combined = manualFeatured.Concat(autoFeatured)
                .GroupBy(p => p.Id).Select(g => g.First())
                .Take(12)
                .Select(p => new {
                    p.Id, p.Name, p.Description, p.Price,
                    p.ImageUrl, p.PreviewUrl, p.LicenseType, p.DownloadCount, p.IsFeatured,
                    Category = p.Category != null ? new { p.Category.Id, p.Category.Name } : null,
                    Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null
                });

            return Ok(combined);
        }

        // ─── CREATE ───────────────────────────────────────────────────────
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Product>> CreateProduct([FromBody] CreateProductDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return Unauthorized(new { message = "Ürün eklemek için mağaza sahibi olmalısınız." });

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                CategoryId = dto.CategoryId,
                StoreCategoryId = dto.StoreCategoryId,
                Keywords = dto.Keywords,
                ImageUrl = dto.ImageUrl,
                FileUrl = dto.FileUrl,
                PreviewUrl = dto.PreviewUrl,
                LicenseType = dto.LicenseType,
                IsFeatured = dto.IsFeatured,
                StoreId = store.Id,
                CreatedAt = DateTime.Now,
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        // ─── UPDATE ───────────────────────────────────────────────────────
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] CreateProductDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            var isAdmin = User.FindFirstValue("UserType") == "Admin";

            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return NotFound();
            if (store == null && !isAdmin) return Forbid();
            if (store != null && product.StoreId != store.Id && !isAdmin) return Forbid();

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.CategoryId = dto.CategoryId;
            product.StoreCategoryId = dto.StoreCategoryId;
            product.Keywords = dto.Keywords;
            product.ImageUrl = dto.ImageUrl;
            product.FileUrl = dto.FileUrl;
            product.PreviewUrl = dto.PreviewUrl;
            product.LicenseType = dto.LicenseType;
            product.IsFeatured = dto.IsFeatured;
            product.IsActive = dto.IsActive;
            product.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ─── DELETE ───────────────────────────────────────────────────────
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            var isAdmin = User.FindFirstValue("UserType") == "Admin";

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            if (store == null && !isAdmin) return Forbid();
            if (store != null && product.StoreId != store.Id && !isAdmin) return Forbid();

            product.IsDeleted = true;
            product.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ─── SEARCH (legacy compat) ────────────────────────────────────
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchProducts([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return BadRequest(new { message = "Arama terimi boş olamaz." });

            return await GetProducts(null, null, searchTerm);
        }

        // ─── ADMIN: Ürün askıya al / aktifleştir ─────────────────────────
        [HttpPut("{id}/admin-toggle-active")]
        [Authorize]
        public async Task<IActionResult> AdminToggleProductActive(int id, [FromBody] AdminSuspendProductDto dto)
        {
            if (User.FindFirstValue("UserType") != "Admin") return Forbid();

            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return NotFound();

            if (product.IsActive)
            {
                product.IsActive = false;
                product.SuspendedAt = DateTime.Now;
                product.SuspensionReason = dto.Reason;
            }
            else
            {
                product.IsActive = true;
                product.SuspendedAt = null;
                product.SuspensionReason = null;
            }

            product.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { product.Id, product.IsActive, message = product.IsActive ? "Ürün aktifleştirildi." : "Ürün askıya alındı." });
        }
    }

    // ─── DTO ──────────────────────────────────────────────────────────────
    public class AdminSuspendProductDto
    {
        public string? Reason { get; set; }
    }

    public class CreateProductDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int? CategoryId { get; set; }
        public int? StoreCategoryId { get; set; }
        public string? Keywords { get; set; }
        public string? ImageUrl { get; set; }
        public string? FileUrl { get; set; }
        public string? PreviewUrl { get; set; }
        public LicenseType LicenseType { get; set; } = LicenseType.Personal;
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;
    }
}
