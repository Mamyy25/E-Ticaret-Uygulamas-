using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;
using ECommerce.Models;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ServicePackagesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ServicePackagesApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record ServicePackageDto(
            string Name,
            string Description,
            decimal Price,
            int DurationMinutes,
            string? ImageUrl,
            string? Tags,
            bool IsActive,
            bool IsFeatured
        );

        // Mağazaya ait tüm paketler — public
        [HttpGet("by-store/{storeId:int}")]
        public async Task<IActionResult> GetByStore(int storeId)
        {
            var packages = await _context.ServicePackages
                .Where(sp => sp.StoreId == storeId && sp.IsActive)
                .OrderByDescending(sp => sp.IsFeatured)
                .ThenBy(sp => sp.Price)
                .Select(sp => new
                {
                    sp.Id,
                    sp.StoreId,
                    sp.Name,
                    sp.Description,
                    sp.Price,
                    sp.DurationMinutes,
                    sp.ImageUrl,
                    sp.Tags,
                    sp.IsFeatured
                })
                .ToListAsync();

            return Ok(packages);
        }

        // Tek paket detayı
        [HttpGet("{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var package = await _context.ServicePackages
                .Include(sp => sp.Store)
                .FirstOrDefaultAsync(sp => sp.Id == id && sp.IsActive);

            if (package == null) return NotFound();

            return Ok(new
            {
                package.Id,
                package.StoreId,
                StoreName = package.Store?.Name,
                package.Name,
                package.Description,
                package.Price,
                package.DurationMinutes,
                package.ImageUrl,
                package.Tags,
                package.IsFeatured
            });
        }

        // Mağaza sahibinin kendi paketleri (yönetim için)
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return BadRequest(new { message = "Mağazanız yok." });

            var packages = await _context.ServicePackages
                .Where(sp => sp.StoreId == store.Id)
                .OrderByDescending(sp => sp.CreatedAt)
                .ToListAsync();

            return Ok(packages);
        }

        // Yeni paket oluştur
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] ServicePackageDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return BadRequest(new { message = "Mağazanız yok." });

            var package = new ServicePackage
            {
                StoreId          = store.Id,
                Name             = dto.Name,
                Description      = dto.Description,
                Price            = dto.Price,
                DurationMinutes  = dto.DurationMinutes,
                ImageUrl         = dto.ImageUrl,
                Tags             = dto.Tags,
                IsActive         = dto.IsActive,
                IsFeatured       = dto.IsFeatured,
                CreatedAt        = DateTime.Now
            };

            _context.ServicePackages.Add(package);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = package.Id }, package);
        }

        // Paket güncelle
        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update(int id, [FromBody] ServicePackageDto dto)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return BadRequest(new { message = "Mağazanız yok." });

            var package = await _context.ServicePackages.FindAsync(id);
            if (package == null) return NotFound();

            var isAdmin = User.FindFirstValue("UserType") == "Admin";
            if (package.StoreId != store.Id && !isAdmin) return Forbid();

            package.Name             = dto.Name;
            package.Description      = dto.Description;
            package.Price            = dto.Price;
            package.DurationMinutes  = dto.DurationMinutes;
            package.ImageUrl         = dto.ImageUrl;
            package.Tags             = dto.Tags;
            package.IsActive         = dto.IsActive;
            package.IsFeatured       = dto.IsFeatured;
            package.UpdatedAt        = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Paket sil
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            if (userId == null) return Unauthorized();

            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            var isAdmin = User.FindFirstValue("UserType") == "Admin";

            var package = await _context.ServicePackages.FindAsync(id);
            if (package == null) return NotFound();

            if (store == null && !isAdmin) return Forbid();
            if (store != null && package.StoreId != store.Id && !isAdmin) return Forbid();

            _context.ServicePackages.Remove(package);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }
    }
}
