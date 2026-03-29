using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{
    /// <summary>
    /// Kategori iþlemleri için API endpoint'leri
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class CategoriesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CategoriesApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tüm aktif kategorileri listeler
        /// </summary>
        /// <returns>Kategori listesi</returns>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            var categories = await _context.Categories
                .Where(c => !c.IsDeleted)
                .Include(c => c.Products.Where(p => !p.IsDeleted))
                .ToListAsync();

            return Ok(categories);
        }

        /// <summary>
        /// Belirli bir kategoriyi ID'sine göre getirir
        /// </summary>
        /// <param name="id">Kategori ID'si</param>
        /// <returns>Kategori detaylarý</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Products.Where(p => !p.IsDeleted))
                .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);

            if (category == null)
            {
                return NotFound(new { message = "Kategori bulunamadý" });
            }

            return Ok(category);
        }

        /// <summary>
        /// Yeni kategori oluþtur
        /// </summary>
        /// <param name="category">Kategori bilgileri</param>
        /// <returns>Oluþturulan kategori</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<Category>> CreateCategory([FromBody] Category category)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                category.CreatedAt = DateTime.Now;
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCategory), new { id = category.Id }, category);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Kategori oluþturulurken hata oluþtu", error = ex.Message });
            }
        }

        /// <summary>
        /// Kategori güncelle
        /// </summary>
        /// <param name="id">Kategori ID'si</param>
        /// <param name="category">Güncellenmiþ kategori bilgileri</param>
        /// <returns>Baþarý durumu</returns>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] Category category)
        {
            if (id != category.Id)
            {
                return BadRequest(new { message = "ID uyuþmazlýðý" });
            }

            var existingCategory = await _context.Categories.FindAsync(id);
            if (existingCategory == null || existingCategory.IsDeleted)
            {
                return NotFound(new { message = "Kategori bulunamadý" });
            }

            try
            {
                existingCategory.Name = category.Name;
                existingCategory.Description = category.Description;
                existingCategory.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Güncelleme sýrasýnda hata oluþtu", error = ex.Message });
            }
        }

        /// <summary>
        /// Kategori sil (Soft delete)
        /// </summary>
        /// <param name="id">Silinecek kategori ID'si</param>
        /// <returns>Baþarý durumu</returns>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { message = "Kategori bulunamadý" });
            }

            // Kategoriye ait aktif ürün var mý kontrol et
            var hasActiveProducts = await _context.Products
                .AnyAsync(p => p.CategoryId == id && !p.IsDeleted);

            if (hasActiveProducts)
            {
                return BadRequest(new { message = "Bu kategoriye ait aktif ürünler var. Önce ürünleri silin veya baþka kategoriye taþýyýn." });
            }

            category.IsDeleted = true;
            category.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Kategorideki ürün sayýsýný getirir
        /// </summary>
        /// <param name="id">Kategori ID'si</param>
        /// <returns>Ürün sayýsý</returns>
        [HttpGet("{id}/product-count")]
        public async Task<ActionResult<int>> GetProductCount(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null || category.IsDeleted)
            {
                return NotFound(new { message = "Kategori bulunamadý" });
            }

            var count = await _context.Products
                .CountAsync(p => p.CategoryId == id && !p.IsDeleted && p.IsActive);

            return Ok(new { categoryId = id, categoryName = category.Name, productCount = count });
        }
    }
}
