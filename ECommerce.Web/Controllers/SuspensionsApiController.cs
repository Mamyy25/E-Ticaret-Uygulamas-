using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ECommerce.Data;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class SuspensionsApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SuspensionsApiController(ApplicationDbContext context)
        {
            _context = context;
        }

        public record SuspendDto(string Reason);

        [HttpPut("users/{id}")]
        [Authorize]
        public async Task<IActionResult> SuspendUser(int id, [FromBody] SuspendDto dto)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.SuspendedAt = DateTime.Now;
            user.SuspensionReason = dto.Reason;
            user.SuspendedByAdminId = GetAdminId();
            await _context.SaveChangesAsync();

            return Ok(new { message = "Kullanıcı askıya alındı." });
        }

        [HttpPut("users/{id}/lift")]
        [Authorize]
        public async Task<IActionResult> LiftUserSuspension(int id)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.SuspendedAt = null;
            user.SuspensionReason = null;
            user.SuspendedByAdminId = null;
            user.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Askı kaldırıldı." });
        }

        [HttpPut("stores/{id}")]
        [Authorize]
        public async Task<IActionResult> SuspendStore(int id, [FromBody] SuspendDto dto)
        {
            if (!IsAdmin()) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.Status = "Suspended";
            store.SuspendedAt = DateTime.Now;
            store.SuspensionReason = dto.Reason;
            store.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mağaza askıya alındı." });
        }

        [HttpPut("stores/{id}/lift")]
        [Authorize]
        public async Task<IActionResult> LiftStoreSuspension(int id)
        {
            if (!IsAdmin()) return Forbid();

            var store = await _context.Stores.FindAsync(id);
            if (store == null) return NotFound();

            store.Status = "Active";
            store.SuspendedAt = null;
            store.SuspensionReason = null;
            store.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Mağaza askısı kaldırıldı." });
        }

        private int? GetAdminId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(claim, out var id) ? id : null;
        }

        private bool IsAdmin() => User.FindFirst("UserType")?.Value == "Admin";
    }
}
