using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [Route("api/WorkAreasApi")]
    [ApiController]
    public class WorkAreasApiController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public WorkAreasApiController(ApplicationDbContext db) => _db = db;

        // GET /api/WorkAreasApi/by-store/{storeId}
        [HttpGet("by-store/{storeId}")]
        public async Task<IActionResult> GetByStore(int storeId)
        {
            var areas = await _db.WorkAreas
                .Where(w => w.StoreId == storeId)
                .Select(w => new { w.Id, w.City, w.District, w.RadiusKm })
                .ToListAsync();
            return Ok(areas);
        }

        // GET /api/WorkAreasApi/mine
        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return NotFound("Mağaza bulunamadı.");

            var areas = await _db.WorkAreas
                .Where(w => w.StoreId == store.Id)
                .Select(w => new { w.Id, w.City, w.District, w.RadiusKm })
                .ToListAsync();
            return Ok(areas);
        }

        // POST /api/WorkAreasApi
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] WorkAreaDto dto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var store = await _db.Stores.FirstOrDefaultAsync(s => s.SellerId == userId);
            if (store == null) return NotFound("Mağaza bulunamadı.");

            var area = new WorkArea
            {
                StoreId = store.Id,
                City = dto.City,
                District = dto.District,
                RadiusKm = dto.RadiusKm
            };
            _db.WorkAreas.Add(area);
            await _db.SaveChangesAsync();
            return Ok(new { area.Id, area.City, area.District, area.RadiusKm });
        }

        // DELETE /api/WorkAreasApi/{id}
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var area = await _db.WorkAreas.Include(w => w.Store).FirstOrDefaultAsync(w => w.Id == id);
            if (area == null) return NotFound();
            if (area.Store?.SellerId != userId) return Forbid();

            _db.WorkAreas.Remove(area);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        public record WorkAreaDto(string City, string? District, int? RadiusKm);
    }
}
