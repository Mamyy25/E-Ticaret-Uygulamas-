using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class StoreApplicationsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StoreApplicationsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record RejectDto(string Reason);

        [HttpGet("pending")]
        [Authorize]
        public async Task<IActionResult> GetPendingStores()
        {
            if (!IsAdmin()) return Forbid();

            var stores = await _context.Stores
                .Include(s => s.Seller)
                .Where(s => s.Status == "Pending")
                .OrderBy(s => s.CreatedAt)
                .Select(s => new
                {
                    s.Id, s.Name, s.StoreType, s.Status, s.CreatedAt,
                    Seller = s.Seller == null ? null : new { s.Seller.Id, s.Seller.FullName, s.Seller.Email, s.Seller.Phone }
                }).ToListAsync();

            return Ok(stores);
        }

        [HttpPut("{id}/approve")]
        [Authorize]
        public async Task<IActionResult> ApproveStore(int id)
        {
            if (!IsAdmin()) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.Status = "Active";
            store.IsActive = true;
            store.ApprovedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mağaza onaylandı." });
        }

        [HttpPut("{id}/reject")]
        [Authorize]
        public async Task<IActionResult> RejectStore(int id, [FromBody] RejectDto dto)
        {
            if (!IsAdmin()) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.Status = "Rejected";
            store.IsActive = false;
            store.RejectionReason = dto.Reason;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Başvuru reddedildi." });
        }

        private bool IsAdmin() => User.FindFirst("UserType")?.Value == "Admin";
    }
}
