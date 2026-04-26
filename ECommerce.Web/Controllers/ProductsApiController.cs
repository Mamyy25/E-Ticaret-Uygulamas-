using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProducts([FromQuery] int? storeId)
        {
            var query = _context.Products
                .Where(p => !p.IsDeleted && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.Store)
                .Include(p => p.StoreCategory)
                .AsQueryable();

            if (storeId.HasValue)
            {
                query = query.Where(p => p.StoreId == storeId);
            }

            var products = await query.Select(p => new {
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.Stock,
                p.ImageUrl,
                p.Keywords,
                p.IsFeatured,
                p.IsService,
                Category = new { p.Category.Id, p.Category.Name },
                Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null,
                StoreCategory = p.StoreCategory != null ? new { p.StoreCategory.Id, p.StoreCategory.Name } : null
            }).ToListAsync();

            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetProduct(int id)
        {
            var p = await _context.Products
                .Include(prod => prod.Category)
                .Include(prod => prod.Store)
                .Include(prod => prod.StoreCategory)
                .FirstOrDefaultAsync(prod => prod.Id == id && !prod.IsDeleted);

            if (p == null) return NotFound(new { message = "Urun bulunamadi" });

            return Ok(new {
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.Stock,
                p.ImageUrl,
                p.Keywords,
                p.IsFeatured,
                p.IsService,
                p.CategoryId,
                p.StoreCategoryId,
                Category = new { p.Category.Id, p.Category.Name },
                Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null,
                StoreCategory = p.StoreCategory != null ? new { p.StoreCategory.Id, p.StoreCategory.Name } : null
            });
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetProductsByCategory(int categoryId)
        {
            var products = await _context.Products
                .Where(p => p.CategoryId == categoryId && !p.IsDeleted && p.IsActive)
                .Include(p => p.Category)
                .Include(p => p.Store)
                .Select(p => new {
                    p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.IsService,
                    Category = new { p.Category.Id, p.Category.Name },
                    Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchProducts([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm)) return BadRequest(new { message = "Arama terimi bos olamaz" });
            
            searchTerm = searchTerm.ToLower();

            var products = await _context.Products
                .Where(p => !p.IsDeleted && p.IsActive &&
                           (p.Name.ToLower().Contains(searchTerm) || 
                            p.Description.ToLower().Contains(searchTerm) || 
                            (p.Keywords != null && p.Keywords.ToLower().Contains(searchTerm))))
                .Include(p => p.Category)
                .Include(p => p.Store)
                .Select(p => new {
                    p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.IsService,
                    Category = new { p.Category.Id, p.Category.Name },
                    Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null
                })
                .ToListAsync();

            return Ok(products);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            
            if (store == null) return Unauthorized(new { message = "Urun eklemek icin magaza sahibi olmalisiniz." });

            product.StoreId = store.Id;
            product.CreatedAt = DateTime.Now;
            
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product product)
        {
            if (id != product.Id) return BadRequest(new { message = "ID uyusmazligi" });

            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            
            if (store == null) return Unauthorized(new { message = "Magazaniz yok." });

            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null || existingProduct.IsDeleted) return NotFound();

            var isAdmin = User.FindFirstValue("IsAdmin") == "true";
            if (existingProduct.StoreId != store.Id && !isAdmin)
                return Forbid();

            existingProduct.Name = product.Name;
            existingProduct.Description = product.Description;
            existingProduct.Price = product.Price;
            existingProduct.Stock = product.Stock;
            existingProduct.CategoryId = product.CategoryId;
            existingProduct.StoreCategoryId = product.StoreCategoryId;
            existingProduct.Keywords = product.Keywords;
            existingProduct.IsActive = product.IsActive;
            existingProduct.IsFeatured = product.IsFeatured;
            existingProduct.ImageUrl = product.ImageUrl;
            existingProduct.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            var isAdmin = User.FindFirstValue("IsAdmin") == "true";

            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            if (store == null && !isAdmin) return Forbid();
            if (store != null && product.StoreId != store.Id && !isAdmin) return Forbid();

            product.IsDeleted = true;
            product.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/stock")]
        public async Task<ActionResult> GetStock(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null || product.IsDeleted) return NotFound();

            return Ok(new { productId = id, stock = product.Stock, isInStock = product.Stock > 0 });
        }

        [HttpGet("featured")]
        public async Task<ActionResult<IEnumerable<object>>> GetFeaturedProducts()
        {
            // 1. Manuel olarak IsFeatured = true işaretlenenler
            var manualFeatured = await _context.Products
                .Where(p => !p.IsDeleted && p.IsActive && p.IsFeatured)
                .Include(p => p.Category)
                .Include(p => p.Store)
                .ToListAsync();

            // 2. Geçen ayın verilerine göre çok satanları hesapla (Otomatik Öne Çıkarılanlar)
            var lastMonth = DateTime.Now.AddDays(-30);
            var topSellingProductIds = await _context.OrderItems
                .Include(oi => oi.Order)
                .Where(oi => oi.Order.OrderDate >= lastMonth)
                .GroupBy(oi => oi.ProductId)
                .OrderByDescending(g => g.Sum(oi => oi.Quantity))
                .Take(6)
                .Select(g => g.Key)
                .ToListAsync();

            var autoFeatured = await _context.Products
                .Where(p => !p.IsDeleted && p.IsActive && topSellingProductIds.Contains(p.Id))
                .Include(p => p.Category)
                .Include(p => p.Store)
                .ToListAsync();

            // İkisini birleştir, Distinct kullanarak tekrarları at, maksimum 12 ürün döndür
            var combined = manualFeatured.Concat(autoFeatured)
                .GroupBy(p => p.Id).Select(g => g.First())
                .Take(12)
                .Select(p => new {
                    p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.IsFeatured, p.IsService,
                    Category = new { p.Category.Id, p.Category.Name },
                    Store = p.Store != null ? new { p.Store.Id, p.Store.Name, p.Store.SellerId } : null
                });

            return Ok(combined);
        }
    }
}
