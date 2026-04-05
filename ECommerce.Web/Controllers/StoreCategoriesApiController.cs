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
    public class StoreCategoriesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StoreCategoriesApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/StoreCategoriesApi
        // Get all categories for a specific store
        [HttpGet("store/{storeId}")]
        public async Task<ActionResult<IEnumerable<StoreCategory>>> GetCategoriesForStore(int storeId)
        {
            var categories = await _context.StoreCategories
                .Where(sc => sc.StoreId == storeId)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/StoreCategoriesApi/MyCategories
        [HttpGet("MyCategories")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<StoreCategory>>> GetMyCategories()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            
            if (store == null) return NotFound(new { message = "Mağazanız yok" });

            var categories = await _context.StoreCategories
                .Where(sc => sc.StoreId == store.Id)
                .ToListAsync();

            return Ok(categories);
        }

        // POST: api/StoreCategoriesApi/MyCategories
        [HttpPost("MyCategories")]
        [Authorize]
        public async Task<ActionResult<StoreCategory>> CreateMyCategory(StoreCategory newCategory)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            
            if (store == null) return NotFound(new { message = "Mağazanız yok" });

            newCategory.StoreId = store.Id;
            _context.StoreCategories.Add(newCategory);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategoriesForStore), new { storeId = store.Id }, newCategory);
        }

        // DELETE: api/StoreCategoriesApi/MyCategories/5
        [HttpDelete("MyCategories/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteMyCategory(int id)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            
            if (store == null) return NotFound(new { message = "Mağazanız yok" });

            var category = await _context.StoreCategories
                .FirstOrDefaultAsync(sc => sc.Id == id && sc.StoreId == store.Id);

            if (category == null) return NotFound();

            _context.StoreCategories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kategori silindi." });
        }
    }
}
